<?php
// me.php : affiche le profil à partir de /api/me

$api = "http://localhost:8001/api";
$response = null;
$error = null;

// ----- Appel API /api/me avec les cookies JWT du navigateur -----
$access  = $_COOKIE['ACCESS_TOKEN'] ?? '';
$refresh = $_COOKIE['REFRESH_TOKEN'] ?? '';

if ($access === '') {
    $error = "Non connecté (pas de cookie ACCESS_TOKEN).";
} else {
    $ch = curl_init("$api/me");

    $headers = [];

    // On propage les cookies vers l'API
    $cookieParts = ["ACCESS_TOKEN=" . urlencode($access)];
    if ($refresh !== '') {
        $cookieParts[] = "REFRESH_TOKEN=" . urlencode($refresh);
    }
    $headers[] = 'Cookie: ' . implode('; ', $cookieParts);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headers,
    ]);

    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($body, true);

    if ($status === 200 && is_array($data) && !isset($data['error'])) {
        $response = $data;
    } else {
        // erreur renvoyée par l'API (401 Unauthorized, etc.)
        $error = $data['error'] ?? ("Erreur HTTP $status");
    }
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Mon profil</title>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; style-src 'self' 'unsafe-inline'">
  <style>
    body{
      font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;
      background:#f5f5f5;
      display:flex;
      align-items:center;
      justify-content:center;
      height:100vh;
      margin:0;
    }
    .card{
      background:#fff;
      padding:32px 40px;
      border-radius:16px;
      box-shadow:0 12px 30px rgba(0,0,0,.12);
      min-width:420px;
    }
    h1{
      margin-top:0;
      color:#ff5722;
      font-size:28px;
    }
    .label{font-weight:600;color:#444;margin-top:8px;}
    .value{margin-left:4px;}
    a.btn{
      display:inline-block;
      margin-top:16px;
      color:#ff5722;
      text-decoration:none;
      font-weight:600;
    }
    a.btn:hover{text-decoration:underline;}
    pre{
      margin-top:20px;
      padding:10px;
      background:#f0f0f0;
      border-radius:8px;
      font-size:12px;
      max-height:200px;
      overflow:auto;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Mon profil</h1>

    <?php if ($response): ?>
      <div>
        <div><span class="label">ID :</span>
          <span class="value"><?= htmlspecialchars((string)$response['id']) ?></span>
        </div>
        <div><span class="label">Email :</span>
          <span class="value"><?= htmlspecialchars((string)$response['email']) ?></span>
        </div>
        <div><span class="label">Rôle :</span>
          <span class="value"><?= htmlspecialchars((string)$response['role']) ?></span>
        </div>

        <a class="btn" href="/logout.php">Logout</a>
      </div>
    <?php else: ?>
      <p><strong>Non connecté :</strong> <?= htmlspecialchars($error ?? 'Inconnu') ?></p>
      <a class="btn" href="/login.php">Se connecter</a>
    <?php endif; ?>

    <pre>JSON
<?= htmlspecialchars(json_encode($response, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)); ?></pre>
  </div>
</body>
</html>
