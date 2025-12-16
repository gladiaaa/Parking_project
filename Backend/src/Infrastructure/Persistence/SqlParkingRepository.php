<?php

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
        INSERT INTO parkings (latitude, longitude, capacity, hourly_rate, opening_time, closing_time)
        VALUES (:lat, :lng, :cap, :rate, :open, :close)
    ");

    $stmt->execute([
        ':lat' => (float)($data['latitude'] ?? 0),
        ':lng' => (float)($data['longitude'] ?? 0),
        ':cap' => (int)($data['capacity'] ?? 0),
        ':rate' => (float)($data['hourly_rate'] ?? 0),
        ':open' => (string)($data['opening_time'] ?? '00:00:00'),
        ':close' => (string)($data['closing_time'] ?? '23:59:59'),
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
        ");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return null;

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
}
