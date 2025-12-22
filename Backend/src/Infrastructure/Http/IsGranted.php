<?php
declare(strict_types=1);

namespace App\Infrastructure\Http;

use App\Infrastructure\Security\JwtManager;

#[\Attribute(\Attribute::TARGET_METHOD)]
final class IsGranted
{
    public function __construct(private string $role = 'USER')
    {
    }

    public function assert(JwtManager $jwt): bool
    {
        $payload = $jwt->readAccessFromCookie();

        if (!$payload) {
            Response::json(['error' => 'Unauthorized'], 401);
            return false;
        }

        $userRole = strtoupper((string) ($payload['role'] ?? 'USER'));
        $needed = strtoupper((string) $this->role);

        $ranks = [
            'USER' => 1,
            'OWNER' => 2,
            'ADMIN' => 3,
        ];

        if (($ranks[$userRole] ?? 0) < ($ranks[$needed] ?? 99)) {
            Response::json(['error' => 'Forbidden'], 403);
            return false;
        }

        return true;
    }


}
