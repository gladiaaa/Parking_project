<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Entity\Stationnement;
use App\Domain\Repository\StationnementRepository;
use PDO;

final class SqlStationnementRepository implements StationnementRepository
{
    public function __construct(private PDO $db) {}

    public function save(Stationnement $s): Stationnement
    {
        if ($s->id() === null) {
            $stmt = $this->db->prepare("
                INSERT INTO stationnements (reservation_id, entered_at, exited_at, billed_amount, penalty_amount, created_at)
                VALUES (:rid, :entered, :exited, :billed, :penalty, :created)
            ");
            $stmt->execute([
                ':rid' => $s->reservationId(),
                ':entered' => $s->enteredAt()->format('Y-m-d H:i:s'),
                ':exited' => $s->exitedAt()?->format('Y-m-d H:i:s'),
                ':billed' => $s->billedAmount(),
                ':penalty' => $s->penaltyAmount(),
                ':created' => $s->createdAt()->format('Y-m-d H:i:s'),
            ]);

            return $s->withId((int)$this->db->lastInsertId());
        }

        return $s;
    }

    public function findActiveByReservationId(int $reservationId): ?Stationnement
    {
        $stmt = $this->db->prepare("
            SELECT * FROM stationnements
            WHERE reservation_id = :rid AND exited_at IS NULL
            ORDER BY entered_at DESC
            LIMIT 1
        ");
        $stmt->execute([':rid' => $reservationId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->hydrate($row) : null;
    }

    public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void
    {
        $stmt = $this->db->prepare("
            UPDATE stationnements
            SET exited_at = :exited, billed_amount = :billed, penalty_amount = :penalty
            WHERE id = :id
        ");
        $stmt->execute([
            ':id' => $stationnementId,
            ':exited' => $exitedAt->format('Y-m-d H:i:s'),
            ':billed' => $billedAmount,
            ':penalty' => $penaltyAmount,
        ]);
    }

    public function findLastByReservationId(int $reservationId): ?Stationnement
    {
        $stmt = $this->db->prepare("
            SELECT * FROM stationnements
            WHERE reservation_id = :rid
            ORDER BY entered_at DESC
            LIMIT 1
        ");
        $stmt->execute([':rid' => $reservationId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $this->hydrate($row) : null;
    }

    private function hydrate(array $row): Stationnement
    {
        return new Stationnement(
            (int)$row['id'],
            (int)$row['reservation_id'],
            new \DateTimeImmutable($row['entered_at']),
            $row['exited_at'] ? new \DateTimeImmutable($row['exited_at']) : null,
            $row['billed_amount'] !== null ? (float)$row['billed_amount'] : null,
            $row['penalty_amount'] !== null ? (float)$row['penalty_amount'] : null,
            new \DateTimeImmutable($row['created_at'])
        );
    }

    public function listActiveByParkingId(int $parkingId): array
{
    $stmt = $this->db->prepare('
        SELECT
          s.id,
          s.reservation_id,
          s.entered_at,
          s.exited_at,
          s.billed_amount,
          s.penalty_amount,
          s.created_at
        FROM stationnements s
        JOIN reservations r ON r.id = s.reservation_id
        WHERE r.parking_id = :parking_id
          AND s.exited_at IS NULL
        ORDER BY s.entered_at DESC
    ');
    $stmt->execute(['parking_id' => $parkingId]);
    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
}
public function countActiveByParkingId(int $parkingId): int
{
    $stmt = $this->db->prepare('
        SELECT COUNT(*)
        FROM stationnements s
        JOIN reservations r ON r.id = s.reservation_id
        WHERE r.parking_id = :parking_id
          AND s.exited_at IS NULL
    ');
    $stmt->execute(['parking_id' => $parkingId]);
    return (int)$stmt->fetchColumn();
}

public function revenueForParking(string $from, string $to, int $parkingId): array
{
    $stmt = $this->db->prepare('
        SELECT
          COUNT(*) AS count_exits,
          COALESCE(SUM(s.billed_amount), 0) AS total_billed,
          COALESCE(SUM(s.penalty_amount), 0) AS total_penalty,
          COALESCE(SUM(COALESCE(s.billed_amount,0) + COALESCE(s.penalty_amount,0)), 0) AS total
        FROM stationnements s
        JOIN reservations r ON r.id = s.reservation_id
        WHERE r.parking_id = :parking_id
          AND s.exited_at IS NOT NULL
          AND s.exited_at >= :from
          AND s.exited_at < :to
    ');

    $stmt->execute([
        'parking_id' => $parkingId,
        'from' => $from,
        'to' => $to,
    ]);

    $row = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];

    return [
        'count_exits'   => (int)($row['count_exits'] ?? 0),
        'total_billed'  => (float)($row['total_billed'] ?? 0),
        'total_penalty' => (float)($row['total_penalty'] ?? 0),
        'total'         => (float)($row['total'] ?? 0),
    ];
}
public function countOverlappingForSlot(int $parkingId, string $startAt, string $endAt): int
{

    $sql = "
        SELECT COUNT(*) AS c
        FROM stationnements s
        JOIN reservations r ON r.id = s.reservation_id
        WHERE r.parking_id = :pid
          AND s.entered_at < :endAt
          AND (s.exited_at IS NULL OR s.exited_at > :startAt)
    ";

    $stmt = $this->db->prepare($sql);
    $stmt->execute([
        ':pid' => $parkingId,
        ':startAt' => $startAt,
        ':endAt' => $endAt,
    ]);

    return (int)$stmt->fetchColumn();
}
public function listForUser(int $userId): array
{
    $sql = "
        SELECT
            r.id,
            r.user_id,
            r.parking_id,
            r.start_at,
            r.end_at,
            r.vehicle_type,
            r.amount,
            r.created_at,
            r.statut,
            r.date_annulation,

            p.address AS parking_address,

            s.entered_at,
            s.exited_at,
            s.billed_amount,
            s.penalty_amount
        FROM reservations r
        JOIN parkings p ON p.id = r.parking_id
        LEFT JOIN stationnements s
          ON s.id = (
            SELECT s2.id
            FROM stationnements s2
            WHERE s2.reservation_id = r.id
            ORDER BY s2.entered_at DESC
            LIMIT 1
          )
        WHERE r.user_id = :uid
        ORDER BY r.start_at DESC
    ";

    $stmt = $this->db->prepare($sql);
    $stmt->execute([':uid' => $userId]);

    return $stmt->fetchAll(\PDO::FETCH_ASSOC);
}


}
