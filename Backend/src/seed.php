<?php
require __DIR__ . '/bootstrap.php';

$pdo = pdo();

echo "Seeding database...\n";

// 1. Create Owner
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute(['owner@example.com']);
$owner = $stmt->fetch();

if (!$owner) {
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, firstname, lastname, role, api_token) VALUES (?, ?, ?, ?, ?, ?)");
    $hash = password_hash('password123', PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(32));
    $stmt->execute(['owner@example.com', $hash, 'Owner', 'Demo', 'owner', $token]);
    $ownerId = $pdo->lastInsertId();
    echo "Created owner (id: $ownerId)\n";
} else {
    $ownerId = $owner['id'];
    echo "Owner exists (id: $ownerId)\n";
}

// 2. Insert Parkings
$parkings = [
    ['Parking Opéra Premium', '15 Rue Scribe, 75009 Paris', 'Paris', 48.8706, 2.3319, 150, 3.50, 25.00, 280.00, '00:00:00', '23:59:59', 4.8],
    ['Station Châtelet', '1 Place du Châtelet, 75001 Paris', 'Paris', 48.8584, 2.3470, 200, 4.00, 30.00, 320.00, '00:00:00', '23:59:59', 4.9],
    ['Parking Gare du Nord', '18 Rue de Dunkerque, 75010 Paris', 'Paris', 48.8809, 2.3553, 300, 3.00, 22.00, 250.00, '00:00:00', '23:59:59', 4.6],
    ['Park Saint-Lazare', '108 Rue Saint-Lazare, 75008 Paris', 'Paris', 48.8756, 2.3262, 120, 4.50, 35.00, 350.00, '06:00:00', '22:00:00', 4.7],
    ['Parking Bastille Central', '120 Rue de Lyon, 75012 Paris', 'Paris', 48.8522, 2.3697, 180, 3.20, 24.00, 270.00, '00:00:00', '23:59:59', 4.5],
    ['Lyon Part-Dieu Premium', '21 Boulevard Vivier Merle, 69003 Lyon', 'Lyon', 45.7606, 4.8564, 250, 2.80, 20.00, 220.00, '00:00:00', '23:59:59', 4.9],
    ['Station Bellecour', '12 Place Bellecour, 69002 Lyon', 'Lyon', 45.7578, 4.8320, 180, 3.50, 26.00, 280.00, '00:00:00', '23:59:59', 4.7],
    ['Parking Vieux-Port', '46 Quai du Port, 13002 Marseille', 'Marseille', 43.2965, 5.3698, 220, 3.00, 22.00, 240.00, '00:00:00', '23:59:59', 4.6]
];

$stmtCheck = $pdo->prepare('SELECT id FROM parkings WHERE nom = ?');
$stmtInsert = $pdo->prepare("INSERT INTO parkings (owner_id, nom, adresse, ville, latitude, longitude, nombre_places, tarif_horaire, tarif_journalier, tarif_mensuel, horaire_ouverture, horaire_fermeture, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

foreach ($parkings as $p) {
    $stmtCheck->execute([$p[0]]);
    if (!$stmtCheck->fetch()) {
        $stmtInsert->execute(array_merge([$ownerId], $p));
        echo "Inserted parking: {$p[0]}\n";
        $pId = $pdo->lastInsertId();

        // Add services and vehicles
        $services = ['Couvert', 'Sécurisé', 'Vidéo-surveillance', 'Bornes électriques', 'Accès handicapé'];
        $vehicles = ['Voiture', 'Moto', 'Vélo', 'Utilitaire'];
        
        // Randomly assign services and vehicles
        $myServices = array_rand(array_flip($services), rand(2, 5));
        if (!is_array($myServices)) $myServices = [$myServices];
        
        $stmtSvc = $pdo->prepare("INSERT INTO parking_services (parking_id, service) VALUES (?, ?)");
        foreach ($myServices as $svc) {
            $stmtSvc->execute([$pId, $svc]);
        }

        $myVehicles = array_rand(array_flip($vehicles), rand(1, 3));
        if (!is_array($myVehicles)) $myVehicles = [$myVehicles];

        $stmtVeh = $pdo->prepare("INSERT INTO parking_type_vehicules (parking_id, type_vehicule) VALUES (?, ?)");
        foreach ($myVehicles as $veh) {
            $stmtVeh->execute([$pId, $veh]);
        }
    }
}

echo "Seeding complete.\n";
