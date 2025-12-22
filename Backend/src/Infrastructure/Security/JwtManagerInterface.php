<?php
declare(strict_types=1);

namespace App\Infrastructure\Security;

interface JwtManagerInterface
{
    /** @return array{0:string,1:string} */
    public function issueFor(string|int $userId, string $role): array;

    public function setAccessCookie(string $token): void;
    public function setRefreshCookie(string $token): void;
    public function clearAuthCookies(): void;

    public function issuePending2FAToken(string|int $userId): string;
    public function setPending2FACookie(string $token): void;

    public function decode(string $jwt): ?array;

    public function readAccessFromCookie(): ?array;
    public function readRefreshFromCookie(): ?array;
    public function readPending2FA(): ?array;
}