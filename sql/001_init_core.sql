-- ------------------------------------------------------------
-- Base & options
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `parking_app`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `parking_app`;

-- (Facultatif mais utile en dev)
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET sql_mode = 'STRICT_ALL_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ------------------------------------------------------------
-- Table: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`               VARCHAR(190)    NOT NULL,
  `password_hash`       VARCHAR(255)    NOT NULL,
  `role`                ENUM('USER','OWNER','ADMIN') NOT NULL DEFAULT 'USER',

  -- 2FA
  `two_factor_enabled`  TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_method`   ENUM('email','totp') NOT NULL DEFAULT 'email',
  `two_factor_last_code`    VARCHAR(10)  DEFAULT NULL,
  `two_factor_expires_at`   DATETIME     DEFAULT NULL,

  -- Métadonnées
  `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_email` (`email`),
  KEY `idx_user_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Seed de base (mots de passe à définir ensuite via UPDATE)
-- ------------------------------------------------------------
INSERT INTO `users` (`email`, `password_hash`, `role`, `two_factor_enabled`)
VALUES
  ('demo@example.com', '__SET_AFTER__', 'USER', 0),
  ('test@parking.com', '__SET_AFTER__', 'ADMIN', 1)  -- ADMIN avec 2FA activée
ON DUPLICATE KEY UPDATE email = VALUES(`email`);
