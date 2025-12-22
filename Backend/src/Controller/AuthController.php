<?php
declare(strict_types=1);

namespace App\Controller;

use App\Infrastructure\Http\Request;
use App\Infrastructure\Http\Response;
use App\Infrastructure\Security\JwtManagerInterface;
use App\UseCase\Auth\LoginUserInterface;
use App\UseCase\Auth\RefreshTokenInterface;
use App\UseCase\Auth\RegisterUserInterface;
use App\UseCase\Auth\StartTwoFactorInterface;

final class AuthController
{
    public function __construct(
        private LoginUserInterface $loginUser,
        private RefreshTokenInterface $refreshToken,
        private RegisterUserInterface $registerUser,
        private StartTwoFactorInterface $startTwoFactor,
        private JwtManagerInterface $jwt,
    ) {
    }

    /** POST /api/auth/login */
    public function login(): void
    {
        $data = $this->readJsonBody();

        $email = (string) ($data['email'] ?? '');
        $password = (string) ($data['password'] ?? '');

        try {
            $result = $this->loginUser->execute($email, $password);

            if (empty($result['success'])) {
                Response::json(['error' => 'Invalid credentials'], 401);
                return;
            }

            // 2FA requis
            if (!empty($result['two_factor_required'])) {
                $userId = $result['user_id'] ?? 0;

                $pending = $this->jwt->issuePending2FAToken($userId);
                $this->jwt->setPending2FACookie($pending);

                $this->startTwoFactor->execute($userId);

                Response::json(['status' => '2fa_required']);
                return;
            }

            // Pas de 2FA → JWT définitifs
            $userId = $result['user_id'] ?? 0;
            $role = (string) ($result['role'] ?? 'USER');

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
        $data = $this->readJsonBody();

        $email = (string) ($data['email'] ?? '');
        $password = (string) ($data['password'] ?? '');
        $role = strtoupper((string) ($data['role'] ?? 'USER'));
        $firstname = $data['firstname'] ?? null;
        $lastname = $data['lastname'] ?? null;

        try {
            $user = $this->registerUser->execute(
                $email,
                $password,
                $role,
                $firstname,
                $lastname
            );

            // Login automatique après inscription
            $userId = $user['id'] ?? 0;
            $userRole = (string) ($user['role'] ?? $role);

            [$access, $refresh] = $this->jwt->issueFor($userId, $userRole);
            $this->jwt->setAccessCookie($access);
            $this->jwt->setRefreshCookie($refresh);

            Response::json([
                'success' => true,
                'user' => $user,
            ], 201);
        } catch (\RuntimeException $e) {
            Response::json(['error' => $e->getMessage()], 409);
        } catch (\Throwable) {
            Response::json(['error' => 'Error registering user'], 400);
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

    /**
     * Lit le body JSON.
     * - En prod : Request::json()
     * - En test : $GLOBALS['__TEST_RAW_BODY__'] (injecté par les tests)
     */
    private function readJsonBody(): array
    {
        if (isset($GLOBALS['__TEST_RAW_BODY__'])) {
            $raw = (string) $GLOBALS['__TEST_RAW_BODY__'];
            return json_decode($raw, true) ?? [];
        }

        return Request::json();
    }
}