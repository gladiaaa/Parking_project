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

    public function assert(): void
    {
        $jwt = new JwtManager(\JWT_SECRET, \ACCESS_TTL, \REFRESH_TTL);
        $payload = $jwt->readAccessFromCookie();
        if (!$payload) {
            Response::json(['error' => 'Unauthorized'], 401);
            exit;
        }
        $userRole = $payload['role'] ?? 'USER';
        $ranks = ['USER' => 1, 'OWNER' => 2, 'ADMIN' => 3,];
        if (($ranks[$userRole] ?? 0) < ($ranks[$this->role] ?? 99)) {
            Response::json(['error' => 'Forbidden'], 403);
            exit;
        }
    }
}
