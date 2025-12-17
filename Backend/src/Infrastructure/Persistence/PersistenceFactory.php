<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use PDO;
use App\Domain\Repository\ReservationRepository;
use App\Domain\Repository\StationnementRepository;
use App\Infrastructure\Persistence\SqlReservationRepository;
use App\Infrastructure\Persistence\SqlStationnementRepository;
use App\Infrastructure\Persistence\Json\JsonReservationRepository;
use App\Infrastructure\Persistence\Json\JsonStationnementRepository;

final class PersistenceFactory
{
    private static function driver(): string
    {
        return strtolower((string)($_ENV['PERSISTENCE_DRIVER'] ?? 'sql'));
    }

    private static function storagePath(string $filename): string
    {
        // STORAGE_DIR défini dans bootstrap.php
        return STORAGE_DIR . DIRECTORY_SEPARATOR . $filename;
    }

    public static function reservationRepository(PDO $pdo): ReservationRepository
    {
        return match (self::driver()) {
            'json' => new JsonReservationRepository(
                self::storagePath('reservations.json'),
                self::storagePath('stationnements.json')
            ),
            default => new SqlReservationRepository($pdo),
        };
    }

    public static function stationnementRepository(PDO $pdo, ReservationRepository $reservationRepo): StationnementRepository
    {
        return match (self::driver()) {
            'json' => new JsonStationnementRepository(
                self::storagePath('stationnements.json'),
                $reservationRepo
            ),
            default => new SqlStationnementRepository($pdo),
        };
    }
}
