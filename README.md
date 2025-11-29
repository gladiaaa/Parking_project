# Parking_project – Auth JWT + 2FA (PHP)

Backend PHP minimaliste avec JWT (cookies HttpOnly), refresh token, rôles, et double authentification (code à 6 chiffres).  
Fonctionne en local avec XAMPP/MySQL et le serveur PHP intégré.

---

## 1) Prérequis

- PHP >= 8.2 (Argon2id activé)
- Composer
- MySQL (XAMPP ok)
- Windows PowerShell (ou terminal au choix)

---

## 2) Cloner & installer

```
git clone https://github.com/gladiaaa/Parking_project.git
cd Parking_project/Backend
composer install
```

## BDD :

CREATE DATABASE IF NOT EXISTS `parking_app`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE `parking_app`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('USER','OWNER','ADMIN','SUPEROWNER') NOT NULL DEFAULT 'USER',
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_method` ENUM('email','totp') NOT NULL DEFAULT 'email',
  `two_factor_last_code` VARCHAR(10) DEFAULT NULL,
  `two_factor_expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- utilisateur de test (mot de passe: test)
INSERT INTO users (email, password_hash, role, two_factor_enabled) VALUES
('test@test.com', '$argon2id$v=19$m=65536,t=4,p=1$Y2hhdGdwdDQ1MWY1MDMxZw$SKdPO8vb4ks2+uV8cxQXf2WcT1QPhVbGi3SOBtyd9lc', 'USER', 0)
ON DUPLICATE KEY UPDATE email=email;


---

## 5) Lancer en local (2 ports)

Le serveur PHP intégré ne peut pas auto-appeler la même instance pendant une requête.
On sépare API et pages de test :

Terminal A (API)

cd Parking_project/Backend
php -S localhost:8001 -t public


Terminal B (pages PHP de test)

cd Parking_project/Backend
php -S localhost:8000 -t public


Les pages login.php, verify_2fa.php, me.php, logout.php utilisent l’API sur http://localhost:8001/api.
(Variable $api déclarée en haut de chaque fichier)

## 6) Tester rapidement
Endpoints

Santé : http://localhost:8001/health

Ping DB : http://localhost:8001/db/ping

Pages de test

Login : http://localhost:8000/login.php

2FA : http://localhost:8000/verify_2fa.php

Profil : http://localhost:8000/me.php

Flux

Connecte-toi avec test@test.com / test → redirection /me.php.

Activer la 2FA si besoin :

UPDATE users SET two_factor_enabled = 1 WHERE email='test@test.com';


Re-login → redirection vers /verify_2fa.php → saisis le code affiché dans les logs → /me.php.

## 7) Scripts utiles

Changer un mot de passe (outil CLI) :

php Backend/tools/set_user_password.php <email> <plain>


(si le fichier n’existe pas, crée-le d’après l’exemple fourni dans la discussion)

Lancer les tests (si tu utilises PHPUnit) :
```
cd Backend
composer require --dev phpunit/phpunit:^11
./vendor/bin/phpunit
```
# ProjecT_Parc
Gestionnaire de places de parking


## Création de la bdd :

mysql -u root -h 127.0.0.1 -P 3306 < sql/001_init_core.sql

