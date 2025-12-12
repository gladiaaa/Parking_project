<?php
declare(strict_types=1);

namespace App\Infrastructure\Database;

use PDO;
use PDOException;

class DatabaseConnection {
    private static ?PDO $pdo = null;

    public static function getPDO(): PDO {
        if (self::$pdo) {
            return self::$pdo;
        }

        // Configuration par défaut (MySQL)
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = (int)(getenv('DB_PORT') ?: 3306);
        $name = getenv('DB_NAME') ?: 'parking_app';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $host, $port, $name
        );

        try {
            self::$pdo = new PDO(
                $dsn,
                $user,
                $pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
            self::$pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;");
        } catch (PDOException $e) {
            // Fallback SQLite
            $dbPath = __DIR__ . '/../../../../Backend/database/database.sqlite';
            if (file_exists($dbPath)) {
                return new PDO('sqlite:' . $dbPath, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, 
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
            }
            throw $e;
        }
        
        return self::$pdo;
    }
}
