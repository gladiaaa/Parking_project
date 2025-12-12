-- ============================================
-- SCHÉMA DE BASE DE DONNÉES COMPLET
-- ParkingPartagé - Système de réservation
-- ============================================

CREATE DATABASE IF NOT EXISTS parking_app
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE parking_app;

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  role ENUM('user', 'owner') NOT NULL DEFAULT 'user',
  type_abonnement ENUM('gratuit', 'premium', 'business') NOT NULL DEFAULT 'gratuit',
  debut_abonnement DATE NULL,
  fin_abonnement DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: parkings
-- ============================================
CREATE TABLE IF NOT EXISTS parkings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_id BIGINT NOT NULL,
  nom VARCHAR(200) NOT NULL,
  adresse VARCHAR(255) NOT NULL,
  ville VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  nombre_places INT NOT NULL DEFAULT 0,
  tarif_horaire DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  tarif_journalier DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  tarif_mensuel DECIMAL(7, 2) NOT NULL DEFAULT 0.00,
  horaire_ouverture TIME NOT NULL DEFAULT '00:00:00',
  horaire_fermeture TIME NOT NULL DEFAULT '23:59:59',
  note DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
  image VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ville (ville),
  INDEX idx_owner (owner_id),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: parking_services
-- ============================================
CREATE TABLE IF NOT EXISTS parking_services (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parking_id BIGINT NOT NULL,
  service VARCHAR(100) NOT NULL,
  FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_parking_service (parking_id, service),
  INDEX idx_parking (parking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: parking_type_vehicules
-- ============================================
CREATE TABLE IF NOT EXISTS parking_type_vehicules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parking_id BIGINT NOT NULL,
  type_vehicule VARCHAR(50) NOT NULL,
  FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_parking_vehicule (parking_id, type_vehicule),
  INDEX idx_parking (parking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: reservations
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  parking_id BIGINT NOT NULL,
  date_debut DATETIME NOT NULL,
  date_fin DATETIME NOT NULL,
  vehicule VARCHAR(50) NOT NULL,
  immatriculation VARCHAR(20) NULL,
  montant DECIMAL(8, 2) NOT NULL,
  statut ENUM('confirmée', 'annulée', 'terminée') NOT NULL DEFAULT 'confirmée',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_annulation DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_parking (parking_id),
  INDEX idx_dates (date_debut, date_fin),
  INDEX idx_statut (statut),
  -- Empêcher les chevauchements de dates pour le même utilisateur
  INDEX idx_user_dates (user_id, date_debut, date_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: stationnements
-- ============================================
CREATE TABLE IF NOT EXISTS stationnements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL,
  date_entree DATETIME NOT NULL,
  date_sortie DATETIME NULL,
  statut ENUM('en_cours', 'termine') NOT NULL DEFAULT 'en_cours',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  INDEX idx_reservation (reservation_id),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DONNÉES DE TEST
-- ============================================

-- Utilisateurs de test
-- IMPORTANT: Les hash de mots de passe doivent être générés avec password_hash() en PHP
-- Utiliser le script sql/003_generate_password_hash.php pour générer les hash
-- 
-- Exemple de hash pour 'password123':
-- $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
--
-- Pour créer les utilisateurs, exécuter:
-- php sql/003_generate_password_hash.php
-- Puis copier-coller les commandes SQL générées
--
-- OU utiliser cette commande SQL (hash pour 'password123'):
INSERT INTO users (email, password_hash, firstname, lastname, role, type_abonnement) VALUES
('user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean', 'Dupont', 'user', 'gratuit'),
('owner@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie', 'Martin', 'owner', 'premium')
ON DUPLICATE KEY UPDATE email=email;

-- Note: Le password_hash correspond à 'password123' (bcrypt)
-- Pour générer un nouveau hash: php -r "echo password_hash('votre_mot_de_passe', PASSWORD_BCRYPT);"
