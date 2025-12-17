<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Infrastructure\Http\IsGranted;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Subscription\CreateSubscription;
use App\Domain\Repository\SubscriptionRepository;

final class SubscriptionController
{
    public function __construct(
        private readonly JwtManager $jwt,
        private readonly CreateSubscription $createSubscription,
        private readonly SubscriptionRepository $subscriptions
    ) {}

    public function jwt(): JwtManager
    {
        return $this->jwt;
    }

    // POST /api/subscriptions
    #[IsGranted('USER')]
    public function create(): void
    {
        $payload = $this->jwt->readAccessFromCookie();
        if (!$payload) {
            Response::json(['success' => false, 'error' => 'Unauthorized'], 401);
            return;
        }

        $userId = (int)($payload['sub'] ?? 0);
        if ($userId <= 0) {
            Response::json(['success' => false, 'error' => 'Unauthorized'], 401);
            return;
        }

        $data = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];

        $parkingId   = (int)($data['parking_id'] ?? 0);
        $startDate   = (string)($data['start_date'] ?? '');
        $months      = (int)($data['months'] ?? 0);
        $weeklySlots = $data['weekly_slots'] ?? [];

        if ($parkingId <= 0) {
            Response::json(['success' => false, 'error' => 'parking_id required'], 400);
            return;
        }

        try {
            $sub = $this->createSubscription->execute(
                $userId,
                $parkingId,
                $startDate,
                $months,
                is_array($weeklySlots) ? $weeklySlots : []
            );

            Response::json([
                'success' => true,
                'subscription' => [
                    'id'          => $sub->id(),
                    'user_id'     => $sub->userId(),
                    'parking_id'  => $sub->parkingId(),
                    'start_date'  => $sub->startDate()->format('Y-m-d'),
                    'end_date'    => $sub->endDate()->format('Y-m-d'),
                    'weekly_slots'=> $sub->weeklySlots(),
                ],
            ], 201);
        } catch (\Throwable $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    // GET /api/subscriptions/me
    #[IsGranted('USER')]
    public function me(): void
    {
        $payload = $this->jwt->readAccessFromCookie();
        if (!$payload) {
            Response::json(['success' => false, 'error' => 'Unauthorized'], 401);
            return;
        }

        $userId = (int)($payload['sub'] ?? 0);
        if ($userId <= 0) {
            Response::json(['success' => false, 'error' => 'Unauthorized'], 401);
            return;
        }

        $subs = $this->subscriptions->listByUserId($userId);

        $out = [];
        foreach ($subs as $s) {
            $out[] = [
                'id' => $s->id(),
                'parking_id' => $s->parkingId(),
                'start_date' => $s->startDate()->format('Y-m-d'),
                'end_date' => $s->endDate()->format('Y-m-d'),
                'weekly_slots' => $s->weeklySlots(),
            ];
        }

        Response::json(['success' => true, 'data' => $out], 200);
    }
}
