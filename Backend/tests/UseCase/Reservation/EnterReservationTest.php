<?php
declare(strict_types=1);

namespace Tests\UseCase\Reservation;

use PHPUnit\Framework\TestCase;

use App\UseCase\Reservation\EnterReservation;

use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\ParkingRepository;

use App\Domain\Entity\Reservation;
use App\Domain\Entity\Stationnement;
use App\Domain\Entity\Parking;

final class EnterReservationTest extends TestCase
{
    private function makeParkingOpenToday(int $id = 3): Parking
    {
        $today = (new \DateTimeImmutable('now'))->format('Y-m-d');

        return new Parking(
            $id,
            10,
            '48.8566,2.3522',
            10.0,
            new \DateTimeImmutable($today . ' 00:00:00'),
            new \DateTimeImmutable($today . ' 23:59:59'),
            '1 Rue de Paris, 75000 Paris',
            []
        );
    }

    private function makeParkingClosedToday(int $id = 3): Parking
    {
        $today = (new \DateTimeImmutable('now'))->format('Y-m-d');

        // fermé "maintenant" dans 99% des cas
        return new Parking(
            $id,
            10,
            '48.8566,2.3522',
            10.0,
            new \DateTimeImmutable($today . ' 00:00:00'),
            new \DateTimeImmutable($today . ' 00:01:00'),
            '1 Rue de Paris, 75000 Paris',
            []
        );
    }

    public function test_throws_when_reservation_not_found(): void
    {
        $resRepo = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $stRepo = new class implements StationnementRepository {
            public function save(Stationnement $s): Stationnement { return $s; }
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

        $parkingRepo = new class implements ParkingRepository {
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return null; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $uc = new EnterReservation($resRepo, $stRepo, $parkingRepo);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Reservation not found');

        $uc->execute(10, 1);
    }

    public function test_throws_when_forbidden_user(): void
    {
        $reservation = Reservation::create(
            999, 3,
            new \DateTimeImmutable('-1 hour'),
            new \DateTimeImmutable('+1 hour'),
            'car', 12.5
        )->withId(1);

        $resRepo = new class($reservation) implements ReservationRepository {
            public function __construct(private Reservation $r) {}
            public function findById(int $id): ?Reservation { return $this->r; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $stRepo = new class implements StationnementRepository {
            public function save(Stationnement $s): Stationnement { return $s; }
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

        $parking = $this->makeParkingOpenToday(3);
        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $p) {}
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return $this->p; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $uc = new EnterReservation($resRepo, $stRepo, $parkingRepo);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Forbidden');

        $uc->execute(10, 1);
    }

    public function test_throws_when_reservation_not_active(): void
    {
        $reservation = Reservation::create(
            10, 3,
            new \DateTimeImmutable('+1 hour'),
            new \DateTimeImmutable('+2 hours'),
            'car', 12.5
        )->withId(1);

        $resRepo = new class($reservation) implements ReservationRepository {
            public function __construct(private Reservation $r) {}
            public function findById(int $id): ?Reservation { return $this->r; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $stRepo = new class implements StationnementRepository {
            public function save(Stationnement $s): Stationnement { return $s; }
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

        $parking = $this->makeParkingOpenToday(3);
        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $p) {}
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return $this->p; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $uc = new EnterReservation($resRepo, $stRepo, $parkingRepo);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Reservation not active');

        $uc->execute(10, 1);
    }

    public function test_throws_when_parking_closed(): void
    {
        $reservation = Reservation::create(
            10, 3,
            new \DateTimeImmutable('-1 hour'),
            new \DateTimeImmutable('+1 hour'),
            'car', 12.5
        )->withId(1);

        $resRepo = new class($reservation) implements ReservationRepository {
            public function __construct(private Reservation $r) {}
            public function findById(int $id): ?Reservation { return $this->r; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $stRepo = new class implements StationnementRepository {
            public function save(Stationnement $s): Stationnement { return $s; }
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

        $parking = $this->makeParkingClosedToday(3);
        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $p) {}
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return $this->p; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $uc = new EnterReservation($resRepo, $stRepo, $parkingRepo);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Parking closed: entry not allowed');

        $uc->execute(10, 1);
    }

    public function test_throws_when_already_entered(): void
    {
        $reservation = Reservation::create(
            10, 3,
            new \DateTimeImmutable('-1 hour'),
            new \DateTimeImmutable('+1 hour'),
            'car', 12.5
        )->withId(1);

        $active = Stationnement::enter(1, new \DateTimeImmutable('now'))->withId(10);

        $resRepo = new class($reservation) implements ReservationRepository {
            public function __construct(private Reservation $r) {}
            public function findById(int $id): ?Reservation { return $this->r; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $stRepo = new class($active) implements StationnementRepository {
            public function __construct(private Stationnement $active) {}
            public function save(Stationnement $s): Stationnement { return $s; }
            public function findActiveByReservationId(int $reservationId): ?Stationnement { return $this->active; }
            public function close(int $stationnementId, \DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function countActiveByParkingId(int $parkingId): int { return 0; }
            public function countOverlappingForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function revenueForParking(string $from, string $to, int $parkingId): array {
                return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0];
            }
        };

        $parking = $this->makeParkingOpenToday(3);
        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $p) {}
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return $this->p; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $uc = new EnterReservation($resRepo, $stRepo, $parkingRepo);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Already entered');

        $uc->execute(10, 1);
    }

    public function test_enters_and_saves_stationnement_when_ok(): void
    {
        $reservation = Reservation::create(
            10, 3,
            new \DateTimeImmutable('-1 hour'),
            new \DateTimeImmutable('+1 hour'),
            'car', 12.5
        )->withId(1);

        $resRepo = new class($reservation) implements ReservationRepository {
            public function __construct(private Reservation $r) {}
            public function findById(int $id): ?Reservation { return $this->r; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, \DateTimeImmutable $startAt, \DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $stRepo = new class implements StationnementRepository {
            public ?Stationnement $saved = null;

            public function save(Stationnement $s): Stationnement { $this->saved = $s; return $s; }
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

        $parking = $this->makeParkingOpenToday(3);
        $parkingRepo = new class($parking) implements ParkingRepository {
            public function __construct(private Parking $p) {}
            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return $this->p; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };

        $uc = new EnterReservation($resRepo, $stRepo, $parkingRepo);

        $s = $uc->execute(10, 1);

        $this->assertInstanceOf(Stationnement::class, $s);
        $this->assertNotNull($stRepo->saved);
        $this->assertSame(1, $s->reservationId());
        $this->assertNull($s->exitedAt());
    }
}
