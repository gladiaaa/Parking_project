<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Infrastructure\Http\Router;
use App\Infrastructure\Security\JwtManager;
use App\Infrastructure\Security\PasswordHasher;

use App\Infrastructure\Persistence\PersistenceFactory;


use App\Infrastructure\Persistence\SqlUserRepository;
use App\Infrastructure\Persistence\SqlParkingRepository;
use App\Infrastructure\Persistence\SqlReservationRepository;
use App\Infrastructure\Persistence\SqlStationnementRepository;

use App\Controller\AuthController;
use App\Controller\Auth2FAController;
use App\Controller\MeController;
use App\Controller\ReservationController;
use App\Controller\ParkingController;
use App\Controller\OwnerParkingController;

use App\UseCase\Auth\LoginUser;
use App\UseCase\Auth\RegisterUser;
use App\UseCase\Auth\RefreshToken;
use App\UseCase\Auth\StartTwoFactor;
use App\UseCase\Auth\VerifyTwoFactor;
use App\UseCase\Auth\Mailer;
use App\UseCase\Auth\SmsSender;
use App\UseCase\Auth\TotpVerifier;

use App\UseCase\Parking\GetParkingDetails;
use App\UseCase\Parking\CheckAvailability;
use App\UseCase\Parking\CalculateOccupancy;
use App\UseCase\Parking\CreateParking;


use App\UseCase\Billing\BillingCalculator;
use App\UseCase\CreateReservation;
use App\UseCase\Reservation\EnterReservation;
use App\UseCase\Reservation\ExitReservation;
use App\UseCase\Reservation\GetInvoiceHtml;

use App\UseCase\Owner\ListOwnerParkings;
use App\UseCase\Owner\ListParkingReservationsForOwner;
use App\UseCase\Owner\ListActiveStationnementsForOwner;
use App\UseCase\Owner\GetMonthlyRevenueForOwner;


// =====================
// ENV
// =====================
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

define('APP_ROOT', realpath(__DIR__ . '/..'));        // => D:\...\Backend
define('STORAGE_DIR', APP_ROOT . DIRECTORY_SEPARATOR . 'var' . DIRECTORY_SEPARATOR . 'storage');

// =====================
// Helpers
// =====================
function cors(): void
{
    header('Access-Control-Allow-Origin: ' . ($_ENV['APP_ORIGIN'] ?? '*'));
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Content-Type: application/json; charset=utf-8');
}

function pdo(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;

    $dsn = 'mysql:host=' . $_ENV['DB_HOST'] .
        ';dbname=' . $_ENV['DB_NAME'] .
        ';charset=' . ($_ENV['DB_CHARSET'] ?? 'utf8mb4');

    $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

// =====================
// CORS + preflight
// =====================
cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// =====================
// Infra / Repos
// =====================
$db = pdo();

$userRepository = new SqlUserRepository($db);
$parkingRepository = new SqlParkingRepository($db);

// Switchable (sql/json) WITHOUT touching UseCases

$reservationRepository = PersistenceFactory::reservationRepository($db);
$stationnementRepository = PersistenceFactory::stationnementRepository($db, $reservationRepository);

$passwordHasher = new PasswordHasher();

$jwtManager = new JwtManager(
    $_ENV['JWT_SECRET'],
    (int)$_ENV['JWT_ACCESS_TTL'],
    (int)$_ENV['JWT_REFRESH_TTL']
);

// =====================
// Fake providers (2FA)
// =====================
$mailer = new class implements Mailer {
    public function sendTwoFactorCodeEmail(string $to, string $code): void
    {
        error_log("[2FA EMAIL] $to -> code $code");
    }
};

$smsSender = new class implements SmsSender {
    public function sendTwoFactorSms(string $phone, string $code): void
    {
        error_log("[2FA SMS] $phone -> code $code");
    }
};

$totpVerifier = new class implements TotpVerifier {
    public function verify(string $secret, string $code): bool
    {
        return true;
    }
};

// =====================
// UseCases
// =====================
// Auth
$loginUser = new LoginUser($userRepository, $passwordHasher);
$registerUser = new RegisterUser($userRepository, $passwordHasher);
$refreshToken = new RefreshToken($jwtManager, $userRepository);
$startTwoFA = new StartTwoFactor($userRepository, $mailer, $smsSender);
$verify2FA = new VerifyTwoFactor($userRepository, $jwtManager, $totpVerifier);

// Parking
$getParkingDetails = new GetParkingDetails($parkingRepository);
$occupancy = new CalculateOccupancy($stationnementRepository, $reservationRepository);
$checkAvailability = new CheckAvailability($parkingRepository, $occupancy);
$createParking = new CreateParking($parkingRepository);

// Reservations
$createReservation = new CreateReservation($parkingRepository, $reservationRepository, $occupancy);

$billing = new BillingCalculator();
$enterReservation = new EnterReservation($reservationRepository, $stationnementRepository);
$exitReservation = new ExitReservation($reservationRepository, $stationnementRepository, $parkingRepository, $billing);
$getInvoiceHtml = new GetInvoiceHtml($reservationRepository, $stationnementRepository, $parkingRepository);

// Owner
$listOwnerParkings = new ListOwnerParkings($parkingRepository);
$listParkingReservationsForOwner = new ListParkingReservationsForOwner($parkingRepository, $reservationRepository);
$listActiveStationnementsForOwner = new ListActiveStationnementsForOwner($parkingRepository, $stationnementRepository);
$getMonthlyRevenueForOwner = new GetMonthlyRevenueForOwner($parkingRepository, $stationnementRepository);
// =====================
// Controllers
// =====================
$meController = new MeController($jwtManager, $userRepository);

$authController = new AuthController(
    $loginUser,
    $refreshToken,
    $registerUser,
    $startTwoFA,
    $jwtManager
);

$auth2FAController = new Auth2FAController($verify2FA, $jwtManager);


$ownerParkingController = new OwnerParkingController(
    $jwtManager,
    $listOwnerParkings,
    $listParkingReservationsForOwner,
    $listActiveStationnementsForOwner,
    $createParking,
    $getMonthlyRevenueForOwner
);

$parkingController = new ParkingController(
    $jwtManager,
    $getParkingDetails,
    $checkAvailability,
    $stationnementRepository
);

$reservationController = new ReservationController(
    $createReservation,
    $reservationRepository,
    $jwtManager,
    $enterReservation,
    $exitReservation,
    $getInvoiceHtml
);



// =====================
// Router
// =====================
$router = new Router();

$router
    ->get('/health', fn() => print json_encode(['ok' => true]))

    // Auth / me
    ->get('/api/me', [$meController, 'me'])
    ->post('/api/auth/login', [$authController, 'login'])
    ->post('/api/auth/register', [$authController, 'register'])
    ->post('/api/auth/refresh', [$authController, 'refresh'])
    ->post('/api/auth/logout', [$authController, 'logout'])
    ->post('/api/auth/2fa/verify', [$auth2FAController, 'verify'])

    // Parking
    ->get('/api/parkings/details', [$parkingController, 'details'])
    ->get('/api/parkings/availability', [$parkingController, 'availability'])
    ->get('/api/parkings/occupancy-now', [$parkingController, 'occupancyNow'])

    // Owner
    ->get('/api/owner/parkings', [$ownerParkingController, 'listMyParkings'])
    ->get('/api/owner/parkings/{id}/reservations', [$ownerParkingController, 'listParkingReservations'])
    ->get('/api/owner/parkings/{id}/stationnements/active', [$ownerParkingController, 'listActiveStationnements'])
    ->get('/api/owner/parkings/{id}/revenue', [$ownerParkingController, 'monthlyRevenue'])
    ->post('/api/owner/parkings', [$ownerParkingController, 'createParking'])

    // Reservations
    ->get('/api/reservations/me', [$reservationController, 'myReservations'])
    ->post('/api/reservations', [$reservationController, 'create'])
    ->post('/api/reservations/{id}/enter', [$reservationController, 'enter'])
    ->post('/api/reservations/{id}/exit', [$reservationController, 'exit'])
    ->get('/api/reservations/{id}/invoice', [$reservationController, 'invoice']);

