<?php
declare(strict_types=1);

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require __DIR__ . '/../vendor/autoload.php';

/** ================== CONFIG ================== */
const DB_DSN   = 'mysql:host=127.0.0.1;dbname=parking_app;charset=utf8mb4';
const DB_USER  = 'root';
const DB_PASS  = '';
const APP_ORIGIN = 'http://localhost:3890'; // Ajuste: UI React / HTML
const JWT_SECRET = 'change_me_to_a_strong_key';
const ACCESS_TTL = 900;       // 15 min
const REFRESH_TTL = 2592000;  // 30 jours

/** ================== PDO ================== */
function pdo(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

/** ================== CORS/HEADERS ================== */
function cors(): void {
  header('Access-Control-Allow-Origin: '.APP_ORIGIN);
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
  header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
  header('Content-Type: application/json; charset=utf-8');
}

/** ================== RESPONSES ================== */
function json($data, int $status=200): void {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

/** ================== BODY ================== */
function body(): array {
  $raw = file_get_contents('php://input');
  return is_string($raw) && $raw !== '' ? (json_decode($raw, true) ?? []) : [];
}

/** ================== PASSWORD ================== */
function hash_password(string $plain): string {
  return password_hash($plain, PASSWORD_ARGON2ID);
}
function verify_password(string $plain, string $hash): bool {
  return password_verify($plain, $hash);
}

/** ================== JWT CORE ================== */
function jwt_encode(array $payload): string {
  return JWT::encode($payload, JWT_SECRET, 'HS256');
}
function jwt_decode_safe(string $token): ?array {
  try { return (array) JWT::decode($token, new Key(JWT_SECRET,'HS256')); }
  catch (Throwable) { return null; }
}

/** ================== AUTH COOKIES ================== */
function cookie_set(string $name, string $value, int $ttl): void {
  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on');
  setcookie($name, $value, [
    'expires' => time()+$ttl,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => $secure ? 'None' : 'Lax',
  ]);
}
function set_access_cookie(string $jwt): void { cookie_set('ACCESS_TOKEN', $jwt, ACCESS_TTL); }
function set_refresh_cookie(string $jwt): void { cookie_set('REFRESH_TOKEN', $jwt, REFRESH_TTL); }
function clear_auth_cookies(): void {
  cookie_set('ACCESS_TOKEN','', -3600);
  cookie_set('REFRESH_TOKEN','', -3600);
  cookie_set('P2_AUTH','', -3600);
}

/** ================== FLOWS ================== */
function issue_tokens_for(int $userId, string $role): array {
  $now = time();
  $access = ['iat'=>$now,'nbf'=>$now,'exp'=>$now+ACCESS_TTL,'sub'=>$userId,'role'=>$role,'typ'=>'access'];
  $refresh= ['iat'=>$now,'nbf'=>$now,'exp'=>$now+REFRESH_TTL,'sub'=>$userId,'typ'=>'refresh'];
  return [jwt_encode($access), jwt_encode($refresh)];
}
function read_access(): ?array {
  $t = $_COOKIE['ACCESS_TOKEN'] ?? '';
  return $t ? jwt_decode_safe($t) : null;
}
function read_refresh(): ?array {
  $t = $_COOKIE['REFRESH_TOKEN'] ?? '';
  return $t ? jwt_decode_safe($t) : null;
}

/** ============== 2FA (phase 2) =================== */
function issue_p2_token(int $userId): string {
  $now = time();
  return jwt_encode(['iat'=>$now,'nbf'=>$now,'exp'=>$now+300,'sub'=>$userId,'typ'=>'p2']);
}
function set_p2_cookie(string $jwt): void { cookie_set('P2_AUTH', $jwt, 300); }
function read_p2(): ?array {
  $t = $_COOKIE['P2_AUTH'] ?? '';
  return $t ? jwt_decode_safe($t) : null;
}

/** ============== HELPERS METIER =================== */
function find_user_by_email(string $email): ?array {
  $st = pdo()->prepare('SELECT * FROM users WHERE email=?');
  $st->execute([$email]);
  return $st->fetch() ?: null;
}
function find_user_by_id(int $id): ?array {
  $st = pdo()->prepare('SELECT * FROM users WHERE id=?');
  $st->execute([$id]);
  return $st->fetch() ?: null;
}
function save_2fa_code(int $userId, string $code, DateTimeImmutable $exp): void {
  $st = pdo()->prepare('UPDATE users SET two_factor_last_code=?, two_factor_expires_at=? WHERE id=?');
  $st->execute([$code, $exp->format('Y-m-d H:i:s'), $userId]);
}
