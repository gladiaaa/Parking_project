<?php
declare(strict_types=1);

namespace App\Domain\Service;

final class SubscriptionSchedule
{
    /**
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     */
    public static function isActiveAt(
        string $date,        // 'Y-m-d'
        string $time,        // 'H:i'
        string $startDate,   // 'Y-m-d'
        string $endDate,     // 'Y-m-d'
        array $weeklySlots
    ): bool {
        if ($date < $startDate || $date > $endDate) return false;

        $dt = \DateTimeImmutable::createFromFormat('Y-m-d H:i', $date . ' ' . $time);
        if (!$dt) return false;

        $dow = (int)$dt->format('N'); // 1..7

        foreach ($weeklySlots as $slot) {
            $sdow = (int)($slot['dow'] ?? 0);
            $s = (string)($slot['start'] ?? '');
            $e = (string)($slot['end'] ?? '');
            if ($sdow < 1 || $sdow > 7 || !self::isTime($s) || !self::isTime($e)) continue;

            if (self::timeWindowContains($dow, $time, $sdow, $s, $e)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Overlap entre un abonnement (date range + weekly slots) et un créneau concret [startAt,endAt]
     * startAt/endAt format: 'Y-m-d H:i:s'
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     */
    public static function overlapsSlot(
        string $startAt,
        string $endAt,
        string $startDate,
        string $endDate,
        array $weeklySlots
    ): bool {
        $start = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $startAt);
        $end   = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endAt);
        if (!$start || !$end || $end <= $start) return false;

        $cursor = $start;
        while ($cursor < $end) {
            $d = $cursor->format('Y-m-d');
            $t = $cursor->format('H:i');
            if (self::isActiveAt($d, $t, $startDate, $endDate, $weeklySlots)) {
                return true;
            }
            $cursor = $cursor->modify('+15 minutes');
        }
        return false;
    }

    private static function timeWindowContains(int $dowNow, string $timeNow, int $slotDow, string $slotStart, string $slotEnd): bool
    {
        // slot dans la même journée
        if ($slotStart <= $slotEnd) {
            return $dowNow === $slotDow && ($slotStart <= $timeNow && $timeNow <= $slotEnd);
        }

        // slot traverse minuit (ex 18:00 -> 08:00)
        if ($dowNow === $slotDow && $timeNow >= $slotStart) return true;

        $nextDow = $slotDow === 7 ? 1 : $slotDow + 1;
        if ($dowNow === $nextDow && $timeNow <= $slotEnd) return true;

        return false;
    }

    private static function isTime(string $hhmm): bool
    {
        return (bool)\preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $hhmm);
    }
}
