<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

cors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

use App\Controller\AuthController;
use App\Controller\MeController;
use App\Controller\Auth2FAController;

/** @var \App\Infrastructure\Http\Router $router */
/** @var AuthController $authController */
/** @var MeController $meController */
/** @var Auth2FAController $auth2FAController */

// ROUTES AUTH
$router->post('/api/auth/login', [$authController, 'login']);
$router->post('/api/auth/register', [$authController, 'register']);
$router->post('/api/auth/refresh', [$authController, 'refresh']);
$router->post('/api/auth/logout', [$authController, 'logout']);

// 2FA
$router->post('/api/auth/2fa/start', [$auth2FAController, 'start']);
$router->post('/api/auth/2fa/verify', [$auth2FAController, 'verify']);

// ME
$router->get('/api/me', [$meController, 'me']);

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

$router->dispatch($method, $path);
