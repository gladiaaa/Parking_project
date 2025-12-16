<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;

final class CreateParking
{
    public function __construct(private readonly ParkingRepository $parkingRepo) {}

    public function execute(array $data): array
    {
        $latitude = $data['latitude'] ?? null;
        $longitude = $data['longitude'] ?? null;
        $capacity = (int)($data['capacity'] ?? 0);
        $hourlyRate = $data['hourly_rate'] ?? null;
        $openingTime = (string)($data['opening_time'] ?? '');
        $closingTime = (string)($data['closing_time'] ?? '');

        if (!is_numeric($latitude) || !is_numeric($longitude) || $capacity <= 0 || !is_numeric($hourlyRate) || $openingTime === '' || $closingTime === '') {
            throw new \RuntimeException('Missing fields');
        }

        $id = $this->parkingRepo->create([
            'latitude' => (float)$latitude,
            'longitude' => (float)$longitude,
            'capacity' => $capacity,
            'hourly_rate' => (float)$hourlyRate,
            'opening_time' => $openingTime,
            'closing_time' => $closingTime,
        ]);

        $parking = $this->parkingRepo->findById($id);
        return ['parking' => $parking];
    }
}
