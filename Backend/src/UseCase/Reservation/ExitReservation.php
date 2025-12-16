<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Domain\Repository\ParkingRepository;
use App\UseCase\Billing\BillingCalculator;

final class ExitReservation
{
    public function __construct(
        private readonly ReservationRepository $reservationRepo,
        private readonly StationnementRepository $stationnementRepo,
        private readonly ParkingRepository $parkingRepo,
        private readonly BillingCalculator $billing
    ) {}

    public function execute(int $userId, int $reservationId): array
    {
        $res = $this->reservationRepo->findById($reservationId);
        if (!$res) throw new \RuntimeException('Reservation not found');
        if ($res->userId() !== $userId) throw new \RuntimeException('Forbidden');

        $active = $this->stationnementRepo->findActiveByReservationId($reservationId);
        if (!$active) throw new \RuntimeException('Not entered');

        $parking = $this->parkingRepo->findById($res->parkingId());
        if (!$parking) throw new \RuntimeException('Parking not found');

        $now = new \DateTimeImmutable('now');

        $calc = $this->billing->compute(
            $active->enteredAt(),
            $now,
            $res->endAt(),
            $parking->hourlyRate()
        );

        $this->stationnementRepo->close(
            (int)$active->id(),
            $now,
            (float)$calc['base_amount'],
            (float)$calc['penalty_amount']
        );

        return [
            'reservation_id' => $reservationId,
            'exited_at' => $now->format(DATE_ATOM),
            'base_amount' => $calc['base_amount'],
            'penalty_amount' => $calc['penalty_amount'],
            'total_amount' => $calc['total_amount'],
            'billed_minutes' => $calc['billed_minutes'],
        ];
    }
}
