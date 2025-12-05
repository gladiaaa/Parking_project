<?php
// Fichier : src/Domain/Repository/ParkingReservationRepository.php

namespace App\Domain\Repository;

use App\Domain\Entity\parking;

interface ParkingReservationRepository
{
    public function save(parking $parking): void;

}