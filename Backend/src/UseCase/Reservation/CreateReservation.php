<?php
declare(strict_types=1);

namespace App\UseCase\Reservation;

use App\Domain\Entity\Reservation;
use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\SubscriptionRepository;
use App\UseCase\Parking\CalculateOccupancy;

final class CreateReservation
{
    public function __construct(
        private readonly ParkingRepository $parkingRepo,
        private readonly ReservationRepository $reservationRepo,
        private readonly CalculateOccupancy $occupancy,
        private readonly SubscriptionRepository $subscriptions
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


        if (!$parking->isOpenForSlot($start, $end)) {
            throw new \RuntimeException('Parking closed for this time slot');
        }

        $startStr = $start->format('Y-m-d H:i:s');
        $endStr   = $end->format('Y-m-d H:i:s');

        //  un user ne peut pas avoir 2 réservations qui se chevauchent
        if ($this->reservationRepo->existsOverlappingForUser($userId, $startStr, $endStr)) {
            throw new \RuntimeException('User already has a reservation overlapping this time range');
        }

        //  si l’utilisateur est couvert par un abonnement sur ce créneau, il n’a pas besoin de réserver
        if ($this->subscriptions->coversUserForSlot($userId, $parkingId, $startStr, $endStr)) {
            throw new \RuntimeException('Reservation not required: covered by an active subscription');
        }

        $capacity = $parking->capacity();

        $occupied = $this->occupancy->totalForAvailability($parkingId, $startStr, $endStr);
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
