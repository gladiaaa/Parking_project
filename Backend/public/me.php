<?php
$api = "http://localhost:8001/api";
$ch = curl_init("$api/me");
$cookieHeader = '';
foreach ($_COOKIE as $k=>$v) { $cookieHeader .= "$k=$v; "; }
curl_setopt_array($ch, [
  CURLOPT_HTTPHEADER => ['Cookie: ' . $cookieHeader],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HEADER => false,
]);
$body = curl_exec($ch);
curl_close($ch);
$data = json_decode($body, true);
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Mon profil</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'">
  <style>
    body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#fafafa;padding:40px}
    .card{max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,.08);padding:24px}
    h1{color:#ff5722;margin-top:0}
    pre{background:#f6f6f6;padding:12px;border-radius:8px}
    a{color:#ff5722;text-decoration:none}
    .row{display:flex;gap:10px}
  </style>
</head>
<body>
  <div class="card">
    <h1>Mon profil</h1>
    <?php if (isset($data['error'])): ?>
      <p><strong>Non connecté :</strong> <?= htmlspecialchars($data['error']) ?></p>
      <div class="row">
        <a href="/login.php">Se connecter</a>
      </div>
    <?php else: ?>
      <p><strong>ID :</strong> <?= (int)$data['id'] ?></p>
      <p><strong>Email :</strong> <?= htmlspecialchars($data['email']) ?></p>
      <p><strong>Rôle :</strong> <?= htmlspecialchars($data['role']) ?></p>
      <div class="row">
        <a href="/login.php">Re-login</a>
        <a href="/logout.php">Logout</a>
      </div>
      <h3>JSON</h3>
      <pre><?= htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)) ?></pre>
    <?php endif; ?>
  </div>
</body>
</html>
