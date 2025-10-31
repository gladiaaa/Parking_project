<?php
$api = "http://localhost:8001/api";
$ch = curl_init("$api/auth/logout");
$cookieHeader = '';
foreach ($_COOKIE as $k=>$v) { $cookieHeader .= "$k=$v; "; }
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ['Cookie: ' . $cookieHeader],
  CURLOPT_RETURNTRANSFER => true,
]);
curl_exec($ch); curl_close($ch);
header('Location: /login.php'); exit;
