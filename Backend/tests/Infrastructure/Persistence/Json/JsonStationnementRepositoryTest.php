<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Persistence\Json;

use PHPUnit\Framework\TestCase;
use App\Infrastructure\Persistence\Json\JsonStationnementRepository;
use App\Infrastructure\Persistence\Json\JsonReservationRepository;
use App\Domain\Entity\Stationnement;

final class JsonStationnementRepositoryTest extends TestCase
{
    private string $stationnements;
    private string $reservations;

    protected function setUp(): void
    {
        $this->stationnements = sys_get_temp_dir() . '/stationnements_test.json';
        $this->reservations   = sys_get_temp_dir() . '/reservations_test.json';

        @unlink($this->stationnements);
        @unlink($this->reservations);
    }

    public function testSaveAndCloseStationnement(): void
    {
        $reservationRepo = new JsonReservationRepository($this->reservations);
        $repo = new JsonStationnementRepository($this->stationnements, $reservationRepo);

        $enteredAt = new \DateTimeImmutable('2025-01-01 10:00');
        $s = Stationnement::enter(1, $enteredAt);

        $saved = $repo->save($s);
        $this->assertNotNull($saved->id());

        $exitAt = new \DateTimeImmutable('2025-01-01 11:00');

        $repo->close(
            $saved->id(),
            $exitAt,
            15.0,
            5.0
        );

        $closed = $repo->findLastByReservationId(1);

        $this->assertNotNull($closed->exitedAt());
        $this->assertSame(15.0, $closed->billedAmount());
        $this->assertSame(5.0, $closed->penaltyAmount());
    }
}
