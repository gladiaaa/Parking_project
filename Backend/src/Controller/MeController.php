<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Infrastructure\Security\JwtManager;
use App\Domain\Repository\UserRepository;

final class MeController
{
    public function __construct(
        private JwtManager $jwt,
        private UserRepository $users,
    ) {}

    /** GET /api/me */
    public function me(): void
    {
        // On lit le JWT d'accès depuis le cookie ACCESS_TOKEN
        $payload = $this->jwt->readAccessFromCookie();

        if (!$payload || ($payload['typ'] ?? '') !== 'access') {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }

        $userId = (int)($payload['sub'] ?? 0);
        if ($userId <= 0) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }

        $user = $this->users->findById($userId);
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            return;
        }

        Response::json([
            'id'    => $user->id(),
            'email' => $user->email(),
            'role'  => $user->role(),
            'firstname' => $user->firstname(),
            'lastname' => $user->lastname(),
        ]);
    }
}
