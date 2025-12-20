<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;

final class ListParkings
{
    public function __construct(private readonly ParkingRepository $parkingRepo) {}

    public function execute(): array
    {
        return [
            'success' => true,
            'parkings' => $this->parkingRepo->listAll(),
        ];
    }
}
