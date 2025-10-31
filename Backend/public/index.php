<?php
declare(strict_types=1);
require __DIR__ . '/../src/bootstrap.php';

cors(); // CORS + JSON header

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

/** ================== ROUTES PUBLIQUES ================== */
if ($path === '/health' && $method === 'GET') {
  json(['ok'=>true, 'php'=>PHP_VERSION]); exit;
}

if ($path === '/db/ping' && $method === 'GET') {
  try {
    $ver = pdo()->query('SELECT VERSION() AS v')->fetch()['v'] ?? 'unknown';
    json(['ok'=>true,'mysql_version'=>$ver]); exit;
  } catch (Throwable $e) {
    json(['ok'=>false,'error'=>$e->getMessage()], 500); exit;
  }
}

/** ======== AUTH: LOGIN =========
 * Body: { "email": "...", "password": "..." }
 * Réponse:
 *  - {status:"2fa_required"} + cookie P2_AUTH
 *  - {ok:true} + cookies ACCESS/REFRESH
 */
if ($path === '/api/auth/login' && $method === 'POST') {
  $b = body();
  $email = (string)($b['email'] ?? '');
  $password = (string)($b['password'] ?? '');

  $u = find_user_by_email($email);
  if (!$u || !verify_password($password, $u['password_hash'])) {
    json(['error'=>'Invalid credentials'], 401); exit;
  }

  // si 2FA activée -> phase 2
  if ((int)$u['two_factor_enabled'] === 1) {
    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $exp  = new DateTimeImmutable('+5 minutes');
    save_2fa_code((int)$u['id'], $code, $exp);

    // DEV: log du code. En prod: envoi mail/SMS.
    error_log('[2FA] code for '.$u['email'].': '.$code.' (valid until '.$exp->format('H:i:s').')');

    set_p2_cookie(issue_p2_token((int)$u['id']));
    json(['status'=>'2fa_required']); exit;
  }

  // sinon → tokens directs
  [$access,$refresh] = issue_tokens_for((int)$u['id'], $u['role'] ?? 'USER');
  set_access_cookie($access);
  set_refresh_cookie($refresh);
  json(['ok'=>true]); exit;
}

/** ======== AUTH: 2FA VERIFY =========
 * Body: { "code": "123456" }
 * Lit cookie P2_AUTH et émet ACCESS/REFRESH si OK.
 */
if ($path === '/api/auth/2fa/verify' && $method === 'POST') {
  $b = body();
  $code = trim((string)($b['code'] ?? ''));
  $p2 = read_p2();
  if (!$p2 || ($p2['typ'] ?? '') !== 'p2') { json(['error'=>'Missing 2FA session'], 401); exit; }

  $u = find_user_by_id((int)$p2['sub']);
  if (!$u || (int)$u['two_factor_enabled'] !== 1) { json(['error'=>'Invalid 2FA context'], 401); exit; }

  if (empty($u['two_factor_last_code']) || empty($u['two_factor_expires_at'])) {
    json(['error'=>'2FA not initialized'], 401); exit;
  }
  if (new DateTimeImmutable($u['two_factor_expires_at']) < new DateTimeImmutable()) {
    json(['error'=>'2FA expired'], 401); exit;
  }
  if ($code !== $u['two_factor_last_code']) {
    json(['error'=>'Invalid 2FA code'], 401); exit;
  }

  // OK: émettre tokens finaux et purger P2
  [$access,$refresh] = issue_tokens_for((int)$u['id'], $u['role'] ?? 'USER');
  set_access_cookie($access);
  set_refresh_cookie($refresh);
  setcookie('P2_AUTH','', time()-3600, '/');
  json(['ok'=>true]); exit;
}

/** ======== AUTH: REFRESH ========= */
if ($path === '/api/auth/refresh' && $method === 'POST') {
  $r = read_refresh();
  if (!$r || ($r['typ'] ?? '') !== 'refresh') { json(['error'=>'Invalid refresh'], 401); exit; }

  $u = find_user_by_id((int)$r['sub']);
  if (!$u) { json(['error'=>'User not found'], 401); exit; }

  [$access,] = issue_tokens_for((int)$u['id'], $u['role'] ?? 'USER');
  set_access_cookie($access);
  json(['ok'=>true]); exit;
}

/** ======== AUTH: LOGOUT ========= */
if ($path === '/api/auth/logout' && $method === 'POST') {
  clear_auth_cookies();
  json(['ok'=>true]); exit;
}

/** ======== ME (protégé) ========= */
if ($path === '/api/me' && $method === 'GET') {
  $p = read_access();
  if (!$p || ($p['typ'] ?? '') !== 'access') { json(['error'=>'Unauthorized'], 401); exit; }
  $u = find_user_by_id((int)$p['sub']);
  if (!$u) { json(['error'=>'Unauthorized'], 401); exit; }
  json(['id'=>(int)$u['id'], 'email'=>$u['email'], 'role'=>$u['role'] ?? 'USER']); exit;
}

/** ======== TES ROUTES EXISTANTES =========
 * /users → je te le passe en protégé ADMIN (exemple)
 */
if ($path === '/users' && $method === 'GET') {
  $p = read_access();
  if (!$p || ($p['typ'] ?? '') !== 'access') { json(['error'=>'Unauthorized'], 401); exit; }
  $role = $p['role'] ?? 'USER';
  $rank = ['USER'=>1,'OWNER'=>2,'ADMIN'=>3];
  if (($rank[$role] ?? 0) < ($rank['ADMIN'])) { json(['error'=>'Forbidden'], 403); exit; }

  $stmt = pdo()->query('SELECT id, email, role, created_at FROM users');
  json($stmt->fetchAll()); exit;
}

/** Fallback 404 */
http_response_code(404);
json(['error'=>'Not found']);
