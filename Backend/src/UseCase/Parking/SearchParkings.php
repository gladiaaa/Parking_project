<?php
declare(strict_types=1);

namespace App\UseCase\Parking;

use App\Domain\Repository\ParkingRepository;

final class SearchParkings
{
    public function __construct(
        private readonly ParkingRepository $parkingRepo,
        private readonly CheckAvailability $checkAvailability
    ) {}

    public function execute(array $params): array
    {
        $lat = isset($params['lat']) ? (float)$params['lat'] : 0.0;
        $lng = isset($params['lng']) ? (float)$params['lng'] : 0.0;
        $radius = isset($params['radius']) ? (float)$params['radius'] : 0.0;

        $startAt = (string)($params['start_at'] ?? '');
        $endAt   = (string)($params['end_at'] ?? '');

        if ($lat === 0.0 || $lng === 0.0 || $radius <= 0.0) {
            throw new \InvalidArgumentException('Missing lat/lng/radius');
        }
        if ($startAt === '' || $endAt === '') {
            throw new \InvalidArgumentException('Missing start_at/end_at');
        }

        $candidates = $this->parkingRepo->searchNearby($lat, $lng, $radius);

        $results = [];
        foreach ($candidates as $p) {
            $parkingId = (int)($p['id'] ?? 0);
            if ($parkingId <= 0) continue;

            $avail = $this->checkAvailability->execute([
                'parking_id' => $parkingId,
                'start_at' => $startAt,
                'end_at' => $endAt,
            ]);

            $capacity = (int)($p['capacity'] ?? 0);
            $occupied = (int)($avail['occupied'] ?? 0);
            $remaining = (int)($avail['remaining'] ?? max(0, $capacity - $occupied));
            $available = (bool)($avail['available'] ?? ($remaining > 0));

            $results[] = [
                'id' => $parkingId,
                'latitude' => (float)($p['latitude'] ?? 0),
                'longitude' => (float)($p['longitude'] ?? 0),
                'capacity' => $capacity,
                'hourly_rate' => (float)($p['hourly_rate'] ?? 0),
                'opening_time' => (string)($p['opening_time'] ?? ''),
                'closing_time' => (string)($p['closing_time'] ?? ''),
                'address' => (string)($p['address'] ?? ''),
                'opening_days' => $p['opening_days'] ?? '[]',
                'distance_km' => (float)($p['distance_km'] ?? 0),

                'occupied' => $occupied,
                'remaining' => $remaining,
                'available' => $available,
            ];
        }

        return [
            'success' => true,
            'parkings' => $results,
            'total' => count($results),
        ];
    }
}
