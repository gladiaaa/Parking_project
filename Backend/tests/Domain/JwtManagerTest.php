<?php
declare(strict_types=1);

namespace Tests\Domain;

use App\Infrastructure\Security\JwtManager;
use PHPUnit\Framework\TestCase;

final class JwtManagerTest extends TestCase
{
    private JwtManager $jwt;

    protected function setUp(): void
    {

        $this->jwt = new JwtManager('test-secret-key', 3600, 7200);
    }

    public function testIssueForReturnsTwoValidTokens(): void
    {
        [$access, $refresh] = $this->jwt->issueFor(42, 'USER');


        $this->assertIsString($access);
        $this->assertIsString($refresh);
        $this->assertNotSame($access, $refresh);


        $accessPayload  = $this->jwt->decode($access);
        $refreshPayload = $this->jwt->decode($refresh);

        $this->assertNotNull($accessPayload);
        $this->assertNotNull($refreshPayload);

        // Access token : bon sub / role / typ
        $this->assertSame(42, $accessPayload['sub'] ?? null);
        $this->assertSame('USER', $accessPayload['role'] ?? null);
        $this->assertSame('access', $accessPayload['typ'] ?? null);

        // Refresh token : bon sub / typ
        $this->assertSame(42, $refreshPayload['sub'] ?? null);
        $this->assertSame('refresh', $refreshPayload['typ'] ?? null);

        // Les deux ont un exp
        $this->assertArrayHasKey('exp', $accessPayload);
        $this->assertArrayHasKey('exp', $refreshPayload);
    }

    public function testDecodeReturnsNullForInvalidToken(): void
    {
        $result = $this->jwt->decode('ceci-n-est-pas-un-jwt');
        $this->assertNull($result);
    }

    public function testIssuePending2FATokenHasTypeP2(): void
    {
        $token   = $this->jwt->issuePending2FAToken(99);
        $payload = $this->jwt->decode($token);

        $this->assertNotNull($payload);
        $this->assertSame(99, $payload['sub'] ?? null);
        $this->assertSame('p2', $payload['typ'] ?? null);
    }
}
