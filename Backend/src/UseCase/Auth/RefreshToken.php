<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Infrastructure\Security\JwtManager;
use App\Domain\Repository\UserRepository;

final class RefreshToken {
  public function __construct(private JwtManager $jwt, private UserRepository $users) {}

  /** @return array{access:string}|null */
  public function __invoke(): ?array {
    $refresh = $this->jwt->readRefreshFromCookie();
    if (!$refresh || ($refresh['typ'] ?? '') !== 'refresh') { return null; }
    $u = $this->users->findById((int)$refresh['sub']);
    if (!$u) { return null; }
    [$access, ] = $this->jwt->issueFor($u->id(), $u->role());
    return ['access'=>$access];
  }
}
