<?php
declare(strict_types=1);

namespace Tests\UseCase\Reservation;

use PHPUnit\Framework\TestCase;

use App\UseCase\Reservation\CreateReservation;
use App\UseCase\Parking\CalculateOccupancy;

use App\Domain\Entity\Parking;
use App\Domain\Entity\Reservation;
use App\Domain\Entity\Stationnement;
use App\Domain\Entity\Subscription;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\SubscriptionRepository;

final class CreateReservationTest extends TestCase
{
    private function today(string $time): string
    {
        $d = (new \DateTimeImmutable('now'))->format('Y-m-d');
        return $d . ' ' . $time;
    }

    private function makeParkingTodayOpenAllDay(
        int $id = 3,
        int $capacity = 10,
        float $hourlyRate = 10.0
    ): Parking {
        $today = (new \DateTimeImmutable('now'))->format('Y-m-d');

        return new Parking(
            $id,
            $capacity,
            '48.8566,2.3522',
            $hourlyRate,
            new \DateTimeImmutable($today . ' 00:00:00'),
            new \DateTimeImmutable($today . ' 23:59:59'),
            '1 Rue de Paris, 75000 Paris',
            []
        );
    }

    private function makeOccupancyReturning(int $total): CalculateOccupancy
    {
        $stationnements = new class implements StationnementRepository {
            public function save(Stationnement $s): Stationnement { throw new \RuntimeException('unused'); }
            public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
            public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function countActiveByParkingId(int $parkingId): int { return 0; }
            public function countOverlappingForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function revenueForParking(string $from, string $to, int $parkingId): array {
                return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
            }
        };

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

            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $subs = new class implements SubscriptionRepository {
            public function save(Subscription $subscription): Subscription { throw new \RuntimeException('unused'); }
            public function listByUserId(int $userId): array { return []; }
            public function listByParkingId(int $parkingId): array { return []; }
            public function countActiveNow(int $parkingId, string $at): int { return 0; }
            public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUserParking(int $userId, int $parkingId, string $startDate, string $endDate): bool { return false; }
            public function coversUserForSlot(int $userId, int $parkingId, string $startAt, string $endAt): bool { return false; }
        };

        return new CalculateOccupancy($stationnements, $reservations, $subs);
    }

    private function makeSubsRepoNotCovering(): SubscriptionRepository
    {
        return new class implements SubscriptionRepository {
            public function save(Subscription $subscription): Subscription { throw new \RuntimeException('unused'); }
            public function listByUserId(int $userId): array { return []; }
            public function listByParkingId(int $parkingId): array { return []; }
            public function countActiveNow(int $parkingId, string $at): int { return 0; }
            public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUserParking(int $userId, int $parkingId, string $startDate, string $endDate): bool { return false; }
            public function coversUserForSlot(int $userId, int $parkingId, string $startAt, string $endAt): bool { return false; }
        };
    }

    public function test_throws_when_parking_not_found(): void
    {
        $parkingRepo = new class implements ParkingRepository {
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return null; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }

            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $uc = new CreateReservation(
            $parkingRepo,
            $reservationRepo,
            $this->makeOccupancyReturning(0),
            $this->makeSubsRepoNotCovering()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Parking not found');

        $uc->execute(10, 3, $this->today('10:00:00'), $this->today('12:00:00'), 'car', 12.5);
    }

    public function test_throws_when_invalid_time_range(): void
    {
        $parking = $this->makeParkingTodayOpenAllDay();

        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $parking) {}
            public function create(array $data): int { return 3; }
            public function findById(int $id): ?Parking { return $this->parking; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return 1; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }

            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $uc = new CreateReservation(
            $parkingRepo,
            $reservationRepo,
            $this->makeOccupancyReturning(0),
            $this->makeSubsRepoNotCovering()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Invalid time range');

        $uc->execute(10, 3, $this->today('10:00:00'), $this->today('10:00:00'), 'car', 12.5);
    }

    public function test_throws_when_parking_full_for_slot(): void
    {
        $parking = $this->makeParkingTodayOpenAllDay(id: 3, capacity: 2);

        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $parking) {}
            public function create(array $data): int { return 3; }
            public function findById(int $id): ?Parking { return $this->parking; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return 1; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }

            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $uc = new CreateReservation(
            $parkingRepo,
            $reservationRepo,
            $this->makeOccupancyReturning(2),
            $this->makeSubsRepoNotCovering()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Parking full for this time slot');

        $uc->execute(10, 3, $this->today('10:00:00'), $this->today('12:00:00'), 'car', 12.5);
    }

    public function test_saves_and_returns_reservation_when_ok(): void
    {
        $parking = $this->makeParkingTodayOpenAllDay(id: 3, capacity: 10);

        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $parking) {}
            public function create(array $data): int { return 3; }
            public function findById(int $id): ?Parking { return $this->parking; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return 1; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $reservationRepo = new class implements ReservationRepository {
            public ?Reservation $saved = null;

            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { $this->saved = $reservation; return $reservation; }

            public function findByUserId(int $userId): array { return []; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }

            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $uc = new CreateReservation(
            $parkingRepo,
            $reservationRepo,
            $this->makeOccupancyReturning(0),
            $this->makeSubsRepoNotCovering()
        );

        $res = $uc->execute(10, 3, $this->today('10:00:00'), $this->today('12:00:00'), 'car', 12.5);

        $this->assertInstanceOf(Reservation::class, $res);
        $this->assertNotNull($reservationRepo->saved);

        $this->assertSame(10, $res->userId());
        $this->assertSame(3, $res->parkingId());
        $this->assertSame('car', $res->vehicleType());
        $this->assertSame(12.5, $res->amount());
    }
}
