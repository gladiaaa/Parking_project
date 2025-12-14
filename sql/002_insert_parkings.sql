-- ============================================
-- INSERTION DES PARKINGS DE TEST
-- ============================================

USE parking_app;

-- Récupérer l'ID du propriétaire
SET @owner_id = (SELECT id FROM users WHERE email = 'owner@example.com' LIMIT 1);

-- Parkings Paris
INSERT INTO parkings (owner_id, nom, adresse, ville, latitude, longitude, nombre_places, tarif_horaire, tarif_journalier, tarif_mensuel, horaire_ouverture, horaire_fermeture, note) VALUES
(@owner_id, 'Parking Opéra Premium', '15 Rue Scribe, 75009 Paris', 'Paris', 48.8706, 2.3319, 150, 3.50, 25.00, 280.00, '00:00:00', '23:59:59', 4.8),
(@owner_id, 'Station Châtelet', '1 Place du Châtelet, 75001 Paris', 'Paris', 48.8584, 2.3470, 200, 4.00, 30.00, 320.00, '00:00:00', '23:59:59', 4.9),
(@owner_id, 'Parking Gare du Nord', '18 Rue de Dunkerque, 75010 Paris', 'Paris', 48.8809, 2.3553, 300, 3.00, 22.00, 250.00, '00:00:00', '23:59:59', 4.6),
(@owner_id, 'Park Saint-Lazare', '108 Rue Saint-Lazare, 75008 Paris', 'Paris', 48.8756, 2.3262, 120, 4.50, 35.00, 350.00, '06:00:00', '22:00:00', 4.7),
(@owner_id, 'Parking Bastille Central', '120 Rue de Lyon, 75012 Paris', 'Paris', 48.8522, 2.3697, 180, 3.20, 24.00, 270.00, '00:00:00', '23:59:59', 4.5)
ON DUPLICATE KEY UPDATE nom=nom;

-- Parkings Lyon
INSERT INTO parkings (owner_id, nom, adresse, ville, latitude, longitude, nombre_places, tarif_horaire, tarif_journalier, tarif_mensuel, horaire_ouverture, horaire_fermeture, note) VALUES
(@owner_id, 'Lyon Part-Dieu Premium', '21 Boulevard Vivier Merle, 69003 Lyon', 'Lyon', 45.7606, 4.8564, 250, 2.80, 20.00, 220.00, '00:00:00', '23:59:59', 4.9),
(@owner_id, 'Station Bellecour', '12 Place Bellecour, 69002 Lyon', 'Lyon', 45.7578, 4.8320, 180, 3.50, 26.00, 280.00, '00:00:00', '23:59:59', 4.7)
ON DUPLICATE KEY UPDATE nom=nom;

-- Parking Marseille
INSERT INTO parkings (owner_id, nom, adresse, ville, latitude, longitude, nombre_places, tarif_horaire, tarif_journalier, tarif_mensuel, horaire_ouverture, horaire_fermeture, note) VALUES
(@owner_id, 'Parking Vieux-Port', '46 Quai du Port, 13002 Marseille', 'Marseille', 43.2965, 5.3698, 220, 3.00, 22.00, 240.00, '00:00:00', '23:59:59', 4.6)
ON DUPLICATE KEY UPDATE nom=nom;

-- Services pour chaque parking
INSERT INTO parking_services (parking_id, service)
SELECT id, 'Couvert' FROM parkings WHERE nom = 'Parking Opéra Premium'
UNION ALL SELECT id, 'Sécurisé' FROM parkings WHERE nom = 'Parking Opéra Premium'
UNION ALL SELECT id, 'Vidéo-surveillance' FROM parkings WHERE nom = 'Parking Opéra Premium'
UNION ALL SELECT id, 'Bornes électriques' FROM parkings WHERE nom = 'Parking Opéra Premium'
ON DUPLICATE KEY UPDATE service=service;

-- Type de véhicules
INSERT INTO parking_type_vehicules (parking_id, type_vehicule)
SELECT id, 'Voiture' FROM parkings WHERE ville = 'Paris'
UNION ALL SELECT id, 'Moto' FROM parkings WHERE ville = 'Paris'
ON DUPLICATE KEY UPDATE type_vehicule=type_vehicule;





