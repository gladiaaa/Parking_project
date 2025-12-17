<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use App\UseCase\Parking\CalculateOccupancy;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Entity\Stationnement;
use App\Domain\Entity\Reservation;

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

            // Unused methods
            public function save(Stationnement $s): Stationnement { throw new RuntimeException("unused"); }
            public function findActiveByReservationId(int $reservationId): ?Stationnement { return null; }
            public function close(int $stationnementId, DateTimeImmutable $exitedAt, float $billedAmount, float $penaltyAmount): void {}
            public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
            public function listActiveByParkingId(int $parkingId): array { return []; }
            public function revenueForParking(string $from, string $to, int $parkingId): array { return ['count_exits'=>0,'total_billed'=>0,'total_penalty'=>0,'total'=>0]; }
        };

        $reservations = new class implements ReservationRepository {
            // Unused in this test
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, DateTimeImmutable $startAt, DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
            public function countOverlappingNotEntered(int $parkingId, string $startAt, string $endAt): int { return 0; }
        };

        $occ = new CalculateOccupancy($stationnements, $reservations);

        $this->assertSame(7, $occ->now(3));
        $this->assertSame(3, $stationnements->calledWith);
    }

    public function test_for_slot_delegates_to_reservation_repo_with_exact_params(): void
    {
        $stationnements = new class implements StationnementRepository {
            public function countActiveByParkingId(int $parkingId): int { return 0; }

            // Unused methods
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

            // Unused methods
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, DateTimeImmutable $startAt, DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
        };

        $occ = new CalculateOccupancy($stationnements, $reservations);

        $start = '2025-12-17 10:00:00';
        $end   = '2025-12-17 12:00:00';

        $this->assertSame(4, $occ->forSlot(9, $start, $end));
        $this->assertSame([9, $start, $end], $reservations->called);
    }

    public function test_total_for_availability_calls_both_and_sums(): void
    {
        $stationnements = new class implements StationnementRepository {
            public int $calls = 0;

            public function countActiveByParkingId(int $parkingId): int {
                $this->calls++;
                return 2;
            }

            // Unused methods
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

            // Unused methods
            public function findById(int $id): ?Reservation { return null; }
            public function save(Reservation $reservation): Reservation { return $reservation; }
            public function findByUserId(int $userId): array { return []; }
            public function findByParkingId(int $parkingId): array { return []; }
            public function countOverlappingForParking(int $parkingId, DateTimeImmutable $startAt, DateTimeImmutable $endAt): int { return 0; }
            public function listByParking(int $parkingId, ?string $from, ?string $to): array { return []; }
        };

        $occ = new CalculateOccupancy($stationnements, $reservations);

        $total = $occ->totalForAvailability(3, '2025-12-17 10:00:00', '2025-12-17 12:00:00');

        $this->assertSame(5, $total);
        $this->assertSame(1, $stationnements->calls);
        $this->assertSame(1, $reservations->calls);
    }
}
