<?php
declare(strict_types=1);

namespace App\UseCase;

use App\Domain\Entity\Reservation;
use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;
use App\UseCase\Parking\CalculateOccupancy;
use App\UseCase\CreateReservationInterface;

final class CreateReservation implements CreateReservationInterface
{
    public function __construct(
        private readonly ParkingRepository $parkingRepo,
        private readonly ReservationRepository $reservationRepo,
        private readonly CalculateOccupancy $occupancy
    ) {}

    public function execute(
        int $userId,
        int $parkingId,
        string $startAt,
        string $endAt,
        string $vehicleType,
        float $amount
    ): Reservation {
        $parking = $this->parkingRepo->findById($parkingId);
        if ($parking === null) {
            throw new \RuntimeException('Parking not found');
        }

        $start = new \DateTimeImmutable($startAt);
        $end   = new \DateTimeImmutable($endAt);
        if ($end <= $start) {
            throw new \RuntimeException('Invalid time range');
        }

        $capacity = $parking->capacity();

        $occupied = $this->occupancy->totalForAvailability(
            $parkingId,
            $start->format('Y-m-d H:i:s'),
            $end->format('Y-m-d H:i:s')
        );

        if ($occupied >= $capacity) {
            throw new \RuntimeException('Parking full for this time slot');
        }

        $reservation = Reservation::create(
            $userId,
            $parkingId,
            $start,
            $end,
            $vehicleType,
            $amount
        );

        return $this->reservationRepo->save($reservation);
    }
}