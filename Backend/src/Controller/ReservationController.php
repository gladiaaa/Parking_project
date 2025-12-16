<?php
declare(strict_types=1);

namespace App\Controller;

use App\Domain\Repository\ReservationRepository;
use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Http\Response;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\CreateReservation;

final class ReservationController
{
    public function jwt(): JwtManager
    {
        return $this->jwt;
    }

    public function __construct(
        private readonly CreateReservation $createReservation,
        private readonly ReservationRepository $reservationRepository,
        private readonly JwtManager $jwt
    ) {
    }

    private function requireUserId(): int
    {
        $payload = $this->jwt->readAccessFromCookie();

        if (!$payload || ($payload['typ'] ?? '') !== 'access') {
            Response::json(['error' => 'Unauthorized'], 401);
            exit;
        }

        $userId = (int) ($payload['sub'] ?? 0);
        if ($userId <= 0) {
            Response::json(['error' => 'Unauthorized'], 401);
            exit;
        }

        return $userId;
    }

    #[IsGranted('USER')]
    public function create(): void
    {
        $userId = $this->requireUserId();

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $parkingId = (int) ($data['parking_id'] ?? 0);
        $startAt = (string) ($data['start_at'] ?? '');
        $endAt = (string) ($data['end_at'] ?? '');
        $vehicleType = (string) ($data['vehicle_type'] ?? '');
        $amount = (float) ($data['amount'] ?? -1);

        if ($parkingId <= 0 || $startAt === '' || $endAt === '' || $vehicleType === '' || $amount < 0) {
            Response::json(['error' => 'Missing fields'], 400);
            return;
        }

        try {
            $res = $this->createReservation->execute(
                $userId,
                $parkingId,
                $startAt,
                $endAt,
                $vehicleType,
                $amount
            );

            Response::json([
                'id' => $res->id(),
                'user_id' => $res->userId(),
                'parking_id' => $res->parkingId(),
                'start_at' => $res->startAt()->format(DATE_ATOM),
                'end_at' => $res->endAt()->format(DATE_ATOM),
                'vehicle_type' => $res->vehicleType(),
                'amount' => $res->amount(),
                'created_at' => $res->createdAt()->format(DATE_ATOM),
            ], 201);
        } catch (\Throwable $e) {
            // En prod: évite de leak le message brut. Là tu peux garder temporairement si vous êtes en dev.
            Response::json(['error' => $e->getMessage()], 400);
        }
    }

    #[IsGranted('USER')]
    public function myReservations(): void
    {
        $userId = $this->requireUserId();

        try {
            $rows = $this->reservationRepository->findByUserId($userId);

            Response::json([
                'data' => array_map(static fn($r) => [
                    'id' => $r->id(),
                    'user_id' => $r->userId(),
                    'parking_id' => $r->parkingId(),
                    'start_at' => $r->startAt()->format(DATE_ATOM),
                    'end_at' => $r->endAt()->format(DATE_ATOM),
                    'vehicle_type' => $r->vehicleType(),
                    'amount' => $r->amount(),
                    'created_at' => $r->createdAt()->format(DATE_ATOM),
                ], $rows),
            ], 200);
        } catch (\Throwable $e) {
            Response::json(['error' => $e->getMessage()], 400);
        }
    }
}
