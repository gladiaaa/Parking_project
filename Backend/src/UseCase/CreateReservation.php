<?php

namespace App\UseCase;

use App\Domain\Entity\Reservation;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\ParkingRepository;

final class CreateReservation
{
    public function __construct(
        private ParkingRepository $parkingRepo,
        private ReservationRepository $reservationRepo,
    ) {}

    public function execute(
        int $userId,
        int $parkingId,
        string $startAt,
        string $endAt,
        string $vehicleType,
        float $amount
    ): Reservation {
        $start = new \DateTimeImmutable($startAt);
        $end = new \DateTimeImmutable($endAt);

        $parking = $this->parkingRepo->findById($parkingId);
        if ($parking === null) {
            throw new \RuntimeException("Parking not found");
        }

        $capacity = $parking->getNbPlaces(); // later rename to capacity()

        $overlapping = $this->reservationRepo->countOverlappingForParking($parkingId, $start, $end);

        if ($overlapping >= $capacity) {
            throw new \RuntimeException("Parking full for this time slot");
        }

        $reservation = Reservation::create($userId, $parkingId, $start, $end, $vehicleType, $amount);
        return $this->reservationRepo->save($reservation);
    }
}
