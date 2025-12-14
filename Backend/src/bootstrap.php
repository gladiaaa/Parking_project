<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
error_log("BOOT OK");

use Dotenv\Dotenv;

// =======================================
// Load ENV
// =======================================
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// =======================================
// Imports
// =======================================
use App\Infrastructure\Persistence\SqlUserRepository;
use App\Infrastructure\Persistence\SqlParkingRepository;
use App\Infrastructure\Persistence\SqlReservationRepository;
use App\Infrastructure\Security\JwtManager;
use App\Infrastructure\Security\PasswordHasher;
use App\Infrastructure\Http\Router;

use App\Controller\AuthController;
use App\Controller\Auth2FAController;
use App\Controller\MeController;
use App\Controller\ReservationController;


use App\UseCase\CreateReservation;
use App\UseCase\Auth\LoginUser;
use App\UseCase\Auth\RegisterUser;
use App\UseCase\Auth\RefreshToken;
use App\UseCase\Auth\StartTwoFactor;
use App\UseCase\Auth\VerifyTwoFactor;
use App\UseCase\Auth\Mailer;
use App\UseCase\Auth\SmsSender;
use App\UseCase\Auth\TotpVerifier;


// =======================================
// Config
// =======================================

function cors(): void {
    header('Access-Control-Allow-Origin: ' . $_ENV['APP_ORIGIN']);
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

    $dsn = 'mysql:host=' . $_ENV['DB_HOST'] .
           ';dbname=' . $_ENV['DB_NAME'] .
           ';charset=' . $_ENV['DB_CHARSET'];

    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

// =======================================
// Dependency Container
// =======================================

$pdo = pdo();

$userRepository = new SqlUserRepository($pdo);
$passwordHasher = new PasswordHasher();
$parkingRepository = new SqlParkingRepository($pdo);
$reservationRepository = new SqlReservationRepository($pdo);


$jwtManager = new JwtManager(
    $_ENV['JWT_SECRET'],
    (int)$_ENV['JWT_ACCESS_TTL'],
    (int)$_ENV['JWT_REFRESH_TTL']
);

// Fake mailer
$mailer = new class implements Mailer {
    public function sendTwoFactorCodeEmail(string $to, string $code): void {
        error_log("[2FA EMAIL] $to -> code $code");
    }
};

// Fake SMS
$smsSender = new class implements SmsSender {
    public function sendTwoFactorSms(string $phone, string $code): void {
        error_log("[2FA SMS] $phone -> code $code");
    }
};

// Fake TOTP
$totpVerifier = new class implements TotpVerifier {
    public function verify(string $secret, string $code): bool {
        return true;
    }
};

// =======================================
// Use cases
// =======================================

$loginUser = new LoginUser($userRepository, $passwordHasher);
$registerUser = new RegisterUser($userRepository, $passwordHasher);
$refreshToken = new RefreshToken($jwtManager, $userRepository);
$startTwoFA = new StartTwoFactor($userRepository, $mailer, $smsSender);
$verify2FA = new VerifyTwoFactor($userRepository, $jwtManager, $totpVerifier);
$createReservation = new CreateReservation(
    $parkingRepository,
    $reservationRepository
);


// =======================================
// Controllers
// =======================================

$meController = new MeController($jwtManager, $userRepository);
$authController = new AuthController(
    $loginUser,
    $refreshToken,
    $registerUser,
    $startTwoFA,
    $jwtManager
);
$auth2FAController = new Auth2FAController($verify2FA, $jwtManager);
$reservationController = new ReservationController($createReservation, $reservationRepository, $jwtManager);

// =======================================
// Router
// =======================================

$router = new Router();

$router

    ->get('/health', fn() => json(['ok' => true, 'php' => PHP_VERSION]))
    ->get('/api/me', [$meController, 'me'])
    ->get('/api/reservations/me', [$reservationController, 'myReservations'])

    ->post('/api/auth/login', [$authController, 'login'])
    ->post('/api/auth/register', [$authController, 'register'])
    ->post('/api/auth/refresh', [$authController, 'refresh'])
    ->post('/api/auth/logout', [$authController, 'logout'])

    ->post('/api/auth/2fa/verify', [$auth2FAController, 'verify'])

    ->post('/api/reservations', [$reservationController, 'create']);
// =======================================