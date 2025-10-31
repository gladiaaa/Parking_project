<?php
declare(strict_types=1);

use PDO;

function env(string $key, $default=null) {
  static $cfg;
  if (!$cfg) {
    $cfg = @parse_ini_file(__DIR__ . '/../../.env', false, INI_SCANNER_TYPED) ?: [];
  }
  return $cfg[$key] ?? $default;
}

function pdo(): PDO {
  static $pdo;
  if ($pdo) return $pdo;

  $dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
    env('DB_HOST','127.0.0.1'),
    (int)env('DB_PORT',3306),
    env('DB_NAME','parking_app')
  );

  $pdo = new PDO(
    $dsn,
    env('DB_USER','root'),
    env('DB_PASS',''),
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
  );
  $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;");
  $pdo->exec("SET time_zone = '+00:00';");
  return $pdo;
}
