<?php
declare(strict_types=1);

namespace App\Controller;


use AllowDynamicProperties;
use ParkingReservation;

#[AllowDynamicProperties] final class ReservationController
{
    public function __construct(ParkingReservation $reservationService) {
        $this->reservationService = $reservationService;
    }

}
