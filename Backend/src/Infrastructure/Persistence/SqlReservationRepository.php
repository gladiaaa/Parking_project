<?php
declare(strict_types=1);

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

        // Si plus tard tu veux update, tu le feras ici.
        return $reservation;
    }

    public function findById(int $id): ?Reservation
    {
        $stmt = $this->db->prepare("SELECT * FROM reservations WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->hydrate($row) : null;
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

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['c'] ?? 0);
    }

    /**
     * Version "Owner" pour listing simple en tableaux (pas des Entities),
     * avec filtre optionnel from/to.
     */
    public function listByParking(int $parkingId, ?string $from, ?string $to): array
    {
        $sql = '
            SELECT id, user_id, parking_id, start_at, end_at, vehicle_type, amount, created_at
            FROM reservations
            WHERE parking_id = :parking_id
        ';

        $params = ['parking_id' => $parkingId];

        if ($from) {
            $sql .= ' AND end_at >= :from';
            $params['from'] = $from;
        }
        if ($to) {
            $sql .= ' AND start_at <= :to';
            $params['to'] = $to;
        }

        $sql .= ' ORDER BY start_at ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function hydrate(array $row): Reservation
    {
        return new Reservation(
            (int)$row['id'],
            (int)$row['user_id'],
            (int)$row['parking_id'],
            new \DateTimeImmutable((string)$row['start_at']),
            new \DateTimeImmutable((string)$row['end_at']),
            new \DateTimeImmutable((string)$row['created_at']),
            (string)$row['vehicle_type'],
            (float)$row['amount']
        );
    }
    public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int
{
    $stmt = $this->db->prepare('
        SELECT COUNT(*)
        FROM reservations r
        LEFT JOIN stationnements s 
          ON s.reservation_id = r.id
         AND s.exited_at IS NULL
        WHERE r.parking_id = :parking_id
          AND NOT (r.end_at <= :start_at OR r.start_at >= :end_at)
          AND s.id IS NULL
    ');

    $stmt->execute([
        'parking_id' => $parkingId,
        'start_at'   => $startAt,
        'end_at'     => $endAt,
    ]);

    return (int)$stmt->fetchColumn();
}

}
