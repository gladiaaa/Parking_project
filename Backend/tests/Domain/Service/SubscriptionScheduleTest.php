<?php
declare(strict_types=1);

namespace Tests\Domain\Service;

use App\Domain\Service\SubscriptionSchedule;
use PHPUnit\Framework\TestCase;

final class SubscriptionScheduleTest extends TestCase
{
    public function testIsActiveAtReturnsFalseWhenDateOutOfRange(): void
    {
        $slots = [
            ['dow' => 1, 'start' => '08:00', 'end' => '10:00'],
        ];

        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-01-01', '09:00', '2025-01-10', '2025-01-20', $slots));
        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-01-21', '09:00', '2025-01-10', '2025-01-20', $slots));
    }

    public function testIsActiveAtReturnsFalseWhenDateTimeInvalid(): void
    {
        $slots = [
            ['dow' => 1, 'start' => '08:00', 'end' => '10:00'],
        ];

        // date invalide
        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-02-30', '09:00', '2025-02-01', '2025-02-28', $slots));

        // time invalide (createFromFormat échoue)
        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-02-10', '99:99', '2025-02-01', '2025-02-28', $slots));
    }

    public function testIsActiveAtIgnoresInvalidWeeklySlots(): void
    {
        $slots = [
            ['dow' => 0, 'start' => '08:00', 'end' => '10:00'],   // dow invalide
            ['dow' => 1, 'start' => '8:00', 'end' => '10:00'],    // start invalide
            ['dow' => 1, 'start' => '08:00', 'end' => '10:0'],    // end invalide
        ];

        self::assertFalse(
            SubscriptionSchedule::isActiveAt('2025-02-10', '09:00', '2025-02-01', '2025-02-28', $slots),
            'Tous les slots sont invalides donc jamais actif.'
        );
    }

    public function testIsActiveAtSameDayWindow(): void
    {
        // 2025-02-10 est un lundi (dow=1)
        $slots = [
            ['dow' => 1, 'start' => '08:00', 'end' => '10:00'],
        ];

        self::assertTrue(SubscriptionSchedule::isActiveAt('2025-02-10', '08:00', '2025-02-01', '2025-02-28', $slots));
        self::assertTrue(SubscriptionSchedule::isActiveAt('2025-02-10', '09:30', '2025-02-01', '2025-02-28', $slots));
        self::assertTrue(SubscriptionSchedule::isActiveAt('2025-02-10', '10:00', '2025-02-01', '2025-02-28', $slots));

        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-02-10', '07:59', '2025-02-01', '2025-02-28', $slots));
        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-02-10', '10:01', '2025-02-01', '2025-02-28', $slots));

        // Mauvais jour (mardi)
        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-02-11', '09:00', '2025-02-01', '2025-02-28', $slots));
    }

    public function testIsActiveAtOvernightWindowCrossesMidnight(): void
    {
        // Lundi (dow=1) 22:00 -> 02:00 (mardi)
        $slots = [
            ['dow' => 1, 'start' => '22:00', 'end' => '02:00'],
        ];

        // lundi soir, après 22:00
        self::assertTrue(SubscriptionSchedule::isActiveAt('2025-02-10', '22:00', '2025-02-01', '2025-02-28', $slots));
        self::assertTrue(SubscriptionSchedule::isActiveAt('2025-02-10', '23:59', '2025-02-01', '2025-02-28', $slots));

        // mardi matin, avant 02:00
        self::assertTrue(SubscriptionSchedule::isActiveAt('2025-02-11', '00:00', '2025-02-01', '2025-02-28', $slots));
        self::assertTrue(SubscriptionSchedule::isActiveAt('2025-02-11', '02:00', '2025-02-01', '2025-02-28', $slots));

        // mardi après
        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-02-11', '02:01', '2025-02-01', '2025-02-28', $slots));
        // lundi avant
        self::assertFalse(SubscriptionSchedule::isActiveAt('2025-02-10', '21:59', '2025-02-01', '2025-02-28', $slots));
    }

    public function testOverlapsSlotReturnsFalseWhenInvalidRange(): void
    {
        $slots = [
            ['dow' => 1, 'start' => '08:00', 'end' => '10:00'],
        ];

        // end <= start
        self::assertFalse(SubscriptionSchedule::overlapsSlot(
            '2025-02-10 10:00:00',
            '2025-02-10 10:00:00',
            '2025-02-01',
            '2025-02-28',
            $slots
        ));

        self::assertFalse(SubscriptionSchedule::overlapsSlot(
            '2025-02-10 10:00:00',
            '2025-02-10 09:00:00',
            '2025-02-01',
            '2025-02-28',
            $slots
        ));

        // format invalide
        self::assertFalse(SubscriptionSchedule::overlapsSlot(
            'bad',
            '2025-02-10 09:00:00',
            '2025-02-01',
            '2025-02-28',
            $slots
        ));
    }

public function testOverlapsSlotReturnsTrueWhenAny15MinTickIsActive(): void
{
    // Lundi 08:00 -> 10:00
    $slots = [
        ['dow' => 1, 'start' => '08:00', 'end' => '10:00'],
    ];

    self::assertTrue(SubscriptionSchedule::overlapsSlot(
        '2025-02-10 08:00:00',
        '2025-02-10 08:10:00',
        '2025-02-01',
        '2025-02-28',
        $slots
    ));
}

    public function testOverlapsSlotReturnsFalseWhenNoTickMatches(): void
    {
        // Lundi 08:00 -> 10:00
        $slots = [
            ['dow' => 1, 'start' => '08:00', 'end' => '10:00'],
        ];

        // Slot concret: lundi 06:00 -> 07:00 (hors plage)
        self::assertFalse(SubscriptionSchedule::overlapsSlot(
            '2025-02-10 06:00:00',
            '2025-02-10 07:00:00',
            '2025-02-01',
            '2025-02-28',
            $slots
        ));
    }

    public function testOverlapsSlotOvernight(): void
    {
        // Lundi 22:00 -> 02:00
        $slots = [
            ['dow' => 1, 'start' => '22:00', 'end' => '02:00'],
        ];

        self::assertTrue(SubscriptionSchedule::overlapsSlot(
            '2025-02-11 01:00:00',
            '2025-02-11 01:30:00',
            '2025-02-01',
            '2025-02-28',
            $slots
        ));
    }
}
