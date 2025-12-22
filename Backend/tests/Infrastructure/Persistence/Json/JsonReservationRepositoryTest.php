<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Persistence\Json;

use PHPUnit\Framework\TestCase;
use App\Infrastructure\Persistence\Json\JsonReservationRepository;
use App\Domain\Entity\Reservation;

final class JsonReservationRepositoryTest extends TestCase
{
    private string $file;

    protected function setUp(): void
    {
        $this->file = sys_get_temp_dir() . '/reservations_test.json';
        @unlink($this->file);
    }

    public function testSaveAndFindById(): void
    {
        $repo = new JsonReservationRepository($this->file);

        $r = Reservation::create(
            10,
            3,
            new \DateTimeImmutable('2025-01-01 10:00'),
            new \DateTimeImmutable('2025-01-01 12:00'),
            'car',
            20.0
        );

        $saved = $repo->save($r);

        $this->assertNotNull($saved->id());

        $found = $repo->findById($saved->id());

        $this->assertNotNull($found);
        $this->assertSame(10, $found->userId());
        $this->assertSame(3, $found->parkingId());
    }

    public function testFindByUserId(): void
    {
        $repo = new JsonReservationRepository($this->file);

        $repo->save(Reservation::create(
            1, 1,
            new \DateTimeImmutable('2025-01-01 08:00'),
            new \DateTimeImmutable('2025-01-01 09:00'),
            'car',
            10
        ));

        $repo->save(Reservation::create(
            2, 1,
            new \DateTimeImmutable('2025-01-01 10:00'),
            new \DateTimeImmutable('2025-01-01 11:00'),
            'car',
            10
        ));

        $list = $repo->findByUserId(1);

        $this->assertCount(1, $list);
        $this->assertSame(1, $list[0]->userId());
    }
    
}
