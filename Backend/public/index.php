<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

// bootstrap.php a déjà appelé cors() + géré OPTIONS
// Donc ici on ne refait pas cors/preflight.

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path   = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

$router->dispatch($method, $path);
