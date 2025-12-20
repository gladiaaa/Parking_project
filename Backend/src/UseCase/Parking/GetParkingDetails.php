<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;

final class GetParkingDetails
{
    public function __construct(
        private readonly ParkingRepository $parkings
    ) {}

    /**
     * Retourne un tableau prêt pour l'API.
     * IMPORTANT:
     * - On renvoie "address" (pas "adress")
     * - opening_days en array<int> (1..7)
     * - opening_time / closing_time format "H:i:s"
     */
    public function execute(int $id): array
    {
        if ($id <= 0) {
            throw new \RuntimeException('Invalid id');
        }

        $parking = $this->parkings->findById($id);
        if (!$parking) {
            throw new \RuntimeException('Parking not found');
        }

        // gps est stocké comme "lat,lng"
        $gps = $parking->gps();
        $lat = 0.0;
        $lng = 0.0;

        if (is_string($gps) && str_contains($gps, ',')) {
            [$latStr, $lngStr] = array_map('trim', explode(',', $gps, 2));
            $lat = (float) $latStr;
            $lng = (float) $lngStr;
        }

        return [
            'id' => $parking->id(),
            'capacity' => $parking->capacity(),

            // ✅ pour le front
            'latitude' => $lat,
            'longitude' => $lng,

            // ✅ address + opening_days (CE QUI TE MANQUE)
            'address' => $parking->address(),
            'opening_days' => $parking->openingDays(),

            'hourly_rate' => $parking->hourlyRate(),
            'opening_time' => $parking->openingTime()->format('H:i:s'),
            'closing_time' => $parking->closingTime()->format('H:i:s'),
        ];
    }
}
