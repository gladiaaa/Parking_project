<?php
declare(strict_types=1);

namespace App\UseCase\Auth;

use App\Domain\Repository\UserRepository;
use App\Infrastructure\Security\JwtManager;

final class VerifyTwoFactor
{
  public function __construct(
    private UserRepository $userRepository,
    private JwtManager $jwtManager,
    private TotpVerifier $totpVerifier
  ) {
  }

  public function execute(int $userId, string $code): array
  {
    $user = $this->userRepository->findById($userId);

    if (!$user) {
      throw new \RuntimeException('User not found');
    }

    $method = $user->twoFactorMethod();
    $now = new \DateTimeImmutable();

    $valid = false;

    if ($method === 'email' || $method === 'sms') {
      // helper du domaine
      $valid = $user->hasValid2FACode($code, $now);
    } elseif ($method === 'totp') {
      if (!$user->hasTotpConfigured()) {
        throw new \RuntimeException('TOTP not configured');
      }

      $secret = $user->twoFactorTotpSecret();
      if ($secret === null) {
        throw new \RuntimeException('Missing TOTP secret');
      }

      $valid = $this->totpVerifier->verify($secret, $code);
    } else {
      throw new \RuntimeException('Unknown 2FA method: ' . $method);
    }

    if (!$valid) {
      throw new \RuntimeException('Invalid 2FA code');
    }

    // Nettoyer le challenge pour email/sms
    if ($method === 'email' || $method === 'sms') {
      $user = $user->clear2FA();
      $this->userRepository->save($user);
    }

    // Génération des JWT
    [$accessToken, $refreshToken] = $this->jwtManager->issueFor(
      $user->id(),
      $user->role()
    );

    return [
      'access_token' => $accessToken,
      'refresh_token' => $refreshToken,
    ];
  }
}
