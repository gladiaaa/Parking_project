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

// Helpers
function jsonResponse(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getAuthUser(): ?array {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
        $token = $matches[1];
        $stmt = pdo()->prepare('SELECT * FROM users WHERE api_token = ?');
        $stmt->execute([$token]);
        return $stmt->fetch() ?: null;
    }
    return null;
}

function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['success' => false, 'error' => 'Non autorisé'], 401);
    }
    return $user;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Router simple
try {
    // Health check
    if ($path === '/health' || $path === '/api/health') {
        jsonResponse([
            'ok' => true,
            'php' => PHP_VERSION,
            'timestamp' => date('c')
        ]);
    }

    // Test base de données
    if ($path === '/db/ping' || $path === '/api/db/ping') {
        try {
            $ver = pdo()->query('SELECT VERSION() AS v')->fetch()['v'] ?? 'unknown';
            jsonResponse([
                'ok' => true,
                'mysql_version' => $ver,
                'database' => env('DB_NAME', 'parking_app')
            ]);
        } catch (Throwable $e) {
            jsonResponse(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    // API Routes
    if (strpos($path, '/api/') === 0) {
        $route = substr($path, 5); // Enlever '/api/'
        
        // --- AUTHENTIFICATION ---

        // Login
        if ($route === 'auth/login' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            
            $stmt = pdo()->prepare('SELECT * FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password_hash'])) {
                // Générer un nouveau token
                $token = bin2hex(random_bytes(32));
                $update = pdo()->prepare('UPDATE users SET api_token = ? WHERE id = ?');
                $update->execute([$token, $user['id']]);
                
                jsonResponse([
                    'success' => true,
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'firstname' => $user['firstname'],
                        'lastname' => $user['lastname'],
                        'role' => $user['role'],
                        'typeAbonnement' => $user['type_abonnement'],
                        'debutAbonnement' => $user['debut_abonnement'],
                        'finAbonnement' => $user['fin_abonnement']
                    ]
                ]);
            } else {
                jsonResponse(['success' => false, 'error' => 'Email ou mot de passe incorrect'], 401);
            }
        }

        // Register
        if ($route === 'auth/register' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = trim($data['email'] ?? '');
            $password = $data['password'] ?? '';
            $firstname = trim($data['firstname'] ?? '');
            $lastname = trim($data['lastname'] ?? '');
            $role = $data['role'] ?? 'user';

            if (empty($email) || empty($password) || empty($firstname) || empty($lastname)) {
                jsonResponse(['success' => false, 'error' => 'Tous les champs sont obligatoires'], 400);
            }

            // Vérifier email existant
            $stmt = pdo()->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                jsonResponse(['success' => false, 'error' => 'Cet email est déjà utilisé'], 400);
            }

            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            $token = bin2hex(random_bytes(32));

            $stmt = pdo()->prepare('
                INSERT INTO users (email, password_hash, firstname, lastname, role, api_token)
                VALUES (?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$email, $passwordHash, $firstname, $lastname, $role, $token]);
            $userId = pdo()->lastInsertId();

            jsonResponse([
                'success' => true,
                'message' => 'Compte créé avec succès',
                'token' => $token,
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'firstname' => $firstname,
                    'lastname' => $lastname,
                    'role' => $role
                ]
            ], 201);
        }

        // Me (Current User)
        if ($route === 'auth/me' && $method === 'GET') {
            $user = requireAuth();
            jsonResponse([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'firstname' => $user['firstname'],
                    'lastname' => $user['lastname'],
                    'role' => $user['role'],
                    'typeAbonnement' => $user['type_abonnement'],
                    'debutAbonnement' => $user['debut_abonnement'],
                    'finAbonnement' => $user['fin_abonnement']
                ]
            ]);
        }

        // --- PARKINGS ---

        // Liste des parkings (Recherche)
        if ($route === 'parkings' && $method === 'GET') {
            $ville = $_GET['ville'] ?? '';
            $vehicule = $_GET['vehicule'] ?? '';
            $dateDebut = $_GET['dateDebut'] ?? null;
            $dateFin = $_GET['dateFin'] ?? null;
            $sort = $_GET['sort'] ?? '';

            // Base query
            $sql = '
                SELECT 
                    p.*,
                    COUNT(ps.service) as nb_services,
                    GROUP_CONCAT(ps.service) as services,
                    GROUP_CONCAT(ptv.type_vehicule) as type_vehicules
                FROM parkings p
                LEFT JOIN parking_services ps ON p.id = ps.parking_id
                LEFT JOIN parking_type_vehicules ptv ON p.id = ptv.parking_id
                WHERE 1=1
            ';
            $params = [];

            if ($ville) {
                $sql .= ' AND (p.ville LIKE ? OR p.adresse LIKE ?)';
                $params[] = "%$ville%";
                $params[] = "%$ville%";
            }

            if ($vehicule) {
                 $sql .= ' AND EXISTS (SELECT 1 FROM parking_type_vehicules ptv2 WHERE ptv2.parking_id = p.id AND ptv2.type_vehicule = ?)';
                 $params[] = $vehicule;
            }

            $sql .= ' GROUP BY p.id';

            // Sorting
            if ($sort === 'prix_asc') $sql .= ' ORDER BY p.tarif_horaire ASC';
            elseif ($sort === 'prix_desc') $sql .= ' ORDER BY p.tarif_horaire DESC';
            elseif ($sort === 'note') $sql .= ' ORDER BY p.note DESC';
            else $sql .= ' ORDER BY p.id ASC';

            $stmt = pdo()->prepare($sql);
            $stmt->execute($params);
            $parkings = $stmt->fetchAll();

            // Calculate availability if dates are provided
            if ($dateDebut && $dateFin) {
                foreach ($parkings as &$parking) {
                    $stmt = pdo()->prepare('
                        SELECT COUNT(*) as count 
                        FROM reservations 
                        WHERE parking_id = ? 
                        AND statut = "confirmée"
                        AND (
                            (date_debut < ? AND date_fin > ?)
                        )
                    ');
                    $stmt->execute([$parking['id'], $dateFin, $dateDebut]);
                    $reserved = $stmt->fetch()['count'];
                    $parking['places_disponibles'] = max(0, $parking['nombre_places'] - $reserved);
                }
            } else {
                foreach ($parkings as &$parking) {
                     $parking['places_disponibles'] = $parking['nombre_places'];
                }
            }

            // Nettoyage des tableaux
            foreach ($parkings as &$p) {
                $p['services'] = $p['services'] ? array_values(array_unique(explode(',', $p['services']))) : [];
                $p['type_vehicules'] = $p['type_vehicules'] ? array_values(array_unique(explode(',', $p['type_vehicules']))) : [];
            }

            jsonResponse([
                'success' => true,
                'parkings' => $parkings,
                'total' => count($parkings)
            ]);
        }

        // Détails parking
        if (preg_match('#^parkings/(\d+)$#', $route, $matches) && $method === 'GET') {
            $parkingId = (int)$matches[1];
            
            $stmt = pdo()->prepare('SELECT * FROM parkings WHERE id = ?');
            $stmt->execute([$parkingId]);
            $parking = $stmt->fetch();
            
            if (!$parking) {
                jsonResponse(['success' => false, 'error' => 'Parking non trouvé'], 404);
            }
            
            // Services & Véhicules
            $stmt = pdo()->prepare('SELECT service FROM parking_services WHERE parking_id = ?');
            $stmt->execute([$parkingId]);
            $parking['services'] = array_column($stmt->fetchAll(), 'service');
            
            $stmt = pdo()->prepare('SELECT type_vehicule FROM parking_type_vehicules WHERE parking_id = ?');
            $stmt->execute([$parkingId]);
            $parking['type_vehicules'] = array_column($stmt->fetchAll(), 'type_vehicule');
            
            jsonResponse(['success' => true, 'parking' => $parking]);
        }

        // Vérifier disponibilité
        if ($route === 'parkings/check-availability' && $method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $parkingId = $data['parkingId'] ?? 0;
            $dateDebut = $data['dateDebut'] ?? '';
            $dateFin = $data['dateFin'] ?? '';

            if (!$parkingId || !$dateDebut || !$dateFin) {
                jsonResponse(['success' => false, 'error' => 'Données incomplètes'], 400);
            }

            $stmt = pdo()->prepare('SELECT nombre_places FROM parkings WHERE id = ?');
            $stmt->execute([$parkingId]);
            $parking = $stmt->fetch();
            
            if (!$parking) {
                jsonResponse(['success' => false, 'error' => 'Parking non trouvé'], 404);
            }

            $stmt = pdo()->prepare('
                SELECT COUNT(*) as count 
                FROM reservations 
                WHERE parking_id = ? 
                AND statut = "confirmée"
                AND (
                    (date_debut < ? AND date_fin > ?)
                )
            ');
            $stmt->execute([$parkingId, $dateFin, $dateDebut]);
            $reserved = $stmt->fetch()['count'];
            
            $available = max(0, $parking['nombre_places'] - $reserved);

            jsonResponse([
                'success' => true,
                'available' => $available > 0,
                'places_disponibles' => $available,
                'parking' => $parking
            ]);
        }

        // --- RESERVATIONS ---

        // Créer une réservation
        if ($route === 'reservations' && $method === 'POST') {
            $user = requireAuth();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $parkingId = $data['parkingId'] ?? 0;
            $dateDebut = $data['date_debut'] ?? '';
            $dateFin = $data['date_fin'] ?? '';
            $vehicule = $data['vehicule'] ?? '';
            $immatriculation = $data['immatriculation'] ?? '';
            $montant = $data['montant'] ?? 0;

            // Validations
            $now = new DateTime();
            $start = new DateTime($dateDebut);
            $end = new DateTime($dateFin);

            if ($start < $now) {
                // TODO: Validation date passée
            }
            if ($end <= $start) {
                jsonResponse(['success' => false, 'error' => 'La date de fin doit être après la date de début'], 400);
            }

            // Vérifier chevauchement pour l'utilisateur
            $stmt = pdo()->prepare('
                SELECT * FROM reservations 
                WHERE user_id = ? 
                AND statut != "annulée"
                AND (
                    (date_debut < ? AND date_fin > ?)
                )
            ');
            $stmt->execute([$user['id'], $dateFin, $dateDebut]);
            if ($stmt->fetch()) {
                jsonResponse(['success' => false, 'error' => 'Vous avez déjà une réservation sur cette période'], 409);
            }

            // Vérifier disponibilité
            $stmt = pdo()->prepare('SELECT nombre_places FROM parkings WHERE id = ?');
            $stmt->execute([$parkingId]);
            $parking = $stmt->fetch();
            
            $stmt = pdo()->prepare('
                SELECT COUNT(*) as count 
                FROM reservations 
                WHERE parking_id = ? 
                AND statut = "confirmée"
                AND (
                    (date_debut < ? AND date_fin > ?)
                )
            ');
            $stmt->execute([$parkingId, $dateFin, $dateDebut]);
            $reserved = $stmt->fetch()['count'];
            
            if (($parking['nombre_places'] - $reserved) <= 0) {
                jsonResponse(['success' => false, 'error' => 'Plus de places disponibles'], 409);
            }

            // Insertion
            $stmt = pdo()->prepare('
                INSERT INTO reservations (user_id, parking_id, date_debut, date_fin, vehicule, immatriculation, montant, statut)
                VALUES (?, ?, ?, ?, ?, ?, ?, "confirmée")
            ');
            $stmt->execute([$user['id'], $parkingId, $dateDebut, $dateFin, $vehicule, $immatriculation, $montant]);
            
            jsonResponse([
                'success' => true, 
                'message' => 'Réservation confirmée',
                'reservation_id' => pdo()->lastInsertId()
            ], 201);
        }

        // Mes réservations
        if ($route === 'reservations' && $method === 'GET') {
            $user = requireAuth();
            
            $stmt = pdo()->prepare('
                SELECT r.*, p.nom as parking_nom, p.adresse as parking_adresse, p.ville as parking_ville, p.image as parking_image
                FROM reservations r
                JOIN parkings p ON r.parking_id = p.id
                WHERE r.user_id = ?
                ORDER BY r.date_creation DESC
            ');
            $stmt->execute([$user['id']]);
            $reservations = $stmt->fetchAll();
            
            jsonResponse(['success' => true, 'reservations' => $reservations]);
        }

        // Annuler réservation
        if (preg_match('#^reservations/(\d+)/cancel$#', $route, $matches) && $method === 'POST') {
            $user = requireAuth();
            $reservationId = (int)$matches[1];
            
            $stmt = pdo()->prepare('SELECT * FROM reservations WHERE id = ? AND user_id = ?');
            $stmt->execute([$reservationId, $user['id']]);
            $reservation = $stmt->fetch();
            
            if (!$reservation) {
                jsonResponse(['success' => false, 'error' => 'Réservation non trouvée'], 404);
            }
            
            $stmt = pdo()->prepare('UPDATE reservations SET statut = "annulée", date_annulation = ? WHERE id = ?');
            $stmt->execute([(new DateTime())->format('Y-m-d H:i:s'), $reservationId]);
            
            jsonResponse(['success' => true, 'message' => 'Réservation annulée']);
        }
    }

    // Route par défaut
    jsonResponse(['error' => 'Route non trouvée'], 404);

} catch (Throwable $e) {
    jsonResponse([
        'error' => 'Erreur serveur',
        'message' => $e->getMessage()
    ], 500);
}
