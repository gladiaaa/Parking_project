<?php
declare(strict_types=1);

namespace Tests\Functional;

use App\Infrastructure\Http\Router;
use PHPUnit\Framework\TestCase;

final class UserReservationFlowTest extends TestCase
{
    private Router $router;

    protected function setUp(): void
    {
        $_COOKIE = [];
        $_SERVER = [];
        $_GET = [];
        $_POST = [];

        if (function_exists('header_remove')) {
            header_remove();
        }
        http_response_code(200);

        $this->router = $this->bootRouter();
    }

    public function testUserCanReserveEnterAndExit(): void
    {
        $email = 'user_flow_' . uniqid('', true) . '@test.local';
        $password = 'password';

        // 1) Register (tolérant)
        $reg = $this->request('POST', '/api/auth/register', [], [
            'email' => $email,
            'password' => $password,
            'firstname' => 'Flow',
            'lastname' => 'User',
            'role' => 'USER',
        ]);

        if (!in_array($reg['status'], [200, 201, 400, 409], true)) {
            $this->fail("Register unexpected status={$reg['status']} raw={$reg['raw']}");
        }

        // 2) Login
        $login = $this->request('POST', '/api/auth/login', [], [
            'email' => $email,
            'password' => $password,
        ]);

        self::assertSame(
            200,
            $login['status'],
            "Login failed. status={$login['status']} raw={$login['raw']}"
        );

        self::assertArrayHasKey('ACCESS_TOKEN', $_COOKIE, 'ACCESS_TOKEN manquant après login.');

        // 3) Choisir un parking ouvert maintenant
        $parkingId = $this->pickOpenParkingIdNow();
        if ($parkingId === 0) {
            $this->markTestSkipped("Aucun parking n'est ouvert maintenant dans l'environnement de test.");
        }

        // 4) Trouver un slot ACTIF et DISPONIBLE (anti-full)
        $slot = $this->findAvailableActiveSlot($parkingId);
        if ($slot === null) {
            $this->markTestSkipped("Parking id={$parkingId} ouvert mais aucun slot actif n'est disponible (parking plein / données persistées).");
        }

        // 5) Create reservation
        $create = $this->request('POST', '/api/reservations', [], [
            'parking_id' => $parkingId,
            'start_at' => $slot['start_at'],
            'end_at' => $slot['end_at'],
            'vehicle_type' => 'car',
            'amount' => 12.50,
        ]);

        self::assertSame(
            201,
            $create['status'],
            "Create reservation failed. status={$create['status']} raw={$create['raw']}"
        );
        self::assertTrue($create['json']['success'] ?? false, $create['raw']);

        $reservationId = (int)($create['json']['reservation']['id'] ?? 0);
        self::assertGreaterThan(0, $reservationId, 'reservation.id manquant');

        // 6) Enter
        $enter = $this->request('POST', "/api/reservations/{$reservationId}/enter");

        self::assertSame(
            200,
            $enter['status'],
            "Enter failed. status={$enter['status']} raw={$enter['raw']}"
        );
        self::assertTrue($enter['json']['success'] ?? false, $enter['raw']);

        // 7) Exit
        $exit = $this->request('POST', "/api/reservations/{$reservationId}/exit");

        self::assertSame(
            200,
            $exit['status'],
            "Exit failed. status={$exit['status']} raw={$exit['raw']}"
        );
        self::assertTrue($exit['json']['success'] ?? false, $exit['raw']);
    }

    /**
     * Cherche un slot autour de "now" qui soit:
     * - dans la plage d'ouverture (on clamp)
     * - suffisamment long
     * - dispo selon /api/parkings/availability
     *
     * @return array{start_at:string,end_at:string}|null
     */
    private function findAvailableActiveSlot(int $parkingId): ?array
    {
        $details = $this->request('GET', '/api/parkings/details', ['id' => $parkingId]);
        if ($details['status'] !== 200) return null;

        $parking = $details['json']['parking'] ?? null;
        if (!is_array($parking)) return null;

        $opening = (string)($parking['opening_time'] ?? '');
        $closing = (string)($parking['closing_time'] ?? '');
        if ($opening === '' || $closing === '') return null;

        $now = new \DateTimeImmutable('now');
        $today = new \DateTimeImmutable($now->format('Y-m-d'));

        [$oh, $om] = $this->parseHourMinute($opening);
        [$ch, $cm] = $this->parseHourMinute($closing);

        $openDT  = $today->setTime($oh, $om, 0);
        $closeDT = $today->setTime($ch, $cm, 0);

        // Balayage: on essaie plusieurs offsets pour éviter "parking full"
        // On garde des slots "actifs": start <= now <= end
        // Exemple: durée 30 min, avec start = now - (15+offset) min
        $durationMinutes = 30;

        for ($offset = 0; $offset <= 60; $offset += 5) {
            $start = $now->modify('-' . (15 + $offset) . ' minutes');
            $end   = $start->modify('+' . $durationMinutes . ' minutes');

            // clamp si plage standard (non overnight)
            if ($closeDT > $openDT) {
                if ($start < $openDT) $start = $openDT->modify('+1 minute');
                if ($end > $closeDT)  $end   = $closeDT->modify('-1 minute');
                if ($end <= $start) {
                    continue;
                }
            }

            $startAt = $start->format('Y-m-d H:i:s');
            $endAt   = $end->format('Y-m-d H:i:s');

            // Vérifie que NOW est bien dans le slot (active)
            if (!($start <= $now && $now <= $end)) {
                continue;
            }

            // Call availability
            $avail = $this->request('GET', '/api/parkings/availability', [
                'parking_id' => $parkingId,
                'start_at' => $startAt,
                'end_at' => $endAt,
            ]);

            if ($avail['status'] !== 200) {
                continue;
            }

            if ($this->availabilitySaysAvailable($avail['json'])) {
                return ['start_at' => $startAt, 'end_at' => $endAt];
            }
        }

        return null;
    }

    private function availabilitySaysAvailable(array $json): bool
    {
        // Supporte plusieurs formats possibles
        // - {success:true, available:true}
        // - {available:true}
        // - {success:true, remaining: >0}
        // - etc.
        if (isset($json['available'])) {
            return (bool)$json['available'];
        }
        if (isset($json['available_now'])) {
            return (bool)$json['available_now'];
        }
        if (isset($json['success']) && $json['success'] === true && isset($json['remaining'])) {
            return ((int)$json['remaining']) > 0;
        }
        if (isset($json['success']) && $json['success'] === true && isset($json['remaining_now'])) {
            return ((int)$json['remaining_now']) > 0;
        }
        // fallback: si success true et pas d'erreur
        if (($json['success'] ?? false) === true && empty($json['error'])) {
            return true;
        }
        return false;
    }

    private function pickOpenParkingIdNow(): int
    {
        $list = $this->request('GET', '/api/parkings');

        if ($list['status'] !== 200 || !is_array($list['json'])) {
            return 0;
        }

        $rows = $list['json']['data'] ?? $list['json']['parkings'] ?? $list['json'] ?? null;
        if (!is_array($rows)) {
            return 0;
        }

        $now = new \DateTimeImmutable('now');
        $nowMin = (int)$now->format('H') * 60 + (int)$now->format('i');

        foreach ($rows as $p) {
            if (!is_array($p)) continue;

            $id = (int)($p['id'] ?? 0);
            if ($id <= 0) continue;

            $opening = (string)($p['opening_time'] ?? '');
            $closing = (string)($p['closing_time'] ?? '');

            if ($opening === '' || $closing === '') {
                $details = $this->request('GET', '/api/parkings/details', ['id' => $id]);
                if ($details['status'] !== 200) continue;
                $park = $details['json']['parking'] ?? null;
                if (!is_array($park)) continue;
                $opening = (string)($park['opening_time'] ?? '');
                $closing = (string)($park['closing_time'] ?? '');
            }

            if ($opening === '' || $closing === '') continue;

            if ($this->isNowWithinOpening($opening, $closing, $nowMin)) {
                return $id;
            }
        }

        return 0;
    }

    private function isNowWithinOpening(string $opening, string $closing, int $nowMin): bool
    {
        [$oh, $om] = $this->parseHourMinute($opening);
        [$ch, $cm] = $this->parseHourMinute($closing);

        $openMin = $oh * 60 + $om;
        $closeMin = $ch * 60 + $cm;

        if ($closeMin > $openMin) {
            return $nowMin >= $openMin && $nowMin <= $closeMin;
        }
        return ($nowMin >= $openMin) || ($nowMin <= $closeMin);
    }

    private function parseHourMinute(string $hhmmss): array
    {
        $parts = explode(':', $hhmmss);
        $h = isset($parts[0]) ? (int)$parts[0] : 0;
        $m = isset($parts[1]) ? (int)$parts[1] : 0;
        return [$h, $m];
    }

    private function bootRouter(): Router
    {
        $bootstrap = __DIR__ . '/../../src/bootstrap.php';
        if (is_file($bootstrap)) {
            $router = require $bootstrap;
            if ($router instanceof Router) {
                return $router;
            }
        }

        throw new \RuntimeException('bootRouter() doit retourner le Router câblé (src/bootstrap.php retourne $router).');
    }

    /**
     * @param array<string,mixed> $query
     * @param array<string,mixed> $jsonBody
     * @return array{status:int, json:array<string,mixed>, raw:string}
     */
    private function request(string $method, string $path, array $query = [], array $jsonBody = []): array
    {
        if (function_exists('header_remove')) {
            header_remove();
        }
        http_response_code(200);

        $_SERVER['REQUEST_METHOD'] = $method;
        $_GET = $query;

        $uri = $path;
        if (!empty($query)) {
            $uri .= '?' . http_build_query($query);
        }
        $_SERVER['REQUEST_URI'] = $uri;

        $_SERVER['CONTENT_TYPE'] = 'application/json';
        $GLOBALS['__TEST_JSON_BODY__'] = json_encode($jsonBody, JSON_UNESCAPED_UNICODE);

        ob_start();
        $this->router->dispatch($method, $path);
        $raw = (string) ob_get_clean();

        $json = [];
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $json = $decoded;
        }

        return [
            'status' => http_response_code(),
            'json' => $json,
            'raw' => $raw,
        ];
    }
}
