<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Entity\Parking;
use App\Domain\Repository\ParkingRepository;
use PDO;

final class SqlParkingRepository implements ParkingRepository
{
    public function __construct(private PDO $db)
    {
    }

    /**
     * Création d’un parking (OWNER only)
     */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO parkings (
                owner_id,
                latitude,
                longitude,
                capacity,
                hourly_rate,
                opening_time,
                closing_time,
                address,
                opening_days
            )
            VALUES (
                :owner_id,
                :lat,
                :lng,
                :cap,
                :rate,
                :open,
                :close,
                :address,
                :opening_days
            )
        ");

        $days = $data['opening_days'] ?? [1,2,3,4,5,6,7];
        if (!is_array($days) || $days === []) {
            $days = [1,2,3,4,5,6,7];
        }

        $stmt->execute([
            ':owner_id'     => (int)($data['owner_id'] ?? 0),
            ':lat'          => (float)($data['latitude'] ?? 0),
            ':lng'          => (float)($data['longitude'] ?? 0),
            ':cap'          => (int)($data['capacity'] ?? 0),
            ':rate'         => (float)($data['hourly_rate'] ?? 0),
            ':open'         => (string)($data['opening_time'] ?? '00:00:00'),
            ':close'        => (string)($data['closing_time'] ?? '23:59:59'),
            ':address'      => (string)($data['address'] ?? ''),
            ':opening_days' => json_encode(array_values($days), JSON_THROW_ON_ERROR),
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Récupération d’un parking par ID (Domain Entity)
     */
    public function findById(int $id): ?Parking
    {
        $stmt = $this->db->prepare("
            SELECT
                id,
                latitude,
                longitude,
                capacity,
                hourly_rate,
                opening_time,
                closing_time,
                address,
                opening_days
            FROM parkings
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $gps = $row['latitude'] . ',' . $row['longitude'];

        // Décodage sécurisé des jours d’ouverture
        try {
            $openingDays = json_decode(
                (string)($row['opening_days'] ?? '[]'),
                true,
                512,
                JSON_THROW_ON_ERROR
            );
        } catch (\Throwable) {
            $openingDays = [1,2,3,4,5,6,7];
        }

        if (!is_array($openingDays) || $openingDays === []) {
            $openingDays = [1,2,3,4,5,6,7];
        }

        return new Parking(
            (int)$row['id'],
            (int)$row['capacity'],
            (string)$gps,
            (float)$row['hourly_rate'],
            new \DateTimeImmutable((string)$row['opening_time']),
            new \DateTimeImmutable((string)$row['closing_time']),
            (string)($row['address'] ?? ''),
            array_map('intval', $openingDays),
            [],
            []
        );
    }

    /**
     * Listing des parkings d’un owner (format brut pour API)
     */
    public function listByOwnerId(int $ownerId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                id,
                latitude,
                longitude,
                capacity,
                hourly_rate,
                opening_time,
                closing_time,
                address,
                opening_days
            FROM parkings
            WHERE owner_id = :owner_id
            ORDER BY id DESC
        ");

        $stmt->execute(['owner_id' => $ownerId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Sécurité / ownership
     */
    public function findOwnerIdByParkingId(int $parkingId): ?int
    {
        $stmt = $this->db->prepare("
            SELECT owner_id
            FROM parkings
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute(['id' => $parkingId]);

        $ownerId = $stmt->fetchColumn();
        return $ownerId !== false ? (int)$ownerId : null;
    }
}
