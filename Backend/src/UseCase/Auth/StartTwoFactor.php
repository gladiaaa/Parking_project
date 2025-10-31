<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\JwtManager;

final class StartTwoFactor {
  public function __construct(private UserRepository $users, private JwtManager $jwt) {}

  /** Retourne true si OTP émis et cookie P2_AUTH posé */
  public function __invoke(string $email): bool {
    $u = $this->users->findByEmail($email);
    if (!$u) return false;
    $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $exp  = new \DateTimeImmutable('+5 minutes');
    $u2   = $u->with2FACode($code, $exp);
    $this->users->save2FA($u2);

    // DEV: on "émule" l'envoi (log). En prod: mail/SMS via provider.
    error_log("[2FA] code for {$u->email()}: $code (valid jusqu'à ".$exp->format('H:i:s').")");

    $p2 = $this->jwt->issuePending2FAToken($u->id());
    $this->jwt->setPending2FACookie($p2);
    return true;
  }
}
