<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Response;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Auth\LoginUser;
use App\UseCase\Auth\RefreshToken;
use App\UseCase\Auth\RegisterUser;
use App\UseCase\Auth\StartTwoFactor;

final class AuthController
{
    public function __construct(
        private LoginUser $loginUser,
        private RefreshToken $refreshToken,
        private RegisterUser $registerUser,
        private StartTwoFactor $startTwoFactor,
        private JwtManager $jwt,
    ) {}

    /** POST /api/auth/login */
    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = (string)($data['email'] ?? '');
        $password = (string)($data['password'] ?? '');

        try {
            $result = $this->loginUser->execute($email, $password);

            if (!$result['success']) {
                Response::json(['error' => 'Invalid credentials'], 401);
                return;
            }

            // Si 2FA requise : pas de JWT définitifs, juste un pending token
            if (!empty($result['two_factor_required']) && $result['two_factor_required'] === true) {
                $userId = $result['user_id'];

                $p2 = $this->jwt->issuePending2FAToken($userId);
                $this->jwt->setPending2FACookie($p2);

                $this->startTwoFactor->execute($userId);

                Response::json(['status' => '2fa_required']);
                return;
            }

            // Pas de 2FA → on génère les vrais tokens
            $userId = $result['user_id'];
            $role   = $result['role'];

            [$access, $refresh] = $this->jwt->issueFor($userId, $role);
            $this->jwt->setAccessCookie($access);
            $this->jwt->setRefreshCookie($refresh);

            Response::json(['ok' => true]);
        } catch (\Throwable) {
            Response::json(['error' => 'Invalid credentials'], 401);
        }
    }

    /** POST /api/auth/register */
    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = (string)($data['email'] ?? '');
        $password = (string)($data['password'] ?? '');

        try {
            $user = $this->registerUser->execute($email, $password);

            Response::json([
                'status' => 'ok',
                'user'   => $user,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            Response::json(['error' => $e->getMessage()], 400);
        } catch (\RuntimeException $e) {
            Response::json(['error' => $e->getMessage()], 409);
        }
    }

    /** POST /api/auth/refresh */
    public function refresh(): void
    {
        $result = $this->refreshToken->execute();

        if (!$result) {
            Response::json(['error' => 'Invalid refresh'], 401);
            return;
        }

        $this->jwt->setAccessCookie($result['access']);
        Response::json(['ok' => true]);
    }

    /** POST /api/auth/logout */
    public function logout(): void
    {
        $this->jwt->clearAuthCookies();
        Response::json(['ok' => true]);
    }
}
