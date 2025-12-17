<?php
declare(strict_types=1);

namespace App\UseCase\Billing;

final class BillingCalculator
{
    public function __construct(
        private readonly int $slotMinutes = 15,
        private readonly float $penaltyMultiplier = 2.0
    ) {}

    public function billedMinutes(\DateTimeImmutable $start, \DateTimeImmutable $end): int
    {
        $seconds = max(0, $end->getTimestamp() - $start->getTimestamp());
        $minutes = (int)ceil($seconds / 60);
        $slot = $this->slotMinutes;
        return (int)(ceil($minutes / $slot) * $slot);
    }

    public function amountForMinutes(int $minutes, float $hourlyRate): float
    {
        return round(($minutes / 60) * $hourlyRate, 2);
    }

    public function compute(
        \DateTimeImmutable $enteredAt,
        \DateTimeImmutable $exitedAt,
        \DateTimeImmutable $reservedEndAt,
        float $hourlyRate
    ): array {
        $billedMin = $this->billedMinutes($enteredAt, $exitedAt);
        $base = $this->amountForMinutes($billedMin, $hourlyRate);

        $penalty = 0.0;
        if ($exitedAt > $reservedEndAt) {
            $overtimeMin = $this->billedMinutes($reservedEndAt, $exitedAt);
            $overtimeAmount = $this->amountForMinutes($overtimeMin, $hourlyRate);
            $penalty = round($overtimeAmount * ($this->penaltyMultiplier - 1.0), 2); // surcharge, pas double facturation totale
        }

        return [
            'billed_minutes' => $billedMin,
            'base_amount' => $base,
            'penalty_amount' => $penalty,
            'total_amount' => round($base + $penalty, 2),
        ];
    }
}
