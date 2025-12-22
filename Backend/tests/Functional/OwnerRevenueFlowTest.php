<?php
declare(strict_types=1);

namespace Tests\Functional;

use DateTimeImmutable;
use PHPUnit\Framework\TestCase;
use Tests\Support\HttpTestClient;
use Tests\Support\TestKernel;
use App\Infrastructure\Security\JwtManager;

final class OwnerRevenueFlowTest extends TestCase
{
    private HttpTestClient $http;

    private const REGISTER = '/api/auth/register';
    private const CREATE_PARKING = '/api/owner/parkings';
    private const REVENUE_PATH   = '/api/owner/parkings/%d/revenue';

    protected function setUp(): void
    {
        $router = TestKernel::boot();
        $this->http = new HttpTestClient($router);
    }

    public function testOwnerCanGetMonthlyRevenue(): void
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
        $userId = (int)($reg['json']['user']['id'] ?? 0);
        $this->assertGreaterThan(0, $userId, $reg['raw']);

        $cookies = $this->issueAuthCookies($userId, 'OWNER');

        // 2) Create parking
        $create = $this->http->request([
            'method' => 'POST',
            'path' => self::CREATE_PARKING,
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
        $parkingId = (int)($create['json']['parking_id'] ?? $create['json']['id'] ?? 0);
        $this->assertGreaterThan(0, $parkingId, $create['raw']);

        // 3) Revenue
        $month = (new DateTimeImmutable('first day of this month'))->format('Y-m');

        $rev = $this->http->request([
            'method' => 'GET',
            'path' => sprintf(self::REVENUE_PATH, $parkingId),
            'cookies' => $cookies,
            'query' => ['month' => $month],
        ]);

        $this->assertSame(200, $rev['status'], $rev['raw']);
        $this->assertIsArray($rev['json'], $rev['raw']);

        // Ton payload est { "data": { ..., "total": 0 } }
        $data = $rev['json']['data'] ?? null;
        $this->assertIsArray($data, $rev['raw']);

        $this->assertArrayHasKey('total', $data, $rev['raw']);
        $this->assertIsNumeric($data['total'], $rev['raw']);
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
