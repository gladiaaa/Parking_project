<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Parking\GetParkingDetails;
use App\UseCase\Parking\CheckAvailability;
use App\Domain\Repository\StationnementRepository;

final class ParkingController
{
    public function __construct(
        private readonly JwtManager $jwt,
        private readonly GetParkingDetails $getParkingDetails,
        private readonly CheckAvailability $checkAvailability,
        private readonly StationnementRepository $stationnementRepo
    ) {}

    public function jwt(): JwtManager
    {
        return $this->jwt;
    }

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

    // GET /api/parkings/availability?parking_id=1&start_at=...&end_at=...
    #[IsGranted('USER')]
    public function availability(): void
    {
        try {
            $data = [
                'parking_id' => $_GET['parking_id'] ?? null,
                'start_at'   => $_GET['start_at'] ?? null,
                'end_at'     => $_GET['end_at'] ?? null,
            ];

            $result = $this->checkAvailability->execute($data);
            Response::json($result, 200);
        } catch (\Throwable $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }
    // GET /api/parkings/occupancy-now?parking_id=2
public function occupancyNow(): void
{
    $parkingId = (int)($_GET['parking_id'] ?? 0);
    if ($parkingId <= 0) {
        Response::json(['success' => false, 'error' => 'Missing parking_id'], 400);
        return;
    }

    try {
        $parking = $this->getParkingDetails->execute($parkingId);
        $capacity = (int)($parking['capacity'] ?? 0);

        // IMPORTANT: countActiveByParkingId vient du repo stationnements
        $occupied = $this->stationnementRepo->countActiveByParkingId($parkingId);
        $remaining = max(0, $capacity - $occupied);

        Response::json([
            'parking_id' => $parkingId,
            'capacity' => $capacity,
            'occupied_now' => $occupied,
            'remaining_now' => $remaining,
            'available_now' => $remaining > 0,
        ], 200);
    } catch (\Throwable $e) {
        Response::json(['success' => false, 'error' => $e->getMessage()], 404);
    }
}

}
