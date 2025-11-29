<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Infrastructure\Security\JwtManager;
use App\Domain\Repository\UserRepository;

final class GetCurrentUser {
  public function __construct(private JwtManager $jwt, private UserRepository $users) {}

  public function __invoke(): ?array {
    $p = $this->jwt->readAccessFromCookie();
    if (!$p || ($p['typ'] ?? '') !== 'access') return null;
    $u = $this->users->findById((int)$p['sub']);
    if (!$u) return null;
    return ['id'=>$u->id(), 'email'=>$u->email(), 'role'=>$u->role()];
  }
}
