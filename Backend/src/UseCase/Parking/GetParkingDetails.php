<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;

final class GetParkingDetails
{
    public function __construct(
        private readonly ParkingRepository $parkingRepo
    ) {}

    public function execute(int $parkingId): array
    {
        $parking = $this->parkingRepo->findById($parkingId);
        if ($parking === null) {
            throw new \RuntimeException('Parking not found');
        }

        return [
            'id' => $parking->id(),
            'capacity' => $parking->capacity(),
            'gps' => $parking->gps(),
            'hourly_rate' => $parking->hourlyRate(),
            'opening_time' => $parking->openingTime()->format('H:i:s'),
            'closing_time' => $parking->closingTime()->format('H:i:s'),
        ];
    }
}
