<?php
declare(strict_types=1);

namespace Tests\UseCase\Reservation;

use PHPUnit\Framework\TestCase;

use App\UseCase\Reservation\ExitReservation;
use App\UseCase\Billing\BillingCalculator;

use App\Domain\Entity\Parking;
use App\Domain\Entity\Reservation;
use App\Domain\Entity\Stationnement;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;

final class ExitReservationTest extends TestCase
{
    private function makeParking(float $hourlyRate = 10.0): Parking
    {
        return new Parking(
            3,
            10,
            '48.8566,2.3522',
            $hourlyRate,
            new \DateTimeImmutable('08:00:00'),
            new \DateTimeImmutable('20:00:00'),
            [],
            []
        );
    }

    public function test_throws_when_reservation_not_found(): void
    {
        $uc = new ExitReservation(
            new class implements ReservationRepository {
                public function findById(int $id): ?Reservation { return null; }
                public function save(Reservation $reservation): Reservation { return $reservation; }
                public function findByUserId(int $userId): array { return []; }
                public function findByParkingId(int $parkingId): array { return []; }
                public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
                public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
                public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            },
            new class implements StationnementRepository {
                public function save(Stationnement $s): Stationnement { return $s; }
                public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
                public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
                public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
                public function listActiveByParkingId(int $parkingId): array { return []; }
                public function countActiveByParkingId(int $parkingId): int { return 0; }
                public function revenueForParking(string $from, string $to, int $parkingId): array {
                    return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
                }
            },
            new class implements ParkingRepository {
                public function create(array $data): int { return 0; }
                public function findById(int $id): ?Parking { return null; }
                public function listByOwnerId(int $ownerId): array { return []; }
                public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            },
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Reservation not found');

        $uc->execute(10, 1);
    }

    public function test_throws_when_forbidden(): void
    {
        $res = Reservation::create(
            999,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('+2 hours'),
            'car',
            12.5
        )->withId(1);

        $uc = new ExitReservation(
            new class($res) implements ReservationRepository {
                public function __construct(private Reservation $r) {}
                public function findById(int $id): ?Reservation { return $this->r; }
                public function save(Reservation $reservation): Reservation { return $reservation; }
                public function findByUserId(int $userId): array { return []; }
                public function findByParkingId(int $parkingId): array { return []; }
                public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
                public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
                public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            },
            new class implements StationnementRepository {
                public function save(Stationnement $s): Stationnement { return $s; }
                public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
                public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
                public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
                public function listActiveByParkingId(int $parkingId): array { return []; }
                public function countActiveByParkingId(int $parkingId): int { return 0; }
                public function revenueForParking(string $from, string $to, int $parkingId): array {
                    return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
                }
            },
            new class implements ParkingRepository {
                public function create(array $data): int { return 0; }
                public function findById(int $id): ?Parking { return null; }
                public function listByOwnerId(int $ownerId): array { return []; }
                public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            },
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Forbidden');

        $uc->execute(10, 1);
    }

    public function test_throws_when_not_entered(): void
    {
        $res = Reservation::create(
            10,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('+2 hours'),
            'car',
            12.5
        )->withId(1);

        $uc = new ExitReservation(
            new class($res) implements ReservationRepository {
                public function __construct(private Reservation $r) {}
                public function findById(int $id): ?Reservation { return $this->r; }
                public function save(Reservation $reservation): Reservation { return $reservation; }
                public function findByUserId(int $userId): array { return []; }
                public function findByParkingId(int $parkingId): array { return []; }
                public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
                public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
                public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            },
            new class implements StationnementRepository {
                public function save(Stationnement $s): Stationnement { return $s; }
                public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
                public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
                public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
                public function listActiveByParkingId(int $parkingId): array { return []; }
                public function countActiveByParkingId(int $parkingId): int { return 0; }
                public function revenueForParking(string $from, string $to, int $parkingId): array {
                    return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
                }
            },
            new class implements ParkingRepository {
                public function create(array $data): int { return 0; }
                public function findById(int $id): ?Parking { return null; }
                public function listByOwnerId(int $ownerId): array { return []; }
                public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            },
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Not entered');

        $uc->execute(10, 1);
    }

    public function test_closes_stationnement_and_returns_amounts(): void
    {
        $res = Reservation::create(
            10,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('+2 hours'),
            'car',
            12.5
        )->withId(1);

        $active = Stationnement::enter(1, new \DateTimeImmutable('-30 minutes'))->withId(99);

        $parking = $this->makeParking(10.0);

        $stationnementRepo = new class($active) implements StationnementRepository {
            public array $closed = [];

            public function __construct(private Stationnement $active) {}

            public function save(Stationnement $s): Stationnement { return $s; }

            public function findActiveByReservationId(int $reservationId): ?Stationnement {
                return $this->active;
            }

            public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void
            {
                $this->closed = [$stationnementId, $billedAmount, $penaltyAmount, $exitedAt];
            }

            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function countActiveByParkingId(int $parkingId): int { return 0; }
            public function revenueForParking(string $from, string $to, int $parkingId): array {
                return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
            }
        };

        $uc = new ExitReservation(
            new class($res) implements ReservationRepository {
                public function __construct(private Reservation $r) {}
                public function findById(int $id): ?Reservation { return $this->r; }
                public function save(Reservation $reservation): Reservation { return $reservation; }
                public function findByUserId(int $userId): array { return []; }
                public function findByParkingId(int $parkingId): array { return []; }
                public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
                public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
                public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            },
            $stationnementRepo,
            new class($parking) implements ParkingRepository {
                public function __construct(private Parking $parking) {}
                public function create(array $data): int { return 3; }
                public function findById(int $id): ?Parking { return $this->parking; }
                public function listByOwnerId(int $ownerId): array { return []; }
                public function findOwnerIdByParkingId(int $parkingId): ?int { return 1; }
            },
            new BillingCalculator()
        );

        $out = $uc->execute(10, 1);

        $this->assertSame(1, $out['reservation_id']);
        $this->assertArrayHasKey('exited_at', $out);
        $this->assertArrayHasKey('base_amount', $out);
        $this->assertArrayHasKey('penalty_amount', $out);
        $this->assertArrayHasKey('total_amount', $out);
        $this->assertArrayHasKey('billed_minutes', $out);

        $this->assertNotEmpty($stationnementRepo->closed);
        $this->assertSame(99, $stationnementRepo->closed[0]); // stationnementId
        $this->assertIsFloat($stationnementRepo->closed[1]);  // billed
        $this->assertIsFloat($stationnementRepo->closed[2]);  // penalty
        $this->assertInstanceOf(\DateTimeImmutable::class, $stationnementRepo->closed[3]);
    }

    public function test_throws_when_parking_not_found(): void
    {
        $res = Reservation::create(
            10,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('+2 hours'),
            'car',
            12.5
        )->withId(1);

        $active = Stationnement::enter(1, new \DateTimeImmutable('-30 minutes'))->withId(99);

        $uc = new ExitReservation(
            new class($res) implements ReservationRepository {
                public function __construct(private Reservation $r) {}
                public function findById(int $id): ?Reservation { return $this->r; }
                public function save(Reservation $reservation): Reservation { return $reservation; }
                public function findByUserId(int $userId): array { return []; }
                public function findByParkingId(int $parkingId): array { return []; }
                public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
                public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
                public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            },
            new class($active) implements StationnementRepository {
                public function __construct(private Stationnement $active) {}
                public function save(Stationnement $s): Stationnement { return $s; }
                public function findActiveByReservationId(int $reservationId): ?Stationnement { return $this->active; }
                public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
                public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
                public function listActiveByParkingId(int $parkingId): array { return []; }
                public function countActiveByParkingId(int $parkingId): int { return 0; }
                public function revenueForParking(string $from, string $to, int $parkingId): array {
                    return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
                }
            },
            new class implements ParkingRepository {
                public function create(array $data): int { return 0; }
                public function findById(int $id): ?Parking { return null; }
                public function listByOwnerId(int $ownerId): array { return []; }
                public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            },
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Parking not found');

        $uc->execute(10, 1);
    }
}
