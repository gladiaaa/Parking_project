<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use App\UseCase\Parking\CalculateOccupancy;

use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\SubscriptionRepository;

use App\Domain\Entity\Stationnement;
use App\Domain\Entity\Reservation;
use App\Domain\Entity\Subscription;

final class CalculateOccupancyTest extends TestCase
{
    public function test_now_delegates_to_stationnement_repo(): void
    {
        $stationnements = new class implements StationnementRepository {
            public int $calledWith = -1;

            public function countActiveByParkingId(int $parkingId): int {
                $this->calledWith = $parkingId;
                return 7;
            }

            // required by interface, unused here
            public function countOverlappingForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }

            public function save(Stationnement $s): Stationnement { throw new RuntimeException("unused"); }
            public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
            public function close(int $stationnementId, DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function revenueForParking(string $from, string $to, int $parkingId): array { return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0]; }
        };

        $reservations = new class implements ReservationRepository {
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, DateTimeImmutable $startAt, DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }

            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $subs = new class implements SubscriptionRepository {
            public function save(Subscription $subscription): Subscription { throw new RuntimeException("unused"); }
            public function listByUserId(int $userId): array { return []; }
            public function listByParkingId(int $parkingId): array { return []; }
            public function countActiveNow(int $parkingId, string $at): int { return 0; }
            public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUserParking(int $userId, int $parkingId, string $startDate, string $endDate): bool { return false; }
            public function coversUserForSlot(int $userId, int $parkingId, string $startAt, string $endAt): bool { return false; }
        };

        $occ = new CalculateOccupancy($stationnements, $reservations, $subs);

        $this->assertSame(7, $occ->now(3));
        $this->assertSame(3, $stationnements->calledWith);
    }

    public function test_for_slot_delegates_to_reservation_repo_with_exact_params(): void
    {
        $stationnements = new class implements StationnementRepository {
            public function countActiveByParkingId(int $parkingId): int { return 0; }
            public function countOverlappingForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }

            public function save(Stationnement $s): Stationnement { throw new RuntimeException("unused"); }
            public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
            public function close(int $stationnementId, DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function revenueForParking(string $from, string $to, int $parkingId): array { return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0]; }
        };

        $reservations = new class implements ReservationRepository {
            public array $called = [];

            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int {
                $this->called = [$parkingId, $startAt, $endAt];
                return 4;
            }

            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, DateTimeImmutable $startAt, DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }

            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $subs = new class implements SubscriptionRepository {
            public function save(Subscription $subscription): Subscription { throw new RuntimeException("unused"); }
            public function listByUserId(int $userId): array { return []; }
            public function listByParkingId(int $parkingId): array { return []; }
            public function countActiveNow(int $parkingId, string $at): int { return 0; }
            public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }
            public function existsOverlappingForUserParking(int $userId, int $parkingId, string $startDate, string $endDate): bool { return false; }
            public function coversUserForSlot(int $userId, int $parkingId, string $startAt, string $endAt): bool { return false; }
        };

        $occ = new CalculateOccupancy($stationnements, $reservations, $subs);

        $start = '2025-12-17 10:00:00';
        $end   = '2025-12-17 12:00:00';

        $this->assertSame(4, $occ->forSlot(9, $start, $end));
        $this->assertSame([9, $start, $end], $reservations->called);
    }

    public function test_total_for_availability_calls_both_and_sums(): void
    {
        $stationnements = new class implements StationnementRepository {
            public int $callsSlot = 0;
            public function countActiveByParkingId(int $parkingId): int { return 0; }

            public function countOverlappingForSlot(int $parkingId, string $startAt, string $endAt): int {
                $this->callsSlot++;
                return 2;
            }

            public function save(Stationnement $s): Stationnement { throw new RuntimeException("unused"); }
            public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
            public function close(int $stationnementId, DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function revenueForParking(string $from, string $to, int $parkingId): array { return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0]; }
        };

        $reservations = new class implements ReservationRepository {
            public int $calls = 0;

            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int {
                $this->calls++;
                return 3;
            }

            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, DateTimeImmutable $startAt, DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }

            public function listForUser(int $userId): array { return []; }
            public function cancelForUser(int $userId, int $reservationId, string $now): bool { return false; }
            public function existsOverlappingForUser(int $userId, string $startAt, string $endAt): bool { return false; }
        };

        $subs = new class implements SubscriptionRepository {
            public int $calls = 0;

            public function countActiveForSlot(int $parkingId, string $startAt, string $endAt): int {
                $this->calls++;
                return 0;
            }

            public function save(Subscription $subscription): Subscription { throw new RuntimeException("unused"); }
            public function listByUserId(int $userId): array { return []; }
            public function listByParkingId(int $parkingId): array { return []; }
            public function countActiveNow(int $parkingId, string $at): int { return 0; }
            public function existsOverlappingForUserParking(int $userId, int $parkingId, string $startDate, string $endDate): bool { return false; }
            public function coversUserForSlot(int $userId, int $parkingId, string $startAt, string $endAt): bool { return false; }
        };

        $occ = new CalculateOccupancy($stationnements, $reservations, $subs);

        $total = $occ->totalForAvailability(3, '2025-12-17 10:00:00', '2025-12-17 12:00:00');

        $this->assertSame(5, $total);
        $this->assertSame(1, $stationnements->callsSlot);
        $this->assertSame(1, $reservations->calls);
        $this->assertSame(1, $subs->calls);
    }
}
