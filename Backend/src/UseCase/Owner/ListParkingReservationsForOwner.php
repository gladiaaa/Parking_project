<?php
declare(strict_types=1);

namespace App\UseCase\Owner;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\ReservationRepository;

final class ListParkingReservationsForOwner
{
    public function __construct(
        private ParkingRepository $parkings,
        private ReservationRepository $reservations,
    ) {}

    public function execute(int $ownerId, int $parkingId, ?string $from, ?string $to): array
    {
        $parking = $this->parkings->findById($parkingId);
        if ($parking === null) {
            throw new \RuntimeException('Parking introuvable');
        }

        $parkingOwnerId = $this->parkings->findOwnerIdByParkingId($parkingId);
        if ($parkingOwnerId === null) {
            throw new \RuntimeException('Parking introuvable');
        }

        if ($parkingOwnerId !== $ownerId) {
            throw new \RuntimeException('Accès refusé');
        }

        return $this->reservations->listByParking($parkingId, $from, $to);
    }
}
