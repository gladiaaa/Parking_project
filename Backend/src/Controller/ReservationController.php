<?php
declare(strict_types=1);

namespace App\Controller;

use App\Domain\Repository\ReservationRepository;
use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Http\Response;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Reservation\CreateReservation;
use App\UseCase\Reservation\EnterReservation;
use App\UseCase\Reservation\ExitReservation;
use App\UseCase\Reservation\GetInvoiceHtml;

final class ReservationController
{
    public function __construct(
        private readonly CreateReservation $createReservation,
        private readonly ReservationRepository $reservationRepository,
        private readonly JwtManager $jwt,
        private readonly EnterReservation $enterReservation,
        private readonly ExitReservation $exitReservation,
        private readonly GetInvoiceHtml $getInvoiceHtml
    ) {}

    // Pour ton Router/IsGranted
    public function jwt(): JwtManager
    {
        return $this->jwt;
    }

    private function fail(string $message, int $status = 400): void
    {
        Response::json(['success' => false, 'error' => $message], $status);
    }

    private function ok(array $payload = [], int $status = 200): void
    {
        Response::json(['success' => true] + $payload, $status);
    }

    private function requireUserId(): int
    {
        $payload = $this->jwt->readAccessFromCookie();

        if (!$payload || ($payload['typ'] ?? '') !== 'access') {
            $this->fail('Unauthorized', 401);
            exit;
        }

        $userId = (int)($payload['sub'] ?? 0);
        if ($userId <= 0) {
            $this->fail('Unauthorized', 401);
            exit;
        }

        return $userId;
    }

    #[IsGranted('USER')]
    public function create(): void
    {
        $userId = $this->requireUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $parkingId = (int)($data['parking_id'] ?? 0);
        $startAt = (string)($data['start_at'] ?? '');
        $endAt = (string)($data['end_at'] ?? '');
        $vehicleType = (string)($data['vehicle_type'] ?? '');
        $amount = (float)($data['amount'] ?? -1);

        if ($parkingId <= 0 || $startAt === '' || $endAt === '' || $vehicleType === '' || $amount < 0) {
            $this->fail('Missing fields', 400);
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

            $this->ok([
                'reservation' => [
                    'id' => $res->id(),
                    'user_id' => $res->userId(),
                    'parking_id' => $res->parkingId(),
                    'start_at' => $res->startAt()->format(DATE_ATOM),
                    'end_at' => $res->endAt()->format(DATE_ATOM),
                    'vehicle_type' => $res->vehicleType(),
                    'amount' => $res->amount(),
                    'created_at' => $res->createdAt()->format(DATE_ATOM),
                ]
            ], 201);
        } catch (\Throwable $e) {
            $this->fail($e->getMessage(), 400);
        }
    }

    #[IsGranted('USER')]
    public function myReservations(): void
    {
        $userId = $this->requireUserId();

        try {
            $rows = $this->reservationRepository->findByUserId($userId);

            $this->ok([
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
            $this->fail($e->getMessage(), 400);
        }
    }

    #[IsGranted('USER')]
    public function enter(int $id): void
    {
        $userId = $this->requireUserId();

        try {
            $st = $this->enterReservation->execute($userId, $id);

            $this->ok([
                'stationnement_id' => $st->id(),
                'reservation_id' => $st->reservationId(),
                'entered_at' => $st->enteredAt()->format(DATE_ATOM),
            ], 200);
        } catch (\Throwable $e) {
            $this->fail($e->getMessage(), 400);
        }
    }

    #[IsGranted('USER')]
    public function exit(int $id): void
    {
        $userId = $this->requireUserId();

        try {
            $result = $this->exitReservation->execute($userId, $id);
            $this->ok($result, 200);
        } catch (\Throwable $e) {
            $this->fail($e->getMessage(), 400);
        }
    }

    #[IsGranted('USER')]
    public function invoice(int $id): void
    {
        $userId = $this->requireUserId();

        try {
            $html = $this->getInvoiceHtml->execute($userId, $id);
            http_response_code(200);
            header('Content-Type: text/html; charset=utf-8');
            echo $html;
        } catch (\Throwable $e) {
            $this->fail($e->getMessage(), 400);
        }
    }
}
