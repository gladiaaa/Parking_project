<?php
declare(strict_types=1);

namespace App\UseCase\Owner;

use App\Domain\Repository\ParkingRepository;
use App\Domain\Repository\StationnementRepository;

final class ListActiveStationnementsForOwner
{
    public function __construct(
        private ParkingRepository $parkings,
        private StationnementRepository $stationnements
    ) {}

    public function execute(int $ownerId, int $parkingId): array
    {
        $parkingOwnerId = $this->parkings->findOwnerIdByParkingId($parkingId);
        if ($parkingOwnerId === null) {
            throw new \RuntimeException('Parking introuvable');
        }
        if ($parkingOwnerId !== $ownerId) {
            throw new \RuntimeException('Accès refusé');
        }

        return $this->stationnements->listActiveByParkingId($parkingId);
    }
}
