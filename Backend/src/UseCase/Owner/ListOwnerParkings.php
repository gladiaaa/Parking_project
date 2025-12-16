<?php
declare(strict_types=1);

namespace App\UseCase\Owner;

use App\Domain\Repository\ParkingRepository;

final class ListOwnerParkings
{
    public function __construct(private ParkingRepository $parkings) {}

    public function execute(int $ownerId): array
    {
        return $this->parkings->listByOwnerId($ownerId);
    }
}
