<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Entity\Parking;
use App\Domain\Repository\ParkingRepository;
use PDO;

final class SqlParkingRepository implements ParkingRepository
{
    public function __construct(private PDO $db) {}

public function create(array $data): int
{
    $stmt = $this->db->prepare("
        INSERT INTO parkings (owner_id, latitude, longitude, capacity, hourly_rate, opening_time, closing_time)
        VALUES (:owner_id, :lat, :lng, :cap, :rate, :open, :close)
    ");

    $stmt->execute([
        ':owner_id' => (int)($data['owner_id'] ?? 0),
        ':lat'      => (float)($data['latitude'] ?? 0),
        ':lng'      => (float)($data['longitude'] ?? 0),
        ':cap'      => (int)($data['capacity'] ?? 0),
        ':rate'     => (float)($data['hourly_rate'] ?? 0),
        ':open'     => (string)($data['opening_time'] ?? '00:00:00'),
        ':close'    => (string)($data['closing_time'] ?? '23:59:59'),
    ]);

    return (int)$this->db->lastInsertId();
}


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
              closing_time
            FROM parkings
            WHERE id = :id
            LIMIT 1
        ");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $gps = $row['latitude'] . "," . $row['longitude'];

        return new Parking(
            (int)$row['id'],
            (int)$row['capacity'],
            (string)$gps,
            (float)$row['hourly_rate'],
            new \DateTimeImmutable((string)$row['opening_time']),
            new \DateTimeImmutable((string)$row['closing_time']),
            [],
            []
        );
    }

    public function listByOwnerId(int $ownerId): array
    {
        // Ajuste le SELECT selon tes colonnes réelles.
        // Ici je pars sur une table parkings avec owner_id + latitude/longitude/etc.
        $stmt = $this->db->prepare('
            SELECT
              id,
              latitude,
              longitude,
              capacity,
              hourly_rate,
              opening_time,
              closing_time
            FROM parkings
            WHERE owner_id = :owner_id
            ORDER BY id DESC
        ');
        $stmt->execute(['owner_id' => $ownerId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findOwnerIdByParkingId(int $parkingId): ?int
    {
        $stmt = $this->db->prepare('
            SELECT owner_id
            FROM parkings
            WHERE id = :id
            LIMIT 1
        ');
        $stmt->execute(['id' => $parkingId]);

        $ownerId = $stmt->fetchColumn();
        return $ownerId !== false ? (int)$ownerId : null;
    }
}
