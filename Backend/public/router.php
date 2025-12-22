<?php
declare(strict_types=1);

use App\Infrastructure\Http\Router;

$router = require __DIR__ . '/../src/bootstrap.php';

if (!$router instanceof Router) {
    throw new RuntimeException('src/bootstrap.php must return an instance of ' . Router::class);
}

return $router;
