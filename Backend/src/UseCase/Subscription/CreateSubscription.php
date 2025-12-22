<?php
declare(strict_types=1);

namespace App\UseCase\Subscription;

use App\Domain\Entity\Subscription;
use App\Domain\Repository\SubscriptionRepository;
use App\Domain\Repository\ParkingRepository;
use App\UseCase\Billing\BillingCalculator;

final class CreateSubscription
{
    public function __construct(
        private readonly SubscriptionRepository $subscriptions,
        private readonly ParkingRepository $parkings,
        private readonly BillingCalculator $billing
    ) {}

    /**
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     */
    public function execute(
        int $userId,
        int $parkingId,
        string $startDate, // 'Y-m-d'
        int $months,
        array $weeklySlots
    ): Subscription {
        if ($parkingId <= 0) {
            throw new \RuntimeException('Invalid parking_id');
        }

        if ($months < 1 || $months > 12) {
            throw new \RuntimeException('Invalid subscription duration (must be 1..12 months)');
        }

        $sd = \DateTimeImmutable::createFromFormat('Y-m-d', $startDate);
        if (!$sd) {
            throw new \RuntimeException('Invalid start_date');
        }

        // end_date: +N months - 1 day (ex: 2025-12-17 +1m => 2026-01-17 -1d => 2026-01-16)
        $ed = $sd->modify('+' . $months . ' months')->modify('-1 day');
        if ($ed < $sd) {
            throw new \RuntimeException('Invalid date range');
        }

        $weeklySlots = $this->normalizeAndValidateSlots($weeklySlots);

        $sdStr = $sd->format('Y-m-d');
        $edStr = $ed->format('Y-m-d');

        if ($this->subscriptions->existsOverlappingForUserParking($userId, $parkingId, $sdStr, $edStr)) {
            throw new \RuntimeException('Subscription already exists for this period (overlap)');
        }

        $parking = $this->parkings->findById($parkingId);
        if ($parking === null) {
            throw new \RuntimeException('Parking not found');
        }

        $hourlyRate = (float) $parking->hourlyRate();

        $amount = $this->computeSubscriptionAmount($sd, $ed, $weeklySlots, $hourlyRate);

        $sub = (new Subscription(
            null,
            $userId,
            $parkingId,
            $sd,
            $ed,
            $weeklySlots
        ))->withAmount($amount);

        return $this->subscriptions->save($sub);
    }

    /**
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     * @return array<int, array{dow:int,start:string,end:string}>
     */
    private function normalizeAndValidateSlots(array $weeklySlots): array
    {
        if (empty($weeklySlots)) {
            throw new \RuntimeException('weekly_slots is required');
        }

        $out = [];
        foreach ($weeklySlots as $slot) {
            $dow = (int)($slot['dow'] ?? 0);
            $start = (string)($slot['start'] ?? '');
            $end = (string)($slot['end'] ?? '');

            if ($dow < 1 || $dow > 7) {
                throw new \RuntimeException('Invalid dow in weekly_slots');
            }

            if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $start)) {
                throw new \RuntimeException('Invalid start time in weekly_slots');
            }

            if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $end)) {
                throw new \RuntimeException('Invalid end time in weekly_slots');
            }

            // Note: start > end = traverse minuit (autorisé)
            $out[] = ['dow' => $dow, 'start' => $start, 'end' => $end];
        }

        return $out;
    }

    /**
     * Calcule le montant total de la souscription sur la période:
     *
     * @param array<int, array{dow:int,start:string,end:string}> $weeklySlots
     */
    private function computeSubscriptionAmount(
        \DateTimeImmutable $sd,
        \DateTimeImmutable $ed,
        array $weeklySlots,
        float $hourlyRate
    ): float {
        $totalMinutes = 0;

        // Parcourt chaque jour de la période (inclusif)
        for ($day = $sd; $day <= $ed; $day = $day->modify('+1 day')) {
            $dow = (int)$day->format('N'); // 1=lun .. 7=dim

            foreach ($weeklySlots as $slot) {
                if ((int)$slot['dow'] !== $dow) {
                    continue;
                }

                $start = \DateTimeImmutable::createFromFormat(
                    'Y-m-d H:i:s',
                    $day->format('Y-m-d') . ' ' . $slot['start'] . ':00'
                );
                if (!$start) {
                    continue;
                }

                $endDay = $this->slotEndsNextDay($slot['start'], $slot['end'])
                    ? $day->modify('+1 day')
                    : $day;

                $end = \DateTimeImmutable::createFromFormat(
                    'Y-m-d H:i:s',
                    $endDay->format('Y-m-d') . ' ' . $slot['end'] . ':00'
                );
                if (!$end) {
                    continue;
                }

                $totalMinutes += $this->billing->billedMinutes($start, $end);
            }
        }

        return $this->billing->amountForMinutes($totalMinutes, $hourlyRate);
    }

    private function slotEndsNextDay(string $start, string $end): bool
    {
        // start > end => traverse minuit
        return strcmp($start, $end) > 0;
    }
}
