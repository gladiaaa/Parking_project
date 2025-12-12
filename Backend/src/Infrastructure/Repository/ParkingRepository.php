<?php
declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Infrastructure\Database\DatabaseConnection;
use PDO;

class ParkingRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = DatabaseConnection::getPDO();
    }

    public function findAll(array $filters = [], ?string $sort = null): array {
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

        if (!empty($filters['ville'])) {
            $sql .= ' AND (p.ville LIKE ? OR p.adresse LIKE ?)';
            $params[] = "%{$filters['ville']}%";
            $params[] = "%{$filters['ville']}%";
        }

        if (!empty($filters['vehicule'])) {
             $sql .= ' AND EXISTS (SELECT 1 FROM parking_type_vehicules ptv2 WHERE ptv2.parking_id = p.id AND ptv2.type_vehicule = ?)';
             $params[] = $filters['vehicule'];
        }

        $sql .= ' GROUP BY p.id';

        if ($sort === 'prix_asc') $sql .= ' ORDER BY p.tarif_horaire ASC';
        elseif ($sort === 'prix_desc') $sql .= ' ORDER BY p.tarif_horaire DESC';
        elseif ($sort === 'note') $sql .= ' ORDER BY p.note DESC';
        else $sql .= ' ORDER BY p.id ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $parkings = $stmt->fetchAll();

        // Clean up arrays
        foreach ($parkings as &$p) {
            $p['services'] = $p['services'] ? array_values(array_unique(explode(',', $p['services']))) : [];
            $p['type_vehicules'] = $p['type_vehicules'] ? array_values(array_unique(explode(',', $p['type_vehicules']))) : [];
        }

        return $parkings;
    }

    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM parkings WHERE id = ?');
        $stmt->execute([$id]);
        $parking = $stmt->fetch();
        
        if (!$parking) return null;

        // Services & Véhicules
        $stmt = $this->pdo->prepare('SELECT service FROM parking_services WHERE parking_id = ?');
        $stmt->execute([$id]);
        $parking['services'] = array_column($stmt->fetchAll(), 'service');
        
        $stmt = $this->pdo->prepare('SELECT type_vehicule FROM parking_type_vehicules WHERE parking_id = ?');
        $stmt->execute([$id]);
        $parking['type_vehicules'] = array_column($stmt->fetchAll(), 'type_vehicule');

        return $parking;
    }

    public function findByOwner(int $ownerId): array {
        $stmt = $this->pdo->prepare('SELECT * FROM parkings WHERE owner_id = ? ORDER BY created_at DESC');
        $stmt->execute([$ownerId]);
        return $stmt->fetchAll();
    }

    public function create(int $ownerId, array $data): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO parkings (owner_id, nom, adresse, ville, nombre_places, tarif_horaire, tarif_journalier, tarif_mensuel, horaire_ouverture, horaire_fermeture)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $ownerId,
            $data['nom'],
            $data['adresse'],
            $data['ville'] ?? 'Paris', // Default city if not provided
            $data['nombre_places'],
            $data['tarif_horaire'],
            $data['tarif_journalier'],
            $data['tarif_mensuel'],
            $data['horaire_ouverture'],
            $data['horaire_fermeture']
        ]);
        return (int)$this->pdo->lastInsertId();
    }
}
