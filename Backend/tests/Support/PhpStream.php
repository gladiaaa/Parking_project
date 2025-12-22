<?php
declare(strict_types=1);

namespace Tests\Support;

/**
 * Stream wrapper minimal pour simuler php://input pendant les tests.
 * Permet à file_get_contents('php://input') de lire le body injecté.
 */
final class PhpStream
{
    public static string $input = '';

    /**
     
     * @var resource|null
     */
    public $context = null;

    /** @var int */
    private int $pos = 0;

    public function stream_open(string $path, string $mode, int $options, ?string &$opened_path): bool
    {

        $this->pos = 0;
        return $path === 'php://input';
    }

    public function stream_read(int $count): string
    {
        $ret = substr(self::$input, $this->pos, $count);
        $this->pos += strlen($ret);
        return $ret;
    }

    public function stream_eof(): bool
    {
        return $this->pos >= strlen(self::$input);
    }

    public function stream_stat(): array
    {
        return [];
    }

    public function stream_seek(int $offset, int $whence = SEEK_SET): bool
    {
        if ($whence === SEEK_SET) {
            $this->pos = $offset;
            return true;
        }
        if ($whence === SEEK_CUR) {
            $this->pos += $offset;
            return true;
        }
        if ($whence === SEEK_END) {
            $this->pos = strlen(self::$input) + $offset;
            return true;
        }
        return false;
    }
}
