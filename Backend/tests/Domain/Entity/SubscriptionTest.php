<?php
declare(strict_types=1);

namespace Tests\Domain\Entity;

use App\Domain\Entity\Subscription;
use PHPUnit\Framework\TestCase;

final class SubscriptionTest extends TestCase
{
    public function testGettersAndWithers(): void
    {
        $start = new \DateTimeImmutable('2025-01-01');
        $end   = new \DateTimeImmutable('2025-01-31');

        $weeklySlots = [
            ['dow' => 1, 'start' => '08:00', 'end' => '12:00'],
            ['dow' => 3, 'start' => '14:00', 'end' => '18:00'],
        ];

        $sub = new Subscription(
            id: null,
            userId: 42,
            parkingId: 7,
            startDate: $start,
            endDate: $end,
            weeklySlots: $weeklySlots,
            amount: 9.999
        );

        // getters
        self::assertNull($sub->id());
        self::assertSame(42, $sub->userId());
        self::assertSame(7, $sub->parkingId());
        self::assertSame($start, $sub->startDate());
        self::assertSame($end, $sub->endDate());
        self::assertSame($weeklySlots, $sub->weeklySlots());
        self::assertSame(9.999, $sub->amount());

        // withId (immutabilité)
        $sub2 = $sub->withId(123);
        self::assertNull($sub->id());
        self::assertSame(123, $sub2->id());
        self::assertSame(42, $sub2->userId());
        self::assertSame(7, $sub2->parkingId());
        self::assertSame($start, $sub2->startDate());
        self::assertSame($end, $sub2->endDate());
        self::assertSame($weeklySlots, $sub2->weeklySlots());

        // withAmount + round(2)
        $sub3 = $sub2->withAmount(10.126);
        self::assertSame(123, $sub3->id());
        self::assertSame(10.13, $sub3->amount());

        $sub4 = $sub2->withAmount(10.124);
        self::assertSame(10.12, $sub4->amount());
    }
}
