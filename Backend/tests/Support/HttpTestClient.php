<?php
declare(strict_types=1);

namespace Tests\Support;

use App\Infrastructure\Http\Router;

/**
 * Mini client HTTP pour Router::dispatch(), en mode PHP CLI (PHPUnit).
 * - reset globals + headers
 * - support JSON via php://input
 * - support form POST via $_POST (application/x-www-form-urlencoded)
 * - capture output + status + headers (si dispo)
 */
final class HttpTestClient
{
    public function __construct(private readonly Router $router) {}

    /**
     * @param array{
     *   method?: string,
     *   path?: string,
     *   query?: array<string, scalar>,
     *   cookies?: array<string, string>,
     *   headers?: array<string, string>,
     *   json?: array<mixed>|null,
     *   form?: array<string, scalar>|null,
     *   raw?: string|null
     * } $req
     *
     * @return array{status:int, json:array<mixed>|null, raw:string, headers:array<int,string>}
     */
    public function request(array $req): array
    {
        $method  = strtoupper($req['method'] ?? 'GET');
        $path    = $req['path'] ?? '/';
        $query   = $req['query'] ?? [];
        $cookies = $req['cookies'] ?? [];
        $headers = $req['headers'] ?? [];
        $json    = $req['json'] ?? null;
        $form    = $req['form'] ?? null;
        $raw     = $req['raw'] ?? null;

        // --- Reset globals
        $_GET = [];
        $_POST = [];
        $_COOKIE = [];
        $_SERVER = [];

        // --- Reset headers between calls (IMPORTANT)
        if (function_exists('header_remove')) {
            header_remove();
        }

        // --- Query
        foreach ($query as $k => $v) {
            $_GET[$k] = (string)$v;
        }

        // --- Cookies
        foreach ($cookies as $k => $v) {
            $_COOKIE[$k] = $v;
        }

        // --- Server basics
        $_SERVER['REQUEST_METHOD'] = $method;
        $_SERVER['REQUEST_URI'] = $path . (empty($query) ? '' : '?' . http_build_query($query));

        // --- Headers -> $_SERVER['HTTP_...']
        foreach ($headers as $k => $v) {
            $key = 'HTTP_' . strtoupper(str_replace('-', '_', $k));
            $_SERVER[$key] = $v;
        }

        // -----------------------------------------------------------------
        // BODY handling
        // Priority:
        // 1) raw (if provided)
        // 2) form (fills $_POST)
        // 3) json (fills php://input AND also $_POST fallback)
        // -----------------------------------------------------------------

        $body = '';

        // 1) Raw
        if (is_string($raw)) {
            $body = $raw;
            $this->installPhpInputStream($body);
        }

        // 2) Form
        if ($raw === null && is_array($form)) {
            foreach ($form as $k => $v) {
                $_POST[$k] = (string)$v;
            }
            $_SERVER['CONTENT_TYPE'] = 'application/x-www-form-urlencoded';
            $body = http_build_query($form);
            $this->installPhpInputStream($body); // optionnel, mais safe si un controller lit php://input
        }

        // 3) JSON
        if ($raw === null && $form === null && is_array($json)) {
            $body = json_encode($json, JSON_UNESCAPED_UNICODE) ?: '';
            $_SERVER['CONTENT_TYPE'] = 'application/json';

            // ✅ fallback: certains controllers lisent $_POST au lieu de php://input
            // On remplit aussi $_POST pour éviter "Missing fields" si c’est le cas.
            foreach ($json as $k => $v) {
                if (is_scalar($v) || $v === null) {
                    $_POST[(string)$k] = (string)$v;
                }
            }

            $this->installPhpInputStream($body);
        }

        if ($raw === null && $form === null && $json === null) {
            $this->installPhpInputStream('');
        }

        // --- Capture output
        ob_start();
        http_response_code(200);

        $this->router->dispatch($method, $path);

        $out = (string)ob_get_clean();
        $status = http_response_code() ?: 200;

        $capturedHeaders = function_exists('headers_list') ? headers_list() : [];

        $decoded = null;
        if ($out !== '') {
            $decoded = json_decode($out, true);
        }

        $this->restorePhpInputStream();

        return [
            'status' => $status,
            'json' => is_array($decoded) ? $decoded : null,
            'raw' => $out,
            'headers' => $capturedHeaders,
        ];
    }

    // ---------------------------------------------------------------------
    // php://input simulation (CLI)
    // ---------------------------------------------------------------------

    private bool $phpInputWrapped = false;

    private function installPhpInputStream(string $body): void
    {
        $GLOBALS['__TEST_PHP_INPUT__'] = $body;

        if ($this->phpInputWrapped) return;

        try {
            stream_wrapper_unregister('php');
            stream_wrapper_register('php', PhpInputStream::class);
            $this->phpInputWrapped = true;
        } catch (\Throwable) {
            $this->phpInputWrapped = false;
        }
    }

    private function restorePhpInputStream(): void
    {
        if (!$this->phpInputWrapped) return;

        try {
            stream_wrapper_restore('php');
        } catch (\Throwable) {
            // ignore
        } finally {
            $this->phpInputWrapped = false;
        }
    }
}

/**
 * Custom stream wrapper for php://input
 */
final class PhpInputStream
{
    private int $pos = 0;
    private string $data = '';

    public function stream_open(string $path, string $mode, int $options, ?string &$opened_path): bool
    {
        if ($path !== 'php://input') return false;
        $this->data = (string)($GLOBALS['__TEST_PHP_INPUT__'] ?? '');
        $this->pos = 0;
        return true;
    }

    public function stream_read(int $count): string
    {
        $chunk = substr($this->data, $this->pos, $count);
        $this->pos += strlen($chunk);
        return $chunk;
    }

    public function stream_eof(): bool
    {
        return $this->pos >= strlen($this->data);
    }

    public function stream_stat(): array
    {
        return [];
    }

    public function stream_seek(int $offset, int $whence = SEEK_SET): bool
    {
        $len = strlen($this->data);

        if ($whence === SEEK_SET) $newPos = $offset;
        elseif ($whence === SEEK_CUR) $newPos = $this->pos + $offset;
        elseif ($whence === SEEK_END) $newPos = $len + $offset;
        else return false;

        if ($newPos < 0) return false;
        $this->pos = $newPos;
        return true;
    }
}
