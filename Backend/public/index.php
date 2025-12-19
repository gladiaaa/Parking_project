<?php
declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php'; // Toujours utile pour l'autoload (si on avait un autoloader PSR-4, ce serait mieux)

// --- AUTOLOAD MANUEL (Pour remplacer Composer temporairement) ---
// Note: Idéalement, on utiliserait "composer dump-autoload", mais ici on fait simple pour que ça marche direct.
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

use App\Controller\AuthController;
use App\Controller\ParkingController;
use App\Controller\ReservationController;
use App\Infrastructure\Repository\UserRepository;

// Headers CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:5173'
];

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *'); // Fallback (or remove if strict)
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Helper pour envoyer la réponse
function sendResponse(array $response): void {
    http_response_code($response['status']);
    
    // Hack: Set cookie if token is present (pour supporter l'auth cookie sans toucher au reste)
    if (isset($response['data']['token'])) {
        setcookie('auth_token', $response['data']['token'], [
            'expires' => time() + 86400,
            'path' => '/',
            'domain' => 'localhost',
            'secure' => false, // false en local
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    }

    echo json_encode($response['data']);
    exit;
}

// Helper Auth (Extraction du token)
function getAuthUser(): ?array {
    $token = null;

    // 1. Essayer via le cookie (prioritaire pour le front)
    if (isset($_COOKIE['auth_token'])) {
        $token = $_COOKIE['auth_token'];
    }

    // 2. Fallback via Authorization header
    if (!$token) {
        $headers = getallheaders();
        $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
            $token = $matches[1];
        }
    }

    if ($token) {
        $repo = new UserRepository();
        return $repo->findByToken($token);
    }
    return null;
}

// Routing
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Nettoyage du path (pour éviter les soucis de trailing slash)
$path = rtrim($path, '/');

try {
    // API Prefix
    if (strpos($path, '/api') === 0) {
        $route = substr($path, 4); // Enlever '/api'
        
        // --- AUTH ---
        $authController = new AuthController();
        
        if ($route === '/auth/login' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            sendResponse($authController->login($data));
        }
        if ($route === '/auth/register' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            sendResponse($authController->register($data));
        }
        if ($route === '/auth/me' && $method === 'GET') {
            sendResponse($authController->me(getAuthUser()));
        }

        // --- PARKINGS ---
        $parkingController = new ParkingController();

        if ($route === '/parkings' && $method === 'GET') {
            sendResponse($parkingController->list($_GET));
        }
        if (preg_match('#^/parkings/(\d+)$#', $route, $matches) && $method === 'GET') {
            sendResponse($parkingController->detail((int)$matches[1]));
        }
        if ($route === '/parkings/check-availability' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            sendResponse($parkingController->checkAvailability($data));
        }

        // --- OWNER ROUTES ---
        if ($route === '/owner/parkings' && $method === 'GET') {
            sendResponse($parkingController->listByOwner(getAuthUser()));
        }
        if ($route === '/parkings' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            sendResponse($parkingController->create(getAuthUser(), $data));
        }
        if ($route === '/owner/stats' && $method === 'GET') {
            sendResponse($parkingController->getStatistics(getAuthUser()));
        }

        // --- RESERVATIONS ---
        $reservationController = new ReservationController();

        if ($route === '/reservations' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            sendResponse($reservationController->create($data, getAuthUser()));
        }
        if ($route === '/reservations' && $method === 'GET') {
            sendResponse($reservationController->list(getAuthUser()));
        }
        if (preg_match('#^/reservations/(\d+)/cancel$#', $route, $matches) && $method === 'POST') {
            sendResponse($reservationController->cancel((int)$matches[1], getAuthUser()));
        }
    }

    // 404
    sendResponse(['status' => 404, 'data' => ['error' => 'Route non trouvée']]);

} catch (Throwable $e) {
    sendResponse([
        'status' => 500, 
        'data' => [
            'error' => 'Erreur serveur', 
            'message' => $e->getMessage()
        ]
    ]);
}
