<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Auth\VerifyTwoFactor;

final class Auth2FAController
{
    public function __construct(
        private VerifyTwoFactor $verifyTwoFactor,
        private JwtManager $jwt,
    ) {}

    public function verify(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $code = (string)($data['code'] ?? '');

        // On lit le token "pending 2FA" (P2_AUTH)
        $p2 = $this->jwt->readPending2FA();
        if (!$p2 || ($p2['typ'] ?? '') !== 'p2') {
            Response::json(['error' => 'Missing 2FA session'], 401);
            return;
        }

        $userId = (int)($p2['sub'] ?? 0);
        if ($userId <= 0) {
            Response::json(['error' => 'Invalid 2FA context'], 401);
            return;
        }

        try {
            // Use case = logique métier
            $tokens = $this->verifyTwoFactor->execute($userId, $code);
        } catch (\Throwable) {
            Response::json(['error' => 'Invalid 2FA'], 401);
            return;
        }

        // Pose les cookies ACCESS / REFRESH
        $this->jwt->setAccessCookie($tokens['access_token']);
        $this->jwt->setRefreshCookie($tokens['refresh_token']);

        // On détruit le cookie P2_AUTH
        $this->jwt->setPending2FACookie(''); // ou setcookie('P2_AUTH', '', time()-3600, '/');

        Response::json(['ok' => true]);
    }

    public function resend(): void
    {
        // à implémenter si tu veux renvoyer un code, pour l’instant juste OK
        Response::json(['ok' => true]);
    }
}
