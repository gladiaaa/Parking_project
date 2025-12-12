# 🚀 Backend - ParkingPartagé

API REST en PHP pour le système de réservation de parkings.

## 📋 Prérequis

- PHP 8.0+
- MySQL 8.0+
- Composer (optionnel)

## 🛠️ Installation

### 1. Configuration de la base de données

```bash
# Créer la base de données
mysql -u root -p < sql/001_init_core.sql

# Insérer les données de test
mysql -u root -p < sql/002_insert_parkings.sql
```

### 2. Configuration de l'environnement

```bash
# Copier le fichier .env.example
cp .env.example .env

# Éditer .env avec vos paramètres
nano .env
```

### 3. Démarrer le serveur PHP

```bash
# Depuis le dossier Backend
cd Backend
php -S localhost:8001 -t public
```

## 📊 Structure de la base de données

### Tables principales

- **users** : Utilisateurs (user/owner)
- **parkings** : Parkings disponibles
- **parking_services** : Services proposés par parking
- **parking_type_vehicules** : Types de véhicules acceptés
- **reservations** : Réservations des utilisateurs
- **stationnements** : Stationnements actifs

## 🔌 Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/profile` - Profil utilisateur

### Parkings
- `GET /api/parkings` - Liste des parkings
- `GET /api/parkings/search` - Recherche de parkings
- `GET /api/parkings/:id` - Détails d'un parking

### Réservations
- `GET /api/reservations` - Mes réservations
- `POST /api/reservations` - Créer une réservation
- `DELETE /api/reservations/:id` - Annuler une réservation

## 🔐 Sécurité

- Hashage des mots de passe avec bcrypt
- Tokens JWT pour l'authentification
- Validation des données
- Protection CORS

## 👥 Pour le groupe

1. Cloner le projet
2. Installer MySQL
3. Exécuter les scripts SQL dans l'ordre
4. Configurer le `.env`
5. Démarrer le serveur PHP

## 📝 Notes

- Le frontend utilise actuellement un mock API (`apiService.js`)
- Pour connecter le vrai backend, modifier `API_BASE_URL` dans `apiService.js`
- Les mots de passe de test : `password123` (hashé avec bcrypt)





