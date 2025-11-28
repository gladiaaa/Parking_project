<?php
declare(strict_types=1);
require __DIR__ . '/../src/bootstrap.php';

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Router simple
try {
    // Health check
    if ($path === '/health' || $path === '/api/health') {
        echo json_encode([
            'ok' => true,
            'php' => PHP_VERSION,
            'timestamp' => date('c')
        ]);
        exit;
    }

    // Test base de données
    if ($path === '/db/ping' || $path === '/api/db/ping') {
        try {
            $ver = pdo()->query('SELECT VERSION() AS v')->fetch()['v'] ?? 'unknown';
            echo json_encode([
                'ok' => true,
                'mysql_version' => $ver,
                'database' => env('DB_NAME', 'parking_app')
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'error' => $e->getMessage()
            ]);
        }
        exit;
    }

    // API Routes
    if (strpos($path, '/api/') === 0) {
        $route = substr($path, 5); // Enlever '/api/'
        
        // Authentification
        if ($route === 'auth/login' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            
            $stmt = pdo()->prepare('SELECT * FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password_hash'])) {
                // Générer un token simple (à remplacer par JWT)
                $token = bin2hex(random_bytes(32));
                
                echo json_encode([
                    'success' => true,
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'firstname' => $user['firstname'],
                        'lastname' => $user['lastname'],
                        'role' => $user['role']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
            }
            exit;
        }

        // Liste des parkings
        if ($route === 'parkings' && $method === 'GET') {
            $stmt = pdo()->query('
                SELECT 
                    p.*,
                    COUNT(DISTINCT ps.service) as nb_services,
                    GROUP_CONCAT(DISTINCT ps.service) as services,
                    GROUP_CONCAT(DISTINCT ptv.type_vehicule) as type_vehicules
                FROM parkings p
                LEFT JOIN parking_services ps ON p.id = ps.parking_id
                LEFT JOIN parking_type_vehicules ptv ON p.id = ptv.parking_id
                GROUP BY p.id
            ');
            $parkings = $stmt->fetchAll();
            
            // Calculer les places disponibles
            foreach ($parkings as &$parking) {
                $stmt = pdo()->prepare('
                    SELECT COUNT(*) as count 
                    FROM reservations 
                    WHERE parking_id = ? 
                    AND statut = "confirmée"
                    AND date_fin > NOW()
                ');
                $stmt->execute([$parking['id']]);
                $reserved = $stmt->fetch()['count'];
                $parking['places_disponibles'] = max(0, $parking['nombre_places'] - $reserved);
            }
            
            echo json_encode([
                'success' => true,
                'parkings' => $parkings,
                'total' => count($parkings)
            ]);
            exit;
        }

        // Détails d'un parking
        if (preg_match('#^parkings/(\d+)$#', $route, $matches) && $method === 'GET') {
            $parkingId = (int)$matches[1];
            
            $stmt = pdo()->prepare('SELECT * FROM parkings WHERE id = ?');
            $stmt->execute([$parkingId]);
            $parking = $stmt->fetch();
            
            if (!$parking) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Parking non trouvé']);
                exit;
            }
            
            // Services
            $stmt = pdo()->prepare('SELECT service FROM parking_services WHERE parking_id = ?');
            $stmt->execute([$parkingId]);
            $parking['services'] = array_column($stmt->fetchAll(), 'service');
            
            // Types de véhicules
            $stmt = pdo()->prepare('SELECT type_vehicule FROM parking_type_vehicules WHERE parking_id = ?');
            $stmt->execute([$parkingId]);
            $parking['type_vehicules'] = array_column($stmt->fetchAll(), 'type_vehicule');
            
            echo json_encode(['success' => true, 'parking' => $parking]);
            exit;
        }

        // Liste des utilisateurs (pour debug)
        if ($route === 'users' && $method === 'GET') {
            $stmt = pdo()->query('SELECT id, email, firstname, lastname, role FROM users');
            echo json_encode($stmt->fetchAll());
            exit;
        }
    }

    // Route par défaut
    http_response_code(404);
    echo json_encode([
        'error' => 'Route non trouvée',
        'path' => $path,
        'method' => $method
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur serveur',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
