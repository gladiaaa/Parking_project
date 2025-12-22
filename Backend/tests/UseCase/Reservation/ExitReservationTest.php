<?php
declare(strict_types=1);

namespace Tests\UseCase\Reservation;

use PHPUnit\Framework\TestCase;

use App\UseCase\Reservation\ExitReservation;
use App\UseCase\Billing\BillingCalculator;

use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\ParkingRepository;

use App\Domain\Entity\Reservation;
use App\Domain\Entity\Stationnement;
use App\Domain\Entity\Parking;

/**
 * Spy de repo pour tester ExitReservation sans que l'IDE pleure
 * (interfaces ≠ propriétés custom).
 */
final class StationnementRepositorySpy implements StationnementRepository
{
    public bool $closed = false;
    public int $closedId = 0;
    public ?\DateTimeImmutable $closedAt = null;
    public float $closedBase = 0.0;
    public float $closedPenalty = 0.0;

    public function __construct(private ?Stationnement $active = null) {}

    public function save(Stationnement $s): Stationnement { return $s; }

    public function findActiveByReservationId(int $reservationId): ?Stationnement
    {
        return $this->active;
    }

    public function close(
        int $stationnementId,
        \DateTimeImmutable $exitedAt,
        float $billedAmount,
        float $penaltyAmount
    ): void {
        $this->closed = true;
        $this->closedId = $stationnementId;
        $this->closedAt = $exitedAt;
        $this->closedBase = $billedAmount;
        $this->closedPenalty = $penaltyAmount;
    }

    public function findLastByReservationId(int $reservationId): ?Stationnement { return null; }
    public function listActiveByParkingId(int $parkingId): array { return []; }
    public function countActiveByParkingId(int $parkingId): int { return 0; }
    public function countOverlappingForSlot(int $parkingId, string $startAt, string $endAt): int { return 0; }

    public function revenueForParking(string $from, string $to, int $parkingId): array
    {
        return ['count_exits' => 0, 'total_billed' => 0, 'total_penalty' => 0, 'total' => 0];
    }
}

final class ExitReservationTest extends TestCase
{
    /**
     * Parking "safe" : daté aujourd'hui, ouvert toute la journée.
     * Comme ça, aucun check de temps ne peut saboter le test.
     *
     * ⚠️ Si ton constructeur Parking est différent, adapte ici UNIQUEMENT.
     */
    private function makeParkingToday(int $parkingId = 3, float $hourlyRate = 10.0): Parking
    {
        $today = (new \DateTimeImmutable('now'))->format('Y-m-d');

        return new Parking(
            $parkingId,
            10,
            '48.8566,2.3522',
            $hourlyRate,
            new \DateTimeImmutable($today . ' 00:00:00'),
            new \DateTimeImmutable($today . ' 23:59:59'),
            '1 Rue de Paris, 75000 Paris',
            []
        );
    }

    private function makeParkingRepo(?Parking $parking): ParkingRepository
    {
        return new class($parking) implements ParkingRepository {
            public function __construct(private ?Parking $p) {}

            public function create(array $data): int { return 0; }
            public function findById(int $id): ?Parking { return $this->p; }
            public function listByOwnerId(int $ownerId): array { return []; }
            public function findOwnerIdByParkingId(int $parkingId): ?int { return null; }
            public function listAll(): array { return []; }
            public function searchNearby(float $latitude, float $longitude, float $radiusKm): array { return []; }
        };
    }

    private function makeReservationRepo(?Reservation $reservation): ReservationRepository
    {
        return new class($reservation) implements ReservationRepository {
            public function __construct(private ?Reservation $r) {}

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
    }

    public function test_throws_when_reservation_not_found(): void
    {
        $stRepo = new StationnementRepositorySpy(
            Stationnement::enter(1, new \DateTimeImmutable('-10 minutes'))->withId(5)
        );

        $uc = new ExitReservation(
            $this->makeReservationRepo(null),
            $stRepo,
            $this->makeParkingRepo($this->makeParkingToday(3, 10.0)),
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Reservation not found');

        $uc->execute(10, 1);
    }

    public function test_throws_when_forbidden_user(): void
    {
        $reservation = Reservation::create(
            999,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('+2 hours'),
            'car',
            12.5
        )->withId(1);

        $stRepo = new StationnementRepositorySpy(
            Stationnement::enter(1, new \DateTimeImmutable('-10 minutes'))->withId(5)
        );

        $uc = new ExitReservation(
            $this->makeReservationRepo($reservation),
            $stRepo,
            $this->makeParkingRepo($this->makeParkingToday(3, 10.0)),
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Forbidden');

        $uc->execute(10, 1);
    }

    public function test_throws_when_not_entered(): void
    {
        $reservation = Reservation::create(
            10,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('+2 hours'),
            'car',
            12.5
        )->withId(1);

        $stRepo = new StationnementRepositorySpy(null);

        $uc = new ExitReservation(
            $this->makeReservationRepo($reservation),
            $stRepo,
            $this->makeParkingRepo($this->makeParkingToday(3, 10.0)),
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Not entered');

        $uc->execute(10, 1);
    }

    public function test_throws_when_parking_not_found(): void
    {
        $reservation = Reservation::create(
            10,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('+2 hours'),
            'car',
            12.5
        )->withId(1);

        $stRepo = new StationnementRepositorySpy(
            Stationnement::enter(1, new \DateTimeImmutable('-10 minutes'))->withId(5)
        );

        $uc = new ExitReservation(
            $this->makeReservationRepo($reservation),
            $stRepo,
            $this->makeParkingRepo(null),
            new BillingCalculator()
        );

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Parking not found');

        $uc->execute(10, 1);
    }

    public function test_closes_stationnement_and_returns_amounts(): void
    {
        // Réservation déjà finie => peut générer de la pénalité selon BillingCalculator
        $reservation = Reservation::create(
            10,
            3,
            new \DateTimeImmutable('-2 hours'),
            new \DateTimeImmutable('-1 hour'),
            'car',
            12.5
        )->withId(1);

        $stRepo = new StationnementRepositorySpy(
            Stationnement::enter(1, new \DateTimeImmutable('-90 minutes'))->withId(5)
        );

        $uc = new ExitReservation(
            $this->makeReservationRepo($reservation),
            $stRepo,
            $this->makeParkingRepo($this->makeParkingToday(3, 2.5)),
            new BillingCalculator()
        );

        $result = $uc->execute(10, 1);

        $this->assertTrue($stRepo->closed);
        $this->assertSame(5, $stRepo->closedId);
        $this->assertInstanceOf(\DateTimeImmutable::class, $stRepo->closedAt);

        $this->assertSame(1, $result['reservation_id']);
        $this->assertArrayHasKey('exited_at', $result);
        $this->assertArrayHasKey('base_amount', $result);
        $this->assertArrayHasKey('penalty_amount', $result);
        $this->assertArrayHasKey('total_amount', $result);
        $this->assertArrayHasKey('billed_minutes', $result);

        $this->assertIsNumeric($result['total_amount']);
        $this->assertIsInt($result['billed_minutes']);
    }
}
