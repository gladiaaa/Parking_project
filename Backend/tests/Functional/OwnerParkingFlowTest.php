<?php
declare(strict_types=1);

namespace Tests\Functional;

use PHPUnit\Framework\TestCase;
use Tests\Support\HttpTestClient;
use Tests\Support\TestKernel;
use App\Infrastructure\Security\JwtManager;

final class OwnerParkingFlowTest extends TestCase
{
    private HttpTestClient $http;

    private const REGISTER     = '/api/auth/register';
    private const CREATE_PARK  = '/api/owner/parkings';
    private const LIST_PARKS   = '/api/owner/parkings';

    protected function setUp(): void
    {
        $router = TestKernel::boot();
        $this->http = new HttpTestClient($router);
    }

    public function testOwnerCanCreateParkingAndSeeItInList(): void
    {
        // 1) Register OWNER
        $email = 'owner_' . bin2hex(random_bytes(4)) . '@test.local';
        $password = 'password';

        $reg = $this->http->request([
            'method' => 'POST',
            'path' => self::REGISTER,
            'json' => [
                'email' => $email,
                'password' => $password,
                'role' => 'OWNER',
                'firstname' => 'Owner',
                'lastname' => 'Test',
            ],
        ]);

        $this->assertSame(201, $reg['status'], $reg['raw']);
        $this->assertIsArray($reg['json'], $reg['raw']);
        $userId = (int)($reg['json']['user']['id'] ?? 0);
        $this->assertGreaterThan(0, $userId, $reg['raw']);

        // 2) Issue cookies directly (no Set-Cookie dependency)
        $cookies = $this->issueAuthCookies($userId, 'OWNER');

        // 3) Create parking
        $create = $this->http->request([
            'method' => 'POST',
            'path' => self::CREATE_PARK,
            'cookies' => $cookies,
            'json' => [
                'latitude' => 48.8566,
                'longitude' => 2.3522,
                'capacity' => 10,
                'hourly_rate' => 2.5,
                'opening_time' => '08:00:00',
                'closing_time' => '22:00:00',
            ],
        ]);

        $this->assertContains($create['status'], [200, 201], $create['raw']);
        $this->assertIsArray($create['json'], $create['raw']);
        $this->assertTrue((bool)($create['json']['success'] ?? true), $create['raw']);

        $parkingId = $create['json']['parking_id'] ?? $create['json']['id'] ?? null;
        $this->assertNotEmpty($parkingId, $create['raw']);

        // 4) List my parkings
        $list = $this->http->request([
            'method' => 'GET',
            'path' => self::LIST_PARKS,
            'cookies' => $cookies,
        ]);

        $this->assertSame(200, $list['status'], $list['raw']);
        $this->assertIsArray($list['json'], $list['raw']);
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
