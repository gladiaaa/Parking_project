<?php

declare(strict_types=1);

namespace App\Infrastructure\Http;

use ReflectionMethod;

final class Router
{
    private array $routes = [];

    public function get(string $path, $handler): self
    {
        return $this->map('GET', $path, $handler);
    }

    public function post(string $path, $handler): self
    {
        return $this->map('POST', $path, $handler);
    }

    public function map(string $method, string $path, $handler): self
    {
        $path = rtrim($path, '/');
        if ($path === '')
            $path = '/';

        $this->routes[$method][$path] = $handler;
        return $this;
    }

    public function dispatch(string $method, string $path)
    {
        $path = rtrim($path, '/');
        if ($path === '')
            $path = '/';

        $handler = $this->routes[$method][$path] ?? null;

        if (!$handler) {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            return;
        }

        if (is_array($handler) && is_object($handler[0])) {
            $controller = $handler[0];
            $methodName = $handler[1];

            $ref = new ReflectionMethod($controller, $methodName);
            $attributes = $ref->getAttributes(IsGranted::class);

            foreach ($attributes as $attribute) {
                $instance = $attribute->newInstance();

               
                if (method_exists($controller, 'jwt')) {
                    $jwt = $controller->jwt();
                    $instance->assert($jwt);
                    continue;
                }

                
                if (property_exists($controller, 'jwt')) {
                    try {
                        $instance->assert($controller->jwt);
                        continue;
                    } catch (\Throwable $e) {
                        Response::json(['error' => 'Controller JWT is not accessible'], 500);
                        exit;
                    }
                }

                Response::json(['error' => 'Controller missing JWT'], 500);
                exit;
            }


            return call_user_func($handler);
        }

        if (is_array($handler) && is_string($handler[0])) {
            $obj = new $handler[0]();
            return $obj->{$handler[1]}();
        }

        return call_user_func($handler);
    }
}
