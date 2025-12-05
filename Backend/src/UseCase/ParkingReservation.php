<?php

use App\Domain\Repository\ParkingReservationRepository;

class ParkingReservation
{

public function __construct(
private ParkingReservationRepository $parkingRepository
) {

}
}