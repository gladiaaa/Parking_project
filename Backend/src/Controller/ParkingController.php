<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\UseCase\Parking\GetParkingDetails;
use App\UseCase\Parking\CheckAvailability;

final class ParkingController
{
    public function __construct(
        private readonly GetParkingDetails $getParkingDetails,
        private readonly CheckAvailability $checkAvailability
    ) {}

    // GET /api/parkings/details?id=1
    public function details(): void
    {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            Response::json(['success' => false, 'error' => 'Missing id'], 400);
            return;
        }

        try {
            $parking = $this->getParkingDetails->execute($id);
            Response::json(['success' => true, 'parking' => $parking], 200);
        } catch (\Throwable $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 404);
        }
    }

    // GET /api/parkings/availability?id=1&start_at=...&end_at=...
    public function availability(): void
    {
        $id = (int)($_GET['id'] ?? 0);
        $startAt = (string)($_GET['start_at'] ?? '');
        $endAt = (string)($_GET['end_at'] ?? '');

        if ($id <= 0 || $startAt === '' || $endAt === '') {
            Response::json(['success' => false, 'error' => 'Missing fields'], 400);
            return;
        }

        try {
            $result = $this->checkAvailability->execute([
                'parking_id' => $id,
                'start_at' => $startAt,
                'end_at' => $endAt,
            ]);

            Response::json(['success' => true] + $result, 200);
        } catch (\Throwable $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }
}
