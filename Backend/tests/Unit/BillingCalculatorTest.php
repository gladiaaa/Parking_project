<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use App\UseCase\Billing\BillingCalculator;

final class BillingCalculatorTest extends TestCase
{
    public function test_billed_minutes_rounds_up_to_slot(): void
    {
        $calc = new BillingCalculator(slotMinutes: 15);

        $start = new DateTimeImmutable('2025-12-17 10:00:00');
        $end   = new DateTimeImmutable('2025-12-17 10:01:00'); // 1 min => 15

        $this->assertSame(15, $calc->billedMinutes($start, $end));
    }

    public function test_billed_minutes_exact_slot_stays_slot(): void
    {
        $calc = new BillingCalculator(slotMinutes: 15);

        $start = new DateTimeImmutable('2025-12-17 10:00:00');
        $end   = new DateTimeImmutable('2025-12-17 10:15:00'); // exact => 15

        $this->assertSame(15, $calc->billedMinutes($start, $end));
    }

    public function test_billed_minutes_just_over_slot_rounds_up(): void
    {
        $calc = new BillingCalculator(slotMinutes: 15);

        $start = new DateTimeImmutable('2025-12-17 10:00:00');
        $end   = new DateTimeImmutable('2025-12-17 10:15:01'); // 16 min => 30

        $this->assertSame(30, $calc->billedMinutes($start, $end));
    }

    public function test_billed_minutes_zero_when_end_before_start(): void
    {
        $calc = new BillingCalculator(slotMinutes: 15);

        $start = new DateTimeImmutable('2025-12-17 10:00:00');
        $end   = new DateTimeImmutable('2025-12-17 09:59:00'); // négatif => 0

        $this->assertSame(0, $calc->billedMinutes($start, $end));
    }

    public function test_amount_for_minutes_is_proportional_and_rounded_2_decimals(): void
    {
        $calc = new BillingCalculator();

        // 15 minutes à 12€/h => 3.00
        $this->assertSame(3.00, $calc->amountForMinutes(15, 12.0));

        // 30 minutes à 10€/h => 5.00
        $this->assertSame(5.00, $calc->amountForMinutes(30, 10.0));

        // 45 minutes à 7€/h => 5.25
        $this->assertSame(5.25, $calc->amountForMinutes(45, 7.0));
    }

    public function test_compute_no_penalty_when_exited_before_or_at_reserved_end(): void
    {
        $calc = new BillingCalculator(slotMinutes: 15, penaltyMultiplier: 2.0);

        $entered = new DateTimeImmutable('2025-12-17 10:00:00');
        $exited  = new DateTimeImmutable('2025-12-17 11:00:00');
        $end     = new DateTimeImmutable('2025-12-17 11:00:00');

        // 60min => base 10€/h => 10.00, penalty 0
        $out = $calc->compute($entered, $exited, $end, 10.0);

        $this->assertSame(60, $out['billed_minutes']);
        $this->assertSame(10.00, $out['base_amount']);
        $this->assertSame(0.00, $out['penalty_amount']);
        $this->assertSame(10.00, $out['total_amount']);
    }

    public function test_compute_penalty_is_surcharge_on_overtime_only_not_double_total(): void
    {
        $calc = new BillingCalculator(slotMinutes: 15, penaltyMultiplier: 2.0);

        $entered = new DateTimeImmutable('2025-12-17 10:00:00');
        $reservedEnd = new DateTimeImmutable('2025-12-17 11:00:00');
        $exited = new DateTimeImmutable('2025-12-17 11:01:00'); // overtime 1min => 15

        // billed: 61min => 75min (slot 15)
        // base: 75/60*10 = 12.50
        // overtime: 15/60*10 = 2.50
        // penaltyMultiplier=2.0 => surcharge = overtime*(2-1)=2.50
        // total = 12.50 + 2.50 = 15.00 (pas 12.50 + 5.00)
        $out = $calc->compute($entered, $exited, $reservedEnd, 10.0);

        $this->assertSame(75, $out['billed_minutes']);
        $this->assertSame(12.50, $out['base_amount']);
        $this->assertSame(2.50, $out['penalty_amount']);
        $this->assertSame(15.00, $out['total_amount']);
    }

    public function test_compute_penalty_multiplier_3x_means_surcharge_2x_overtime(): void
    {
        $calc = new BillingCalculator(slotMinutes: 15, penaltyMultiplier: 3.0);

        $entered = new DateTimeImmutable('2025-12-17 10:00:00');
        $reservedEnd = new DateTimeImmutable('2025-12-17 11:00:00');
        $exited = new DateTimeImmutable('2025-12-17 11:16:00'); // overtime 16min => 30

        // overtime: 30min à 10€/h => 5.00
        // surcharge = 5.00*(3-1)=10.00
        $out = $calc->compute($entered, $exited, $reservedEnd, 10.0);

        $this->assertSame(90, $out['billed_minutes']); // 76min => 90
        $this->assertSame(15.00, $out['base_amount']); // 90/60*10
        $this->assertSame(10.00, $out['penalty_amount']);
        $this->assertSame(25.00, $out['total_amount']);
    }
}
