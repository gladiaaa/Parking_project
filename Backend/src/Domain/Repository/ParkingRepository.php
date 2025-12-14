<?php

namespace App\Domain\Repository;

use App\Domain\Entity\Parking;

interface ParkingRepository
{
    public function findById(int $id): ?Parking;
}
