<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence\Json;

use App\Domain\Entity\Subscription;
use App\Domain\Repository\SubscriptionRepository;
use App\Domain\Service\SubscriptionSchedule;

final class JsonSubscriptionRepository implements SubscriptionRepository
{
    public function __construct(private readonly string $path)
    {
    }

    /** @return array<int, array<string,mixed>> */
    private function read(): array
    {
        if (!is_file($this->path))
            return [];
        $raw = file_get_contents($this->path);
        $data = json_decode($raw ?: '[]', true);
        return is_array($data) ? $data : [];
    }

    private function write(array $rows): void
    {
        $dir = dirname($this->path);
        if (!is_dir($dir))
            @mkdir($dir, 0777, true);
        file_put_contents($this->path, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function save(Subscription $subscription): Subscription
    {
        $rows = $this->read();
        $nextId = 1;
        foreach ($rows as $r)
            $nextId = max($nextId, (int) ($r['id'] ?? 0) + 1);

        $row = [
            'id' => $subscription->id() ?? $nextId,
            'user_id' => $subscription->userId(),
            'parking_id' => $subscription->parkingId(),
            'start_date' => $subscription->startDate()->format('Y-m-d'),
            'end_date' => $subscription->endDate()->format('Y-m-d'),
            'weekly_slots' => $subscription->weeklySlots(),
            'created_at' => (new \DateTimeImmutable('now'))->format('c'),
        ];

        $rows[] = $row;
        $this->write($rows);

        return $subscription->withId((int) $row['id']);
    }

    public function listByUserId(int $userId): array
    {
        $out = [];
        foreach ($this->read() as $r) {
            if ((int) ($r['user_id'] ?? 0) !== $userId)
                continue;
            $out[] = $this->hydrate($r);
        }
        return $out;
    }

    public function listByParkingId(int $parkingId): array
    {
        $out = [];
        foreach ($this->read() as $r) {
            if ((int) ($r['parking_id'] ?? 0) !== $parkingId)
                continue;
            $out[] = $this->hydrate($r);
        }
        return $out;
    }

    public function countActiveNow(int $parkingId, string $at): int
    {
        $dt = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $at);
        if (!$dt)
            return 0;

        $date = $dt->format('Y-m-d');
        $time = $dt->format('H:i');

        $count = 0;
        foreach ($this->read() as $r) {
            if ((int) ($r['parking_id'] ?? 0) !== $parkingId)
                continue;

            $startDate = (string) ($r['start_date'] ?? '');
            $endDate = (string) ($r['end_date'] ?? '');
            $slots = $r['weekly_slots'] ?? [];
            if (!is_array($slots))
                $slots = [];

            if (SubscriptionSchedule::isActiveAt($date, $time, $startDate, $endDate, $slots)) {
                $count++;
            }
        }
        return $count;
    }

    public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int
    {
        $count = 0;
        foreach ($this->read() as $r) {
            if ((int) ($r['parking_id'] ?? 0) !== $parkingId)
                continue;

            $startDate = (string) ($r['start_date'] ?? '');
            $endDate = (string) ($r['end_date'] ?? '');
            $slots = $r['weekly_slots'] ?? [];
            if (!is_array($slots))
                $slots = [];

            if (SubscriptionSchedule::overlapsSlot($startAt, $endAt, $startDate, $endDate, $slots)) {
                $count++;
            }
        }
        return $count;
    }

    private function hydrate(array $r): Subscription
    {
        $slots = $r['weekly_slots'] ?? [];
        if (!is_array($slots))
            $slots = [];

        return new Subscription(
            isset($r['id']) ? (int) $r['id'] : null,
            (int) $r['user_id'],
            (int) $r['parking_id'],
            new \DateTimeImmutable((string) $r['start_date']),
            new \DateTimeImmutable((string) $r['end_date']),
            $slots
        );
    }
    public function existsOverlappingForUserParking(int $userId, int $parkingId, string $startDate, string $endDate): bool
    {
        foreach ($this->read() as $r) {
            if ((int) ($r['user_id'] ?? 0) !== $userId)
                continue;
            if ((int) ($r['parking_id'] ?? 0) !== $parkingId)
                continue;

            $sd = (string) ($r['start_date'] ?? '');
            $ed = (string) ($r['end_date'] ?? '');

            if ($sd === '' || $ed === '')
                continue;

            // overlap: sd <= endDate && ed >= startDate
            if ($sd <= $endDate && $ed >= $startDate) {
                return true;
            }
        }
        return false;
    }
    public function coversUserForSlot(int $userId, int $parkingId, string $startAt, string $endAt): bool
{
    $start = new \DateTimeImmutable($startAt);
    $end   = new \DateTimeImmutable($endAt);

    foreach ($this->listByUserId($userId) as $sub) {
        if ($sub->parkingId() !== $parkingId) continue;

        // date range du contrat
        if ($sub->startDate() > $end || $sub->endDate() < $start) {
            continue;
        }

        if ($this->intervalIsCoveredByWeeklySlots($start, $end, $sub->weeklySlots())) {
            return true;
        }
    }

    return false;
}

/**
 * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
 */
private function intervalIsCoveredByWeeklySlots(\DateTimeImmutable $start, \DateTimeImmutable $end, array $weeklySlots): bool
{
    // On split par jour pour gérer proprement les slots qui traversent minuit.
    $cur = $start;

    while ($cur->format('Y-m-d') !== $end->format('Y-m-d')) {
        $dayEnd = $cur->setTime(23, 59, 59);
        if (!$this->segmentCoveredForDay($cur, $dayEnd, $weeklySlots)) return false;
        $cur = $dayEnd->modify('+1 second');
    }

    return $this->segmentCoveredForDay($cur, $end, $weeklySlots);
}

/**
 * Vérifie que [segStart..segEnd] est couvert par AU MOINS un slot (en tenant compte des slots “cross midnight”).
 * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
 */
private function segmentCoveredForDay(\DateTimeImmutable $segStart, \DateTimeImmutable $segEnd, array $weeklySlots): bool
{
    $dow = (int)$segStart->format('N'); // 1..7
    $startTime = $segStart->format('H:i');
    $endTime   = $segEnd->format('H:i');

    foreach ($weeklySlots as $slot) {
        $sdow  = (int)($slot['dow'] ?? 0);
        $sfrom = (string)($slot['start'] ?? '');
        $sto   = (string)($slot['end'] ?? '');

        if ($sdow < 1 || $sdow > 7 || $sfrom === '' || $sto === '') continue;

        // Slot normal (ex 09:00->18:00) couvre le même dow
        if ($sfrom <= $sto && $sdow === $dow) {
            if ($startTime >= $sfrom && $endTime <= $sto) return true;
        }

        // Slot qui traverse minuit (ex 18:00->08:00)
        if ($sfrom > $sto) {
            // Partie “soir” du même jour: [18:00 -> 23:59]
            if ($sdow === $dow && $startTime >= $sfrom) {
                return true; // segment du jour est forcément <= 23:59:59
            }

            // Partie “matin” du lendemain: [00:00 -> 08:00]
            $nextDow = $sdow === 7 ? 1 : $sdow + 1;
            if ($nextDow === $dow && $endTime <= $sto) {
                return true;
            }
        }
    }

    return false;
}

}
