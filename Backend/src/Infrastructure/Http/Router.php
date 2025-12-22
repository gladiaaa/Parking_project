<?php
declare(strict_types=1);

namespace App\Infrastructure\Http;

use ReflectionMethod;

final class Router
{
    /** @var array<string, array<int, array{path:string, handler:mixed, regex:?string, vars:array<int,string>}>> */
    private array $routes = [];

    public function get(string $path, $handler): self { return $this->map('GET', $path, $handler); }
    public function post(string $path, $handler): self { return $this->map('POST', $path, $handler); }

    public function map(string $method, string $path, $handler): self
    {
        $path = rtrim($path, '/');
        if ($path === '') $path = '/';

        [$regex, $vars] = $this->compilePath($path);

        $this->routes[$method][] = [
            'path' => $path,
            'handler' => $handler,
            'regex' => $regex,
            'vars' => $vars,
        ];

        return $this;
    }

public function dispatch(string $method, string $path): void
{
    $path = rtrim($path, '/');
    if ($path === '') $path = '/';

    [$handler, $params] = $this->match($method, $path);

    if (!$handler) {
        Response::json(['error' => 'Not found'], 404);
        return;
    }

    if (is_array($handler) && is_object($handler[0])) {
        $controller = $handler[0];
        $methodName = $handler[1];

        $this->applyGuards($controller, $methodName);

        $this->call($handler, $params);
        return;
    }

    if (is_array($handler) && is_string($handler[0])) {
        $obj = new $handler[0]();
        $this->call([$obj, $handler[1]], $params);
        return;
    }

    $this->call($handler, $params);
}


    private function match(string $method, string $path): array
    {
        $routes = $this->routes[$method] ?? [];

        foreach ($routes as $route) {
            // Exact match first
            if ($route['regex'] === null && $route['path'] === $path) {
                return [$route['handler'], []];
            }

            // Regex match for {vars}
            if ($route['regex'] !== null && preg_match($route['regex'], $path, $m)) {
                $params = [];
                foreach ($route['vars'] as $varName) {
                    if (isset($m[$varName])) {
                        $params[] = ctype_digit($m[$varName]) ? (int)$m[$varName] : $m[$varName];
                    }
                }
                return [$route['handler'], $params];
            }
        }

        return [null, []];
    }

    private function compilePath(string $path): array
    {
        if (strpos($path, '{') === false) {
            return [null, []];
        }

        $vars = [];
        $regex = preg_replace_callback('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', function ($m) use (&$vars) {
            $vars[] = $m[1];
            return '(?P<' . $m[1] . '>[^/]+)';
        }, $path);

        return ['#^' . $regex . '$#', $vars];
    }

    private function applyGuards(object $controller, string $methodName): void
    {
        $ref = new ReflectionMethod($controller, $methodName);
        $attributes = $ref->getAttributes(IsGranted::class);

        foreach ($attributes as $attribute) {
            $instance = $attribute->newInstance();

            // If controller has method jwt(): JwtManager
            if (method_exists($controller, 'jwt')) {
                $instance->assert($controller->jwt());
                continue;
            }

            // If controller has readable property $jwt
            if (property_exists($controller, 'jwt')) {
                try {
                    /** @phpstan-ignore-next-line */
                    $instance->assert($controller->jwt);
                    continue;
                } catch (\Throwable) {
                    Response::json(['error' => 'Controller JWT is not accessible'], 500);
                    app_exit();
                }
            }

            Response::json(['error' => 'Controller missing JWT'], 500);
            app_exit();
        }
    }

    private function call($handler, array $params): void
    {
        if (is_array($handler)) {
            call_user_func_array($handler, $params);
            return;
        }

        // Closure
        call_user_func($handler, ...$params);
    }
}
