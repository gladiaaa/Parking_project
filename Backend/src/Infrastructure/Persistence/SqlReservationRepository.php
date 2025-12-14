<?php

namespace App\Infrastructure\Persistence;

use App\Domain\Entity\Reservation;
use App\Domain\Repository\ReservationRepository;
use PDO;

final class SqlReservationRepository implements ReservationRepository
{
    public function __construct(private PDO $db) {}

    public function save(Reservation $reservation): Reservation
    {
        if ($reservation->id() === null) {
            $stmt = $this->db->prepare("
                INSERT INTO reservations (user_id, parking_id, start_at, end_at, vehicle_type, amount, created_at)
                VALUES (:user_id, :parking_id, :start_at, :end_at, :vehicle_type, :amount, :created_at)
            ");

            $stmt->execute([
                ':user_id' => $reservation->userId(),
                ':parking_id' => $reservation->parkingId(),
                ':start_at' => $reservation->startAt()->format('Y-m-d H:i:s'),
                ':end_at' => $reservation->endAt()->format('Y-m-d H:i:s'),
                ':vehicle_type' => $reservation->vehicleType(),
                ':amount' => $reservation->amount(),
                ':created_at' => $reservation->createdAt()->format('Y-m-d H:i:s'),
            ]);

            return $reservation->withId((int)$this->db->lastInsertId());
        }

        // optional update later
        return $reservation;
    }

    public function findByUserId(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM reservations
            WHERE user_id = :uid
            ORDER BY start_at DESC
        ");
        $stmt->execute([':uid' => $userId]);

        return array_map([$this, 'hydrate'], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function findByParkingId(int $parkingId): array
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM reservations
            WHERE parking_id = :pid
            ORDER BY start_at DESC
        ");
        $stmt->execute([':pid' => $parkingId]);

        return array_map([$this, 'hydrate'], $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as c
            FROM reservations
            WHERE parking_id = :pid
              AND start_at < :end_at
              AND end_at > :start_at
        ");
        $stmt->execute([
            ':pid' => $parkingId,
            ':start_at' => $startAt->format('Y-m-d H:i:s'),
            ':end_at' => $endAt->format('Y-m-d H:i:s'),
        ]);

        return (int)($stmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0);
    }

    private function hydrate(array $row): Reservation
    {
        return new Reservation(
            (int)$row['id'],
            (int)$row['user_id'],
            (int)$row['parking_id'],
            new \DateTimeImmutable($row['start_at']),
            new \DateTimeImmutable($row['end_at']),
            new \DateTimeImmutable($row['created_at']),
            (string)$row['vehicle_type'],
            (float)$row['amount']
        );
    }
}
