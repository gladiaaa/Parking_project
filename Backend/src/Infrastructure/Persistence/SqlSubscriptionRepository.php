<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use PDO;
use App\Domain\Entity\Subscription;
use App\Domain\Repository\SubscriptionRepository;
use App\Domain\Service\SubscriptionSchedule;

final class SqlSubscriptionRepository implements SubscriptionRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function save(Subscription $subscription): Subscription
    {
        $slotsJson = json_encode($subscription->weeklySlots(), JSON_UNESCAPED_UNICODE);

        // ✅ AJOUT: amount
        $sql = "INSERT INTO subscriptions (user_id, parking_id, start_date, end_date, weekly_slots, amount)
                VALUES (:uid, :pid, :sd, :ed, :slots, :amount)";
        $st = $this->pdo->prepare($sql);
        $st->execute([
            ':uid' => $subscription->userId(),
            ':pid' => $subscription->parkingId(),
            ':sd' => $subscription->startDate()->format('Y-m-d'),
            ':ed' => $subscription->endDate()->format('Y-m-d'),
            ':slots' => $slotsJson ?: '[]',
            ':amount' => $subscription->amount(),
        ]);

        $id = (int) $this->pdo->lastInsertId();
        return $subscription->withId($id);
    }

    public function listByUserId(int $userId): array
    {
        $sql = "SELECT * FROM subscriptions WHERE user_id = :uid ORDER BY id DESC";
        $st = $this->pdo->prepare($sql);
        $st->execute([':uid' => $userId]);

        $out = [];
        while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
            $out[] = $this->hydrate($r);
        }
        return $out;
    }

    public function listByParkingId(int $parkingId): array
    {
        $sql = "SELECT * FROM subscriptions WHERE parking_id = :pid ORDER BY id DESC";
        $st = $this->pdo->prepare($sql);
        $st->execute([':pid' => $parkingId]);

        $out = [];
        while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
            $out[] = $this->hydrate($r);
        }
        return $out;
    }

    public function countActiveNow(int $parkingId, string $at): int
    {
        $dt = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $at);
        if (!$dt) return 0;

        $date = $dt->format('Y-m-d');
        $time = $dt->format('H:i');

        $sql = "SELECT start_date, end_date, weekly_slots
                FROM subscriptions
                WHERE parking_id = :pid
                  AND start_date <= :d
                  AND end_date >= :d";
        $st = $this->pdo->prepare($sql);
        $st->execute([':pid' => $parkingId, ':d' => $date]);

        $count = 0;
        while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
            $slots = json_decode((string) $row['weekly_slots'], true);
            if (!is_array($slots)) $slots = [];

            if (SubscriptionSchedule::isActiveAt(
                $date,
                $time,
                (string) $row['start_date'],
                (string) $row['end_date'],
                $slots
            )) {
                $count++;
            }
        }
        return $count;
    }

    public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int
    {
        $start = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $startAt);
        $end   = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endAt);
        if (!$start || !$end || $end <= $start) return 0;

        $fromDate = $start->format('Y-m-d');
        $toDate   = $end->format('Y-m-d');

        $sql = "SELECT start_date, end_date, weekly_slots
                FROM subscriptions
                WHERE parking_id = :pid
                  AND start_date <= :toDate
                  AND end_date >= :fromDate";
        $st = $this->pdo->prepare($sql);
        $st->execute([':pid' => $parkingId, ':fromDate' => $fromDate, ':toDate' => $toDate]);

        $count = 0;
        while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
            $slots = json_decode((string) $row['weekly_slots'], true);
            if (!is_array($slots)) $slots = [];

            if (SubscriptionSchedule::overlapsSlot(
                $startAt,
                $endAt,
                (string) $row['start_date'],
                (string) $row['end_date'],
                $slots
            )) {
                $count++;
            }
        }
        return $count;
    }

    public function existsOverlappingForUserParking(int $userId, int $parkingId, string $startDate, string $endDate): bool
    {
        $sql = "SELECT 1
            FROM subscriptions
            WHERE user_id = :uid
              AND parking_id = :pid
              AND start_date <= :endDate
              AND end_date >= :startDate
            LIMIT 1";

        $st = $this->pdo->prepare($sql);
        $st->execute([
            ':uid' => $userId,
            ':pid' => $parkingId,
            ':startDate' => $startDate,
            ':endDate' => $endDate,
        ]);

        return (bool) $st->fetchColumn();
    }

    public function coversUserForSlot(int $userId, int $parkingId, string $startAt, string $endAt): bool
    {
        $start = new \DateTimeImmutable($startAt);
        $end   = new \DateTimeImmutable($endAt);

        $sql = "SELECT id, user_id, parking_id, start_date, end_date, weekly_slots
                FROM subscriptions
                WHERE user_id = :uid
                  AND parking_id = :pid
                  AND start_date <= :endDate
                  AND end_date >= :startDate";

        $st = $this->pdo->prepare($sql);
        $st->execute([
            ':uid' => $userId,
            ':pid' => $parkingId,
            ':startDate' => $start->format('Y-m-d'),
            ':endDate' => $end->format('Y-m-d'),
        ]);

        $rows = $st->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        foreach ($rows as $r) {
            $weekly = json_decode((string)($r['weekly_slots'] ?? '[]'), true);
            if (!is_array($weekly)) $weekly = [];

            if ($this->intervalIsCoveredByWeeklySlots($start, $end, $weekly)) {
                return true;
            }
        }

        return false;
    }

    private function hydrate(array $r): Subscription
    {
        $slots = json_decode((string) ($r['weekly_slots'] ?? '[]'), true);
        if (!is_array($slots)) $slots = [];

        // ✅ AJOUT: amount hydraté depuis la DB
        $amount = isset($r['amount']) ? (float) $r['amount'] : 0.0;

        return new Subscription(
            isset($r['id']) ? (int) $r['id'] : null,
            (int) $r['user_id'],
            (int) $r['parking_id'],
            new \DateTimeImmutable((string) $r['start_date']),
            new \DateTimeImmutable((string) $r['end_date']),
            $slots,
            $amount
        );
    }

    /**
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     */
    private function intervalIsCoveredByWeeklySlots(\DateTimeImmutable $start, \DateTimeImmutable $end, array $weeklySlots): bool
    {
        $cur = $start;

        while ($cur->format('Y-m-d') !== $end->format('Y-m-d')) {
            $dayEnd = $cur->setTime(23, 59, 59);
            if (!$this->segmentCoveredForDay($cur, $dayEnd, $weeklySlots)) return false;
            $cur = $dayEnd->modify('+1 second');
        }

        return $this->segmentCoveredForDay($cur, $end, $weeklySlots);
    }

    /**
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     */
    private function segmentCoveredForDay(\DateTimeImmutable $segStart, \DateTimeImmutable $segEnd, array $weeklySlots): bool
    {
        $dow = (int)$segStart->format('N');
        $startTime = $segStart->format('H:i');
        $endTime   = $segEnd->format('H:i');

        foreach ($weeklySlots as $slot) {
            $sdow  = (int)($slot['dow'] ?? 0);
            $sfrom = (string)($slot['start'] ?? '');
            $sto   = (string)($slot['end'] ?? '');

            if ($sdow < 1 || $sdow > 7 || $sfrom === '' || $sto === '') continue;

            if ($sfrom <= $sto && $sdow === $dow) {
                if ($startTime >= $sfrom && $endTime <= $sto) return true;
            }

            if ($sfrom > $sto) {
                if ($sdow === $dow && $startTime >= $sfrom) return true;

                $nextDow = $sdow === 7 ? 1 : $sdow + 1;
                if ($nextDow === $dow && $endTime <= $sto) return true;
            }
        }

        return false;
    }
}
