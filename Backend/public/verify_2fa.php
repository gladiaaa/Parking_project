<?php
$api = "http://localhost:8001/api";
$response = null; $error = null;

function forward_set_cookies(array $setCookies): void {
  foreach ($setCookies as $sc) { header($sc, false); }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $code = trim($_POST['code'] ?? '');
  if ($code !== '') {
    $payload = json_encode(['code'=>$code], JSON_UNESCAPED_UNICODE);
    $ch = curl_init("$api/auth/2fa/verify");
    // on renvoie les cookies du navigateur à l’API (P2_AUTH)
    $cookieHeader = '';
    foreach ($_COOKIE as $k=>$v) { $cookieHeader .= "$k=$v; "; }
    curl_setopt_array($ch, [
      CURLOPT_POST => true,
      CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Cookie: ' . $cookieHeader
      ],
      CURLOPT_POSTFIELDS => $payload,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_HEADER => true,
    ]);
    $raw = curl_exec($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headersStr = substr($raw, 0, $headerSize);
    $bodyStr = substr($raw, $headerSize);
    curl_close($ch);

    $setCookies = [];
    foreach (explode("\r\n", $headersStr) as $h) {
      if (stripos($h, 'Set-Cookie:') === 0) $setCookies[] = $h;
    }

    $data = json_decode($bodyStr, true);
    if (!is_array($data)) $error = "Réponse invalide du serveur.";
    else {
      if (isset($data['ok']) && $data['ok'] === true) {
        forward_set_cookies($setCookies); // ACCESS/REFRESH
        header('Location: /me.php'); exit;
      }
      $response = $data;
    }
  } else {
    $error = "Entrez le code à 6 chiffres.";
  }
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Vérification 2FA</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'">
  <style>
    body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh}
    form{background:#fff;padding:24px 32px;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.1);width:320px}
    h1{text-align:center;color:#ff5722;margin-bottom:20px;font-weight:800}
    input{width:100%;margin:0 0 10px;padding:10px;border-radius:6px;border:1px solid #ccc;font-size:18px;text-align:center;letter-spacing:4px}
    button{width:100%;padding:10px;background:#ff5722;border:none;color:#fff;font-weight:700;border-radius:6px;cursor:pointer}
    button:hover{background:#e04d1d}
    .msg{margin-top:16px;padding:10px;background:#f0f0f0;border-radius:6px;font-size:14px;white-space:pre-wrap}
    .err{background:#ffeaea;color:#a00}
  </style>
</head>
<body>
  <form method="post" action="/verify_2fa.php" autocomplete="one-time-code">
    <h1>Code 2FA</h1>
    <input name="code" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" placeholder="123456" required autocomplete="one-time-code">
    <button type="submit">Vérifier</button>

    <?php if ($response): ?>
      <div class="msg"><?= htmlspecialchars(json_encode($response, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)) ?></div>
    <?php elseif ($error): ?>
      <div class="msg err"><strong>Erreur :</strong> <?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
  </form>
</body>
</html>
