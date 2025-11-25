<?php
declare(strict_types=1);

namespace App\Infrastructure\Http;

use ReflectionMethod;
use App\Infrastructure\Http\IsGranted; 

final class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): self
    {
        return $this->map('GET', $path, $handler);
    }
    public function post(string $path, callable $handler): self
    {
        return $this->map('POST', $path, $handler);
    }
    public function map(string $method, string $path, callable $handler): self
    {
        $this->routes[$method][$path] = $handler;
        return $this;
    }

    public function dispatch(string $method, string $path): void
    {
        $handler = $this->routes[$method][$path] ?? null;
        if (!$handler) {
            Response::json(['error' => 'Not Found'], 404);
            return;
        }

        if (is_array($handler) && is_object($handler[0])) {
            $ref = new ReflectionMethod($handler[0], $handler[1]);
            foreach ($ref->getAttributes(IsGranted::class) as $a) {
                /** @var IsGranted $guard */
                $guard = $a->newInstance();
                $guard->assert();
            }
            
        }
        
        call_user_func($handler);
    }
}
