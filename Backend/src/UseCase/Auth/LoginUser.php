<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\PasswordHasher;
use App\Infrastructure\Security\JwtManager;

final class LoginUser {
  public function __construct(
    private UserRepository $users,
    private PasswordHasher $hasher,
    private JwtManager $jwt
  ) {}

  /** @return array{access:string, refresh:string}|array{p2:true} */
  public function __invoke(string $email, string $password): array {
    $u = $this->users->findByEmail($email);
    if (!$u || !$this->hasher->verify($password, $u->passwordHash())) {
      throw new \RuntimeException('Invalid credentials');
    }

    // 2FA activée -> phase 2
    if ($u->twoFactorEnabled()) {
      return ['p2'=>true];
    }

    // Sinon tokens directs
    [$a, $r] = $this->jwt->issueFor($u->id(), $u->role());
    return ['access'=>$a,'refresh'=>$r];
  }
}
