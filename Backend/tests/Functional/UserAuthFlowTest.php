<?php
declare(strict_types=1);

namespace Tests\Functional;

use PHPUnit\Framework\TestCase;
use Tests\Support\HttpTestClient;
use Tests\Support\TestKernel;
use App\Infrastructure\Security\JwtManager;

final class UserAuthFlowTest extends TestCase
{
    private HttpTestClient $http;

    private const REGISTER = '/api/auth/register';
    private const ME       = '/api/me';

    protected function setUp(): void
    {
        $router = TestKernel::boot();
        $this->http = new HttpTestClient($router);
    }

    public function testUserCanRegisterThenAccessMe(): void
    {
        $email = 'user_' . bin2hex(random_bytes(4)) . '@test.local';
        $password = 'Test1234!';

        $reg = $this->http->request([
            'method' => 'POST',
            'path' => self::REGISTER,
            'json' => [
                'email' => $email,
                'password' => $password,
                'firstname' => 'User',
                'lastname' => 'Test',
                'role' => 'USER',
            ],
        ]);

        $this->assertSame(201, $reg['status'], $reg['raw']);
        $this->assertIsArray($reg['json'], $reg['raw']);

        $user = $reg['json']['user'] ?? null;
        $this->assertIsArray($user, $reg['raw']);

        $userId = (int)($user['id'] ?? 0);
        $this->assertGreaterThan(0, $userId, $reg['raw']);

        $cookies = $this->issueAuthCookies($userId, 'USER');

        $me = $this->http->request([
            'method' => 'GET',
            'path' => self::ME,
            'cookies' => $cookies,
        ]);

        $this->assertSame(200, $me['status'], $me['raw']);
        $this->assertIsArray($me['json'], $me['raw']);

        $payload = $me['json']['data'] ?? $me['json'];
        $this->assertSame($email, $payload['email'] ?? null, $me['raw']);
    }

    /**
     * @return array<string,string>
     */
    private function issueAuthCookies(int $userId, string $role): array
    {
        $jwt = new JwtManager(
            (string)($_ENV['JWT_SECRET'] ?? ''),
            (int)($_ENV['JWT_ACCESS_TTL'] ?? 3600),
            (int)($_ENV['JWT_REFRESH_TTL'] ?? 86400),
        );

        [$access, $refresh] = $jwt->issueFor($userId, strtoupper($role));

        return [
            'ACCESS_TOKEN' => $access,
            'REFRESH_TOKEN' => $refresh,
        ];
    }
}
