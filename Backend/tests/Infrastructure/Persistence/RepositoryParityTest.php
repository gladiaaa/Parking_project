<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Persistence;

use PDO;
use PHPUnit\Framework\TestCase;
use App\Infrastructure\Persistence\SqlReservationRepository;
use App\Infrastructure\Persistence\SqlStationnementRepository;
use App\Infrastructure\Persistence\Json\JsonReservationRepository;
use App\Infrastructure\Persistence\Json\JsonStationnementRepository;
use App\Domain\Entity\Reservation;
use App\Domain\Entity\Stationnement;

final class RepositoryParityTest extends TestCase
{
    private const DELTA = 0.0001;

    private string $tmpDir;
    private string $reservationsJson;
    private string $stationnementsJson;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tmpDir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'parking_repo_parity';
        if (!is_dir($this->tmpDir)) {
            @mkdir($this->tmpDir, 0777, true);
        }

        $this->reservationsJson = $this->tmpDir . DIRECTORY_SEPARATOR . 'reservations_parity.json';
        $this->stationnementsJson = $this->tmpDir . DIRECTORY_SEPARATOR . 'stationnements_parity.json';

        @unlink($this->reservationsJson);
        @unlink($this->stationnementsJson);

        file_put_contents($this->reservationsJson, "[]");
        file_put_contents($this->stationnementsJson, "[]");
    }

    private function sqlPdoOrSkip(): PDO
    {
        $dsn  = $_ENV['TEST_DB_DSN']  ?? null;
        $user = $_ENV['TEST_DB_USER'] ?? null;
        $pass = $_ENV['TEST_DB_PASS'] ?? '';

        if (!$dsn || !$user) {
            $this->markTestSkipped('TEST_DB_DSN/TEST_DB_USER not set (SQL parity tests skipped).');
        }

        $pdo = new PDO((string)$dsn, (string)$user, (string)$pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // Juste pour être sûr que tu ne pointes pas sur une DB “réelle”
        $dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
        if (is_string($dbName) && $dbName === 'parking_app') {
            $this->markTestSkipped('Refusing to run SQL parity tests on parking_app. Use parking_app_test.');
        }

        return $pdo;
    }

    private function resetSqlTables(PDO $pdo): void
    {
        // Ordre important à cause des FK
        $pdo->exec('DELETE FROM stationnements');
        $pdo->exec('DELETE FROM reservations');
    }

    /**
     * Seed identique côté SQL et JSON.
     *
     * ParkingId=3
     * - reservation 1: overlap slot (pas entrée)
     * - reservation 2: overlap slot + stationnement actif (donc NOT ENTERED doit l’exclure)
     * - reservation 3: pas overlap slot
     *
     * Stationnements:
     * - s1: actif (exited_at null) sur reservation 2
     * - s2: terminé (exited_at dans la fenêtre) sur reservation 1 => revenue inclus
     * - s3: terminé (exited_at hors fenêtre) sur reservation 3 => revenue exclu
     */
    private function seedBoth(PDO $pdo): array
    {
        $parkingId = 3;
        $userId = 10;

        // Fenêtre test slot
        $slotStart = '2025-12-17 10:00:00';
        $slotEnd   = '2025-12-17 12:00:00';

        // Fenêtre revenue (borne haute exclusive)
        $revFrom = '2025-12-01 00:00:00';
        $revTo   = '2026-01-01 00:00:00';

        // Reservations (en DB, id auto; en JSON, id auto aussi, donc on crée en ordre et on récupère ensuite)
        $r1 = Reservation::create(
            $userId,
            $parkingId,
            new \DateTimeImmutable('2025-12-17 09:30:00'),
            new \DateTimeImmutable('2025-12-17 12:30:00'),
            'car',
            12.50
        );

        $r2 = Reservation::create(
            $userId,
            $parkingId,
            new \DateTimeImmutable('2025-12-17 10:30:00'),
            new \DateTimeImmutable('2025-12-17 11:30:00'),
            'car',
            12.50
        );

        $r3 = Reservation::create(
            $userId,
            $parkingId,
            new \DateTimeImmutable('2025-12-17 14:00:00'),
            new \DateTimeImmutable('2025-12-17 15:00:00'),
            'car',
            12.50
        );

        // JSON repos
        $jsonResRepo = new JsonReservationRepository($this->reservationsJson, $this->stationnementsJson);
        $jsonStRepo  = new JsonStationnementRepository($this->stationnementsJson, $jsonResRepo);

        $jr1 = $jsonResRepo->save($r1);
        $jr2 = $jsonResRepo->save($r2);
        $jr3 = $jsonResRepo->save($r3);

        // SQL repos
        $sqlResRepo = new SqlReservationRepository($pdo);
        $sqlStRepo  = new SqlStationnementRepository($pdo);

        $sr1 = $sqlResRepo->save($r1);
        $sr2 = $sqlResRepo->save($r2);
        $sr3 = $sqlResRepo->save($r3);

        // Stationnements JSON
        // s1 actif pour r2
        $js1 = $jsonStRepo->save(Stationnement::enter((int)$jr2->id(), new \DateTimeImmutable('2025-12-17 10:40:00')));

        // s2 terminé pour r1, dans fenêtre revenue
        $js2 = $jsonStRepo->save(Stationnement::enter((int)$jr1->id(), new \DateTimeImmutable('2025-12-17 09:40:00')));
        $jsonStRepo->close((int)$js2->id(), new \DateTimeImmutable('2025-12-17 11:00:00'), 10.00, 2.50);

        // s3 terminé pour r3, hors fenêtre revenue (novembre)
        $js3 = $jsonStRepo->save(Stationnement::enter((int)$jr3->id(), new \DateTimeImmutable('2025-11-17 14:00:00')));
        $jsonStRepo->close((int)$js3->id(), new \DateTimeImmutable('2025-11-17 15:00:00'), 7.00, 1.00);

        // Stationnements SQL
        $ss1 = $sqlStRepo->save(Stationnement::enter((int)$sr2->id(), new \DateTimeImmutable('2025-12-17 10:40:00')));

        $ss2 = $sqlStRepo->save(Stationnement::enter((int)$sr1->id(), new \DateTimeImmutable('2025-12-17 09:40:00')));
        $sqlStRepo->close((int)$ss2->id(), new \DateTimeImmutable('2025-12-17 11:00:00'), 10.00, 2.50);

        $ss3 = $sqlStRepo->save(Stationnement::enter((int)$sr3->id(), new \DateTimeImmutable('2025-11-17 14:00:00')));
        $sqlStRepo->close((int)$ss3->id(), new \DateTimeImmutable('2025-11-17 15:00:00'), 7.00, 1.00);

        return [
            'parking_id' => $parkingId,
            'slot_start' => $slotStart,
            'slot_end' => $slotEnd,
            'rev_from' => $revFrom,
            'rev_to' => $revTo,
            'json_res' => $jsonResRepo,
            'json_st' => $jsonStRepo,
            'sql_res' => $sqlResRepo,
            'sql_st' => $sqlStRepo,
        ];
    }

    public function test_countOverlappingNotEntered_is_identical_in_json_and_sql(): void
    {
        $pdo = $this->sqlPdoOrSkip();
        $pdo->beginTransaction();
        try {
            $this->resetSqlTables($pdo);
            $ctx = $this->seedBoth($pdo);

            $parkingId = $ctx['parking_id'];
            $startAt = $ctx['slot_start'];
            $endAt = $ctx['slot_end'];

            $json = $ctx['json_res']->countOverlappingNotEntered($parkingId, $startAt, $endAt);
            $sql  = $ctx['sql_res']->countOverlappingNotEntered($parkingId, $startAt, $endAt);

            $this->assertSame($sql, $json);
        } finally {
            $pdo->rollBack();
        }
    }

    public function test_countActiveByParkingId_is_identical_in_json_and_sql(): void
    {
        $pdo = $this->sqlPdoOrSkip();
        $pdo->beginTransaction();
        try {
            $this->resetSqlTables($pdo);
            $ctx = $this->seedBoth($pdo);

            $parkingId = $ctx['parking_id'];

            $json = $ctx['json_st']->countActiveByParkingId($parkingId);
            $sql  = $ctx['sql_st']->countActiveByParkingId($parkingId);

            $this->assertSame($sql, $json);
        } finally {
            $pdo->rollBack();
        }
    }

    public function test_revenueForParking_is_identical_in_json_and_sql(): void
    {
        $pdo = $this->sqlPdoOrSkip();
        $pdo->beginTransaction();
        try {
            $this->resetSqlTables($pdo);
            $ctx = $this->seedBoth($pdo);

            $parkingId = $ctx['parking_id'];
            $from = $ctx['rev_from'];
            $to   = $ctx['rev_to'];

            $json = $ctx['json_st']->revenueForParking($from, $to, $parkingId);
            $sql  = $ctx['sql_st']->revenueForParking($from, $to, $parkingId);

            // Ints strict
            $this->assertSame((int)$sql['count_exits'], (int)$json['count_exits']);

            // Floats tolérance
            $this->assertEqualsWithDelta((float)$sql['total_billed'], (float)$json['total_billed'], self::DELTA);
            $this->assertEqualsWithDelta((float)$sql['total_penalty'], (float)$json['total_penalty'], self::DELTA);
            $this->assertEqualsWithDelta((float)$sql['total'], (float)$json['total'], self::DELTA);

            // Bonus: invariants (si ça casse, tu sauras vite où)
            $this->assertEqualsWithDelta(
                (float)$json['total_billed'] + (float)$json['total_penalty'],
                (float)$json['total'],
                self::DELTA
            );
        } finally {
            $pdo->rollBack();
        }
    }
}
