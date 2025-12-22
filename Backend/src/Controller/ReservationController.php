<?php
declare(strict_types=1);

namespace App\Controller;

use App\Domain\Repository\ReservationRepository;
use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Http\Response;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Reservation\CancelReservation;
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
        private readonly GetInvoiceHtml $getInvoiceHtml,
        private readonly CancelReservation $cancelReservation
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

    /**
     * @return array<string,mixed>
     */
    private function readJsonBody(): array
    {
        $raw = file_get_contents('php://input');

        // ✅ PHPUnit/CLI: php://input est souvent vide -> fallback test
        if (($raw === '' || $raw === false) && isset($GLOBALS['__TEST_JSON_BODY__'])) {
            $raw = (string) $GLOBALS['__TEST_JSON_BODY__'];
        }

        if (!is_string($raw) || $raw === '') {
            return [];
        }

        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Renvoie 0 si unauthorized et a déjà répondu.
     */
    private function requireUserId(): int
    {
        $payload = $this->jwt->readAccessFromCookie();

        if (!$payload || ($payload['typ'] ?? '') !== 'access') {
            $this->fail('Unauthorized', 401);
            return 0;
        }

        $userId = (int) ($payload['sub'] ?? 0);
        if ($userId <= 0) {
            $this->fail('Unauthorized', 401);
            return 0;
        }

        return $userId;
    }

    #[IsGranted('USER')]
    public function create(): void
    {
        $userId = $this->requireUserId();
        if ($userId === 0) {
            return;
        }

        $data = $this->readJsonBody();

        $parkingId    = (int) ($data['parking_id'] ?? 0);
        $startAt      = (string) ($data['start_at'] ?? '');
        $endAt        = (string) ($data['end_at'] ?? '');
        $vehicleType  = (string) ($data['vehicle_type'] ?? '');
        $amount       = (float) ($data['amount'] ?? -1);

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
        if ($userId === 0) {
            return;
        }

        try {
            $rows = $this->reservationRepository->listForUser($userId);

            $this->ok([
                'data' => array_map(static function (array $r): array {
                    $billed  = $r['billed_amount'] !== null ? (float) $r['billed_amount'] : null;
                    $penalty = $r['penalty_amount'] !== null ? (float) $r['penalty_amount'] : 0.0;

                    return [
                        'id' => (int) $r['id'],
                        'user_id' => (int) $r['user_id'],
                        'parking_id' => (int) $r['parking_id'],

                        'start_at' => (new \DateTimeImmutable((string) $r['start_at']))->format(DATE_ATOM),
                        'end_at' => (new \DateTimeImmutable((string) $r['end_at']))->format(DATE_ATOM),
                        'created_at' => (new \DateTimeImmutable((string) $r['created_at']))->format(DATE_ATOM),

                        'vehicle_type' => (string) ($r['vehicle_type'] ?? ''),
                        'amount' => (float) ($r['amount'] ?? 0),

                        'statut' => (string) ($r['statut'] ?? 'confirmée'),
                        'date_annulation' => $r['date_annulation'] ?? null,

                        // infos parking pour le front
                        'parking_adresse' => (string) ($r['parking_address'] ?? ''),

                        // champs CRITIQUES pour afficher Entrer/Sortir
                        'date_entree' => $r['entered_at']
                            ? (new \DateTimeImmutable((string) $r['entered_at']))->format(DATE_ATOM)
                            : null,
                        'date_sortie' => $r['exited_at']
                            ? (new \DateTimeImmutable((string) $r['exited_at']))->format(DATE_ATOM)
                            : null,

                        // montant final si sortie
                        'montant_final' => $billed !== null ? ($billed + $penalty) : null,
                    ];
                }, $rows),
            ], 200);
        } catch (\Throwable $e) {
            $this->fail($e->getMessage(), 400);
        }
    }

    #[IsGranted('USER')]
    public function enter(int $id): void
    {
        $userId = $this->requireUserId();
        if ($userId === 0) {
            return;
        }

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
        if ($userId === 0) {
            return;
        }

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
        if ($userId === 0) {
            return;
        }

        try {
            $html = $this->getInvoiceHtml->execute($userId, $id);
            http_response_code(200);
            header('Content-Type: text/html; charset=utf-8');
            echo $html;
        } catch (\Throwable $e) {
            $this->fail($e->getMessage(), 400);
        }
    }

    #[IsGranted('USER')]
    public function cancel(int $id): void
    {
        $userId = $this->requireUserId();
        if ($userId === 0) {
            return;
        }

        try {
            $result = $this->cancelReservation->execute($userId, $id);
            $this->ok($result, 200);
        } catch (\Throwable $e) {
            $this->fail($e->getMessage(), 400);
        }
    }
}
