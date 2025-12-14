<?php
declare(strict_types=1);

namespace App\Infrastructure\Security;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtManager
{
    public function __construct(
        private string $secret,
        private int $accessTtl,
        private int $refreshTtl
    ) {
    }

    public function issueFor(int $userId, string $role): array
    {
        $now = time();
        $access = [
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $this->accessTtl,
            'sub' => $userId,
            'role' => $role,
            'typ' => 'access'
        ];
        $refresh = [
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $this->refreshTtl,
            'sub' => $userId,
            'typ' => 'refresh'
        ];
        return [$this->encode($access), $this->encode($refresh)];
    }

    public function encode(array $payload): string
    {
        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function decode(string $jwt): ?array
    {
        try {
            return (array) JWT::decode($jwt, new Key($this->secret, 'HS256'));
        } catch (\Throwable) {
            return null;
        }
    }

    // --- Cookies (HttpOnly)
    public function setAccessCookie(string $token): void
    {
        $this->cookie('ACCESS_TOKEN', $token, $this->accessTtl);
    }
    public function setRefreshCookie(string $token): void
    {
        $this->cookie('REFRESH_TOKEN', $token, $this->refreshTtl);
    }
    public function clearAuthCookies(): void
    {
        $this->cookie('ACCESS_TOKEN', '', -3600);
        $this->cookie('REFRESH_TOKEN', '', -3600);
        $this->cookie('P2_AUTH', '', -3600);
    }
    private function cookie(string $name, string $value, int $ttl): void
    {
        $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        setcookie($name, $value, [
            'expires' => time() + $ttl,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => $secure ? 'None' : 'Lax'
        ]);
    }

    // --- Helpers “lecture”
    public function readAccessFromCookie(): ?array
    {
        $raw = $_COOKIE['ACCESS_TOKEN'] ?? '';
        return $raw ? $this->decode($raw) : null;
    }
    public function readRefreshFromCookie(): ?array
    {
        $raw = $_COOKIE['REFRESH_TOKEN'] ?? '';
        return $raw ? $this->decode($raw) : null;
    }

    // --- 2FA (pending token court)
    public function issuePending2FAToken(int $userId): string
    {
        $now = time();
        $p2 = ['iat' => $now, 'nbf' => $now, 'exp' => $now + 300, 'sub' => $userId, 'typ' => 'p2'];
        return $this->encode($p2);
    }
    public function setPending2FACookie(string $token): void
    {
        $this->cookie('P2_AUTH', $token, 300);
    }
    public function readPending2FA(): ?array
    {
        $raw = $_COOKIE['P2_AUTH'] ?? '';
        return $raw ? $this->decode($raw) : null;
    }
}
