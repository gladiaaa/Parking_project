<?php
declare(strict_types=1);

namespace Tests\UseCase\Reservation;

use PHPUnit\Framework\TestCase;

use App\UseCase\Reservation\CreateReservation;
use App\UseCase\Parking\CalculateOccupancy;

use App\Domain\Entity\Parking;
use App\Domain\Entity\Reservation;
use App\Domain\Entity\Stationnement;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;

final class CreateReservationTest extends TestCase
{
    private function makeParking(
        int $id = 3,
        int $capacity = 10,
        float $hourlyRate = 10.0
    ): Parking {
        return new Parking(
            $id,
            $capacity,
            '48.8566,2.3522',
            $hourlyRate,
            new \DateTimeImmutable('08:00:00'),
            new \DateTimeImmutable('20:00:00'),
            [],
            []
        );
    }

    private function makeOccupancyReturning(int $total): CalculateOccupancy
    {
        // Stationnement repo: now() = 0 (pas important ici)
        $stationnements = new class implements StationnementRepository {
            public function save(Stationnement $s): Stationnement { throw new \RuntimeException('unused'); }
            public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
            public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function countActiveByParkingId(int $parkingId): int { return 0; }
            public function revenueForParking(string $from, string $to, int $parkingId): array {
                return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
            }
        };

        // Reservation repo: forSlot() retourne $total via countOverlappingNotEntered()
        $reservations = new class($total) implements ReservationRepository {
            public function __construct(private int $total) {}

            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }

            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int {
                return $this->total;
            }
        };

        return new CalculateOccupancy($stationnements, $reservations);
    }

    public function test_throws_when_parking_not_found(): void
    {
        $parkingRepo = new class implements ParkingRepository {
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return null; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
        };

        $uc = new CreateReservation($parkingRepo, $reservationRepo, $this->makeOccupancyReturning(0));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Parking not found');

        $uc->execute(10, 3, '2025-12-17 10:00:00', '2025-12-17 12:00:00', 'car', 12.5);
    }

    public function test_throws_when_invalid_time_range(): void
    {
        $parking = $this->makeParking();

        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $parking) {}
            public function create(array $data): int { return 3; }
            public function findById(int $id): ?Parking { return $this->parking; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return 1; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
        };

        $uc = new CreateReservation($parkingRepo, $reservationRepo, $this->makeOccupancyReturning(0));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Invalid time range');

        $uc->execute(10, 3, '2025-12-17 10:00:00', '2025-12-17 10:00:00', 'car', 12.5);
    }

    public function test_throws_when_parking_full_for_slot(): void
    {
        $parking = $this->makeParking(id: 3, capacity: 2);

        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $parking) {}
            public function create(array $data): int { return 3; }
            public function findById(int $id): ?Parking { return $this->parking; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return 1; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
        };

        // occupied >= capacity (2 >= 2)
        $uc = new CreateReservation($parkingRepo, $reservationRepo, $this->makeOccupancyReturning(2));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Parking full for this time slot');

        $uc->execute(10, 3, '2025-12-17 10:00:00', '2025-12-17 12:00:00', 'car', 12.5);
    }

    public function test_saves_and_returns_reservation_when_ok(): void
    {
        $parking = $this->makeParking(id: 3, capacity: 10);

        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $parking) {}
            public function create(array $data): int { return 3; }
            public function findById(int $id): ?Parking { return $this->parking; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return 1; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public ?Reservation $saved = null;

            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation {
                $this->saved = $reservation;
                return $reservation; // le vrai repo lui mettra un id
            }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
        };

        $uc = new CreateReservation($parkingRepo, $reservationRepo, $this->makeOccupancyReturning(0));

        $res = $uc->execute(10, 3, '2025-12-17 10:00:00', '2025-12-17 12:00:00', 'car', 12.5);

        $this->assertInstanceOf(Reservation::class, $res);
        $this->assertNotNull($reservationRepo->saved);

        $this->assertSame(10, $res->userId());
        $this->assertSame(3, $res->parkingId());
        $this->assertSame('car', $res->vehicleType());
        $this->assertSame(12.5, $res->amount());
    }
}
