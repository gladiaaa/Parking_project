<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\PasswordHasher;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Auth\LoginUser;
use App\UseCase\Auth\RefreshToken;
use App\UseCase\Auth\StartTwoFactor;

final class AuthController {
  public function __construct(
    private UserRepository $users,
    private PasswordHasher $hash,
    private JwtManager $jwt
  ) {}

  public function login(): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = (string)($data['email'] ?? '');
    $password = (string)($data['password'] ?? '');

    try {
      $result = (new LoginUser($this->users, $this->hash, $this->jwt))->__invoke($email, $password);
      if (isset($result['p2'])) {
        // Démarrer 2FA
        (new StartTwoFactor($this->users, $this->jwt))->__invoke($email);
        Response::json(['status'=>'2fa_required']);
        return;
      }
      $this->jwt->setAccessCookie($result['access']);
      $this->jwt->setRefreshCookie($result['refresh']);
      Response::json(['ok'=>true]);
    } catch (\Throwable $e) {
      Response::json(['error'=>'Invalid credentials'], 401);
    }
  }

  public function refresh(): void {
    $result = (new RefreshToken($this->jwt, $this->users))->__invoke();
    if (!$result) { Response::json(['error'=>'Invalid refresh'], 401); return; }
    $this->jwt->setAccessCookie($result['access']);
    Response::json(['ok'=>true]);
  }

  public function logout(): void {
    $this->jwt->clearAuthCookies();
    Response::json(['ok'=>true]);
  }
}
