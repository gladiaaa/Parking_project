<?php
declare(strict_types=1);

namespace App\Infrastructure\Repository;

use App\Infrastructure\Database\DatabaseConnection;
use PDO;

class ReservationRepository {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = DatabaseConnection::getPDO();
    }

    public function countConfirmed(int $parkingId, string $dateDebut, string $dateFin): int {
        $stmt = $this->pdo->prepare('
            SELECT COUNT(*) as count 
            FROM reservations 
            WHERE parking_id = ? 
            AND statut = "confirmée"
            AND (
                (date_debut < ? AND date_fin > ?)
            )
        ');
        $stmt->execute([$parkingId, $dateFin, $dateDebut]);
        return (int)$stmt->fetch()['count'];
    }

    public function hasOverlapForUser(int $userId, string $dateDebut, string $dateFin): bool {
        $stmt = $this->pdo->prepare('
            SELECT 1 FROM reservations 
            WHERE user_id = ? 
            AND statut != "annulée"
            AND (
                (date_debut < ? AND date_fin > ?)
            )
        ');
        $stmt->execute([$userId, $dateFin, $dateDebut]);
        return (bool)$stmt->fetch();
    }

    public function create(int $userId, int $parkingId, string $dateDebut, string $dateFin, string $vehicule, string $immatriculation, float $montant): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO reservations (user_id, parking_id, date_debut, date_fin, vehicule, immatriculation, montant, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, "confirmée")
        ');
        $stmt->execute([$userId, $parkingId, $dateDebut, $dateFin, $vehicule, $immatriculation, $montant]);
        return (int)$this->pdo->lastInsertId();
    }

    public function findByUser(int $userId): array {
        $stmt = $this->pdo->prepare('
            SELECT r.*, p.nom as parking_nom, p.adresse as parking_adresse, p.ville as parking_ville, p.image as parking_image
            FROM reservations r
            JOIN parkings p ON r.parking_id = p.id
            WHERE r.user_id = ?
            ORDER BY r.date_creation DESC
        ');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function findByIdAndUser(int $id, int $userId): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM reservations WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        return $stmt->fetch() ?: null;
    }

    public function cancel(int $id): void {
        $stmt = $this->pdo->prepare('UPDATE reservations SET statut = "annulée", date_annulation = ? WHERE id = ?');
        $stmt->execute([(new \DateTime())->format('Y-m-d H:i:s'), $id]);
    }

    public function getMonthlyRevenue(int $ownerId): float {
        $stmt = $this->pdo->prepare('
            SELECT SUM(r.montant) as total
            FROM reservations r
            JOIN parkings p ON r.parking_id = p.id
            WHERE p.owner_id = ?
            AND r.statut = "confirmée"
            AND strftime("%Y-%m", r.date_creation) = strftime("%Y-%m", "now")
        ');
        $stmt->execute([$ownerId]);
        return (float)($stmt->fetch()['total'] ?? 0);
    }

    public function countActiveByOwner(int $ownerId): int {
        $stmt = $this->pdo->prepare('
            SELECT COUNT(*) as count
            FROM reservations r
            JOIN parkings p ON r.parking_id = p.id
            WHERE p.owner_id = ?
            AND r.statut = "confirmée"
            AND r.date_fin >= datetime("now")
        ');
        $stmt->execute([$ownerId]);
        return (int)$stmt->fetch()['count'];
    }

    public function countActiveStationnementsByOwner(int $ownerId): int {
        $stmt = $this->pdo->prepare('
            SELECT COUNT(*) as count
            FROM reservations r
            JOIN parkings p ON r.parking_id = p.id
            WHERE p.owner_id = ?
            AND r.statut = "confirmée"
            AND r.date_debut <= datetime("now")
            AND r.date_fin >= datetime("now")
        ');
        $stmt->execute([$ownerId]);
        return (int)$stmt->fetch()['count'];
    }
}
