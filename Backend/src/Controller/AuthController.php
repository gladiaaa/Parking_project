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

    /**
     * @return array<string,mixed>
     */
    private function readJsonBody(): array
    {
        $raw = file_get_contents('php://input');

        // ✅ PHPUnit/CLI: php://input souvent vide -> fallback test
        if (($raw === '' || $raw === false) && isset($GLOBALS['__TEST_JSON_BODY__'])) {
            $raw = (string) $GLOBALS['__TEST_JSON_BODY__'];
        }

        if (!is_string($raw) || $raw === '') {
            return [];
        }

        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
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

            // Si 2FA requise : pas de JWT définitifs, juste un pending token
            if (!empty($result['two_factor_required']) && $result['two_factor_required'] === true) {
                $userId = (int) ($result['user_id'] ?? 0);

                $p2 = $this->jwt->issuePending2FAToken($userId);
                $this->jwt->setPending2FACookie($p2);

                $this->startTwoFactor->execute($userId);

                Response::json(['status' => '2fa_required']);
                return;
            }

            // Pas de 2FA → on génère les vrais tokens
            $userId = (int) ($result['user_id'] ?? 0);
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
        $role = (string) ($data['role'] ?? 'USER');
        $firstname = $data['firstname'] ?? null;
        $lastname = $data['lastname'] ?? null;

        try {
            $user = $this->registerUser->execute(
                $email,
                $password,
                strtoupper($role),
                $firstname,
                $lastname
            );

            // Login automatique
            [$access, $refresh] = $this->jwt->issueFor((int)$user['id'], (string)$user['role']);
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
}
