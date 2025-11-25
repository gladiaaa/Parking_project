<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

$router->dispatch($method, $path);
