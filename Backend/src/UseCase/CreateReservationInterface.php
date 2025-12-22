<?php
declare(strict_types=1);

namespace App\UseCase;

use App\Domain\Entity\Reservation;

interface CreateReservationInterface
{
    public function execute(
        int $userId,
        int $parkingId,
        string $startAt,
        string $endAt,
        string $vehicleType,
        float $amount
    ): Reservation;
}