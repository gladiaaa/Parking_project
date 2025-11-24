<?php
// Formulaire d'inscription -> POST vers /api/auth/register via cURL
$api = "http://localhost:8001/api";
$response = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($email && $password) {
        $payload = json_encode(
            ['email' => $email, 'password' => $password],
            JSON_UNESCAPED_UNICODE
        );

        $ch = curl_init("$api/auth/register");
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
        ]);
        $bodyStr = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($bodyStr, true);

        if (!is_array($data)) {
            $error = "Réponse invalide du serveur.";
        } else {
            if ($status === 201 && ($data['status'] ?? null) === 'ok') {
                // Inscription OK → on renvoie sur la page de login
                header('Location: /login.php');
                exit;
            }

            // Sinon on affiche l'erreur renvoyée par l'API
            $error = $data['error'] ?? 'Inscription impossible.';
            $response = $data;
        }
    } else {
        $error = "Veuillez entrer email et mot de passe.";
    }
}
?>
<!doctype html>
<html lang="fr">

<head>
    <meta charset="utf-8" />
    <title>Inscription Parking App</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'">
    <style>
        body {
            font-family: system-ui, Segoe UI, Roboto, Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh
        }

        form {
            background: #fff;
            padding: 24px 32px;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, .1);
            width: 320px
        }

        h1 {
            text-align: center;
            color: #ff5722;
            margin-bottom: 20px;
            font-weight: 800
        }

        label {
            font-size: 12px;
            color: #555
        }

        input {
            width: 100%;
            margin: .25rem 0 10px;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            font-size: 14px
        }

        button {
            width: 100%;
            padding: 10px;
            background: #ff5722;
            border: none;
            color: #fff;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer
        }

        button:hover {
            background: #e04d1d
        }

        .msg {
            margin-top: 16px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 6px;
            font-size: 14px;
            white-space: pre-wrap
        }

        .err {
            background: #ffeaea;
            color: #a00
        }

        .link {
            margin-top: 12px;
            font-size: 13px;
            text-align: center;
        }

        .link a {
            color: #ff5722;
            text-decoration: none;
        }

        .link a:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>
    <form method="post" action="/register.php" autocomplete="on">
        <h1>Inscription</h1>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" placeholder="adresse@email.com" autocomplete="email" required>

        <label for="pwd">Mot de passe</label>
        <input id="pwd" name="password" type="password" placeholder="••••••••" autocomplete="new-password" required>

        <button type="submit">Créer mon compte</button>

        <div class="link">
            Déjà un compte ?
            <a href="/login.php">Se connecter</a>
        </div>

        <?php if ($response): ?>
            <div class="msg">
                <?= htmlspecialchars(json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) ?>
            </div>
        <?php elseif ($error): ?>
            <div class="msg err">
                <strong>Erreur :</strong> <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>
    </form>
</body>

</html>