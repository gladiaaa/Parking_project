<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Auth\VerifyTwoFactor;

final class Auth2FAController {
  public function __construct(private UserRepository $users, private JwtManager $jwt) {}

  public function verify(): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $code = (string)($data['code'] ?? '');
    $res = (new VerifyTwoFactor($this->users, $this->jwt))->__invoke($code);
    if (!$res) { Response::json(['error'=>'Invalid 2FA'], 401); return; }
    $this->jwt->setAccessCookie($res['access']);
    $this->jwt->setRefreshCookie($res['refresh']);
    // on pourrait purger P2_AUTH ici; clear via JwtManager::clearAuthCookies() poserait aussi refresh/access
    setcookie('P2_AUTH','', time()-3600, '/');
    Response::json(['ok'=>true]);
  }

  public function resend(): void {
    // Optionnel: relancer StartTwoFactor avec l'email stocké côté P2 (on ne l'a pas, on a sub)
    Response::json(['ok'=>true]); // à implémenter si besoin
  }
}
