<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\JwtManager;

final class VerifyTwoFactor {
  public function __construct(private UserRepository $users, private JwtManager $jwt) {}

  /** @return array{access:string,refresh:string}|null */
  public function __invoke(string $code): ?array {
    $p2 = $this->jwt->readPending2FA();
    if (!$p2 || ($p2['typ'] ?? '') !== 'p2') return null;
    $u = $this->users->findById((int)$p2['sub']);
    if (!$u || !$u->twoFactorEnabled()) return null;

    if (!$u->twoFactorLastCode() || !$u->twoFactorExpiresAt() || $u->twoFactorExpiresAt() < new \DateTimeImmutable()) {
      return null;
    }
    if (trim($code) !== $u->twoFactorLastCode()) return null;

    // OK -> tokens finaux
    return (new class($this->jwt) {
      public function __construct(private JwtManager $jwt) {}
      public function issue(int $uid, string $role): array { return $this->jwt->issueFor($uid, $role); }
    })->issue($u->id(), $u->role());
  }
}
