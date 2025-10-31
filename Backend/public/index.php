<?php
declare(strict_types=1);
require __DIR__ . '/../src/bootstrap.php';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/health') {
  echo json_encode(['ok'=>true, 'php'=>PHP_VERSION]);
  exit;
}

if ($path === '/users') {
  $pdo = pdo();
  $stmt = $pdo->query('SELECT * FROM users');
  echo json_encode($stmt->fetchAll());
  exit;
}

if ($path === '/db/ping') {
  try {
    $ver = pdo()->query('SELECT VERSION() AS v')->fetch()['v'] ?? 'unknown';
    echo json_encode(['ok'=>true,'mysql_version'=>$ver]);
  } catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
  }
  exit;
}

http_response_code(404);
echo json_encode(['error'=>'Not found']);
