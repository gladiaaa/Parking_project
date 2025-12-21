<?php

namespace App\Tests\Controller;

use App\Controller\AuthController;
use App\Infrastructure\Security\JwtManager;
use App\UseCase\Auth\LoginUser;
use App\UseCase\Auth\RefreshToken;
use App\UseCase\Auth\RegisterUser;
use App\UseCase\Auth\StartTwoFactor;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class AuthControllerTest extends TestCase
{
    private LoginUser|MockObject $loginUser;
    private RefreshToken|MockObject $refreshToken;
    private RegisterUser|MockObject $registerUser;
    private StartTwoFactor|MockObject $startTwoFactor;
    private JwtManager|MockObject $jwtManager;
    private AuthController $controller;

    protected function setUp(): void
    {

        $this->loginUser = $this->createMock(LoginUser::class);
        $this->refreshToken = $this->createMock(RefreshToken::class);
        $this->registerUser = $this->createMock(RegisterUser::class);
        $this->startTwoFactor = $this->createMock(StartTwoFactor::class);
        $this->jwtManager = $this->createMock(JwtManager::class);

        $this->controller = new AuthController(
            $this->loginUser,
            $this->refreshToken,
            $this->registerUser,
            $this->startTwoFactor,
            $this->jwtManager
        );
    }

    /**
     * Test d'un login réussi sans 2FA
     */
    public function testLoginSuccessWithout2FA(): void
    {

        $this->loginUser->expects($this->once())
            ->method('execute')
            ->with('test@example.com', 'password123')
            ->willReturn([
                'success' => true,
                'two_factor_required' => false,
                'user_id' => 'uuid-123',
                'role' => 'ROLE_USER'
            ]);

        $this->jwtManager->expects($this->once())
            ->method('issueFor')
            ->willReturn(['access_token_str', 'refresh_token_str']);

        $this->jwtManager->expects($this->once())->method('setAccessCookie');
        $this->jwtManager->expects($this->once())->method('setRefreshCookie');


        // $this->controller->login();
    }

    /**
     * Test du login quand la 2FA est requise
     */
    public function testLoginRequires2FA(): void
    {
        $this->loginUser->method('execute')->willReturn([
            'success' => true,
            'two_factor_required' => true,
            'user_id' => 'uuid-123'
        ]);

        // On vérifie que le token temporaire est généré
        $this->jwtManager->expects($this->once())
            ->method('issuePending2FAToken')
            ->willReturn('pending-token');

        // On vérifie que la procédure 2FA (envoi code mail/sms) est lancée
        $this->startTwoFactor->expects($this->once())
            ->method('execute')
            ->with('uuid-123');

        // $this->controller->login();
    }

    /**
     * Test du logout
     */
    public function testLogoutClearsCookies(): void
    {
        $this->jwtManager->expects($this->once())
            ->method('clearAuthCookies');

        $this->controller->logout();
    }

    /**
     * Test de l'inscription
     */
    public function testRegisterSuccess(): void
    {
        $userData = ['id' => 'new-uuid', 'role' => 'USER', 'email' => 'new@test.com'];

        $this->registerUser->expects($this->once())
            ->method('execute')
            ->willReturn($userData);

        $this->jwtManager->expects($this->once())->method('issueFor');

        // $this->controller->register();
    }
}