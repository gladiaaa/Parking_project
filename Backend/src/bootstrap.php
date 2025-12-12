<?php
declare(strict_types=1);

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

  // Configuration par défaut (MySQL)
  $host = env('DB_HOST', '127.0.0.1');
  $port = (int)env('DB_PORT', 3306);
  $name = env('DB_NAME', 'parking_app');
  $user = env('DB_USER', 'root');
  $pass = env('DB_PASS', '');

  $dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
    $host, $port, $name
  );

  try {
      $pdo = new PDO(
        $dsn,
        $user,
        $pass,
        [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
      );
      $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;");
  } catch (PDOException $e) {
      // Fallback SQLite
      $dbPath = __DIR__ . '/../database/database.sqlite';
      if (file_exists($dbPath)) {
          return new PDO('sqlite:' . $dbPath, null, null, [
              PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, 
              PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
          ]);
      }
      throw $e;
  }
  
  return $pdo;
}
