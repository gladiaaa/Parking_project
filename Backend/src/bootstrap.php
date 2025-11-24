<?php
declare(strict_types=1);

use App\Infrastructure\Persistence\SqlUserRepository;
use App\Infrastructure\Security\JwtManager;
use App\Infrastructure\Security\PasswordHasher;
use App\Infrastructure\Http\Router;
use App\Controller\AuthController;
use App\Controller\Auth2FAController;
use App\UseCase\Auth\LoginUser;
use App\UseCase\Auth\RegisterUser;
use App\UseCase\Auth\RefreshToken;
use App\UseCase\Auth\StartTwoFactor;
use App\UseCase\Auth\VerifyTwoFactor;
use App\UseCase\Auth\Mailer;
use App\UseCase\Auth\SmsSender;
use App\UseCase\Auth\TotpVerifier;

require __DIR__ . '/../vendor/autoload.php';

const DB_DSN   = 'mysql:host=127.0.0.1;dbname=parking_app;charset=utf8mb4';
const DB_USER  = 'root';
const DB_PASS  = '';
const APP_ORIGIN = 'http://localhost:3890';
const JWT_SECRET = 'change_me_to_a_strong_key';
const ACCESS_TTL = 900;
const REFRESH_TTL = 2592000;

function cors(): void {
    header('Access-Control-Allow-Origin: '.APP_ORIGIN);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Content-Type: application/json; charset=utf-8');
}

function json($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function pdo(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

// ========== CONTAINER VERY LIGHT ==========

$pdo = pdo();

$userRepository = new SqlUserRepository($pdo);
$passwordHasher = new PasswordHasher();
$jwtManager     = new JwtManager(JWT_SECRET, ACCESS_TTL, REFRESH_TTL);

// implémentations "fake" pour 2FA
$mailer = new class implements Mailer {
    public function sendTwoFactorCodeEmail(string $to, string $code): void {
        error_log("[2FA EMAIL] $to -> code $code");
    }
};
$smsSender = new class implements SmsSender {
    public function sendTwoFactorSms(string $phone, string $code): void {
        error_log("[2FA SMS] $phone -> code $code");
    }
};
$totpVerifier = new class implements TotpVerifier {
    public function verify(string $secret, string $code): bool {
        return true; // temporaire
    }
};

// Use cases
$loginUser = new LoginUser($userRepository, $passwordHasher);
$registerUser = new RegisterUser($userRepository, $passwordHasher);
$refreshToken = new RefreshToken($jwtManager, $userRepository);
$startTwoFA   = new StartTwoFactor($userRepository, $mailer, $smsSender);
$verify2FA    = new VerifyTwoFactor($userRepository, $jwtManager, $totpVerifier);

// Controllers
$meController = new MeController($jwtManager, $userRepository);
$authController   = new AuthController($loginUser, $refreshToken, $registerUser, $startTwoFA, $jwtManager);
$auth2FAController = new Auth2FAController($verify2FA, $jwtManager);

// Router
$router = new Router();
$router
    ->get('/health', fn() => json(['ok' => true, 'php' => PHP_VERSION]))
    ->get('/api/me', [$meController, 'me'])
    ->post('/api/auth/login',    [$authController, 'login'])
    ->post('/api/auth/register', [$authController, 'register'])
    ->post('/api/auth/refresh',  [$authController, 'refresh'])
    ->post('/api/auth/logout',   [$authController, 'logout'])
    ->post('/api/auth/2fa/verify', [$auth2FAController, 'verify']);
