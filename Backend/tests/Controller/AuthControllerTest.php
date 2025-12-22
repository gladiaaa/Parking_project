<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\AuthController;
use App\Infrastructure\Security\JwtManagerInterface;
use App\UseCase\Auth\LoginUserInterface;
use App\UseCase\Auth\RefreshTokenInterface;
use App\UseCase\Auth\RegisterUserInterface;
use App\UseCase\Auth\StartTwoFactorInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class AuthControllerTest extends TestCase
{
    private LoginUserInterface|MockObject $loginUser;
    private RefreshTokenInterface|MockObject $refreshToken;
    private RegisterUserInterface|MockObject $registerUser;
    private StartTwoFactorInterface|MockObject $startTwoFactor;
    private JwtManagerInterface|MockObject $jwtManager;
    private AuthController $controller;

    private function mockBody(array $data): void
    {
        $GLOBALS['__TEST_RAW_BODY__'] = json_encode($data, JSON_THROW_ON_ERROR);
    }

    protected function tearDown(): void
    {
        unset($GLOBALS['__TEST_RAW_BODY__']);
    }

    protected function setUp(): void
    {
        $this->loginUser = $this->createMock(LoginUserInterface::class);
        $this->refreshToken = $this->createMock(RefreshTokenInterface::class);
        $this->registerUser = $this->createMock(RegisterUserInterface::class);
        $this->startTwoFactor = $this->createMock(StartTwoFactorInterface::class);
        $this->jwtManager = $this->createMock(JwtManagerInterface::class);

        $this->controller = new AuthController(
            $this->loginUser,
            $this->refreshToken,
            $this->registerUser,
            $this->startTwoFactor,
            $this->jwtManager
        );
    }

    public function testLoginSuccessWithout2FA(): void
    {
        $this->mockBody([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $this->loginUser->expects($this->once())
            ->method('execute')
            ->with('test@example.com', 'password123')
            ->willReturn([
                'success' => true,
                'two_factor_required' => false,
                'user_id' => 123,
                'role' => 'USER',
            ]);

        $this->jwtManager->expects($this->once())
            ->method('issueFor')
            ->with(123, 'USER')
            ->willReturn(['access_token_str', 'refresh_token_str']);

        $this->jwtManager->expects($this->once())
            ->method('setAccessCookie')
            ->with('access_token_str');

        $this->jwtManager->expects($this->once())
            ->method('setRefreshCookie')
            ->with('refresh_token_str');

        $this->controller->login();
    }

    public function testLoginRequires2FA(): void
    {
        $this->mockBody([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $this->loginUser->expects($this->once())
            ->method('execute')
            ->with('test@example.com', 'password123')
            ->willReturn([
                'success' => true,
                'two_factor_required' => true,
                'user_id' => 123,
            ]);

        $this->jwtManager->expects($this->once())
            ->method('issuePending2FAToken')
            ->with(123)
            ->willReturn('pending-token');

        $this->jwtManager->expects($this->once())
            ->method('setPending2FACookie')
            ->with('pending-token');

        $this->startTwoFactor->expects($this->once())
            ->method('execute')
            ->with(123);

        $this->controller->login();
    }

    public function testLogoutClearsCookies(): void
    {
        $this->jwtManager->expects($this->once())
            ->method('clearAuthCookies');

        $this->controller->logout();
    }

    public function testRegisterSuccess(): void
    {
        $this->mockBody([
            'email' => 'new@test.com',
            'password' => 'password123',
            'role' => 'USER',
            'firstname' => 'John',
            'lastname' => 'Doe',
        ]);

        $userData = [
            'id' => 999,
            'role' => 'USER',
            'email' => 'new@test.com',
        ];

        $this->registerUser->expects($this->once())
            ->method('execute')
            ->with('new@test.com', 'password123', 'USER', 'John', 'Doe')
            ->willReturn($userData);

        $this->jwtManager->expects($this->once())
            ->method('issueFor')
            ->with(999, 'USER')
            ->willReturn(['access_token_str', 'refresh_token_str']);

        $this->jwtManager->expects($this->once())
            ->method('setAccessCookie')
            ->with('access_token_str');

        $this->jwtManager->expects($this->once())
            ->method('setRefreshCookie')
            ->with('refresh_token_str');

        $this->controller->register();
    }
}