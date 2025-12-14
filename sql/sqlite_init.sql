-- SQLite Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  api_token TEXT NULL,
  type_abonnement TEXT NOT NULL DEFAULT 'gratuit',
  debut_abonnement DATE NULL,
  fin_abonnement DATE NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parkings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT NOT NULL,
  ville TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  nombre_places INTEGER NOT NULL DEFAULT 0,
  tarif_horaire DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  tarif_journalier DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  tarif_mensuel DECIMAL(7, 2) NOT NULL DEFAULT 0.00,
  horaire_ouverture TIME NOT NULL DEFAULT '00:00:00',
  horaire_fermeture TIME NOT NULL DEFAULT '23:59:59',
  note DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
  image TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parking_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parking_id INTEGER NOT NULL,
  service TEXT NOT NULL,
  FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
  UNIQUE(parking_id, service)
);

CREATE TABLE IF NOT EXISTS parking_type_vehicules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parking_id INTEGER NOT NULL,
  type_vehicule TEXT NOT NULL,
  FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE,
  UNIQUE(parking_id, type_vehicule)
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  parking_id INTEGER NOT NULL,
  date_debut DATETIME NOT NULL,
  date_fin DATETIME NOT NULL,
  vehicule TEXT NOT NULL,
  immatriculation TEXT NULL,
  montant DECIMAL(8, 2) NOT NULL,
  statut TEXT NOT NULL DEFAULT 'confirmée',
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_annulation DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_token ON users(api_token);
CREATE INDEX idx_parkings_ville ON parkings(ville);
