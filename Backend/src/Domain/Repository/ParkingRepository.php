<?php

namespace App\Domain\Repository;

use App\Domain\Entity\Parking;

interface ParkingRepository
{
    public function create(array $data): int;

    public function findById(int $id): ?Parking;
}
