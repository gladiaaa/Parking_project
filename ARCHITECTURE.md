# 🏗️ Architecture du Projet - ParkingPartagé

Documentation complète de l'architecture pour le travail en groupe.

## 📐 Vue d'ensemble

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│    Frontend     │ ──────> │    Backend      │ ──────> │   MySQL DB      │
│   (React)       │  HTTP   │     (PHP)       │   SQL   │                 │
│   Port 4000     │         │   Port 8001     │         │   Port 3306     │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## 🔄 Flux de données

### 1. Authentification

```
User → Frontend (Login.jsx)
  ↓
apiService.login()
  ↓
Backend POST /api/auth/login
  ↓
MySQL SELECT users WHERE email
  ↓
Retour token + user data
  ↓
localStorage.setItem('token', token)
```

### 2. Recherche de parkings

```
User → Frontend (Reservation.jsx)
  ↓
apiService.searchParkings()
  ↓
Backend GET /api/parkings?ville=Paris
  ↓
MySQL SELECT parkings + calcul places disponibles
  ↓
Retour liste parkings
```

### 3. Réservation

```
User → Frontend (BookingModal)
  ↓
apiService.reserveParking()
  ↓
Backend POST /api/reservations
  ↓
MySQL INSERT reservations + vérification disponibilité
  ↓
Retour confirmation
```

## 📁 Structure des fichiers

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              # Page d'accueil
│   │   ├── Login.jsx              # Connexion
│   │   ├── Register.jsx           # Inscription
│   │   ├── Reservation.jsx        # Recherche/Réservation
│   │   ├── Maps.jsx               # Carte interactive
│   │   └── MesReservations.jsx    # Gestion réservations
│   ├── components/
│   │   ├── Header.jsx             # Navigation
│   │   ├── Footer.jsx             # Pied de page
│   │   └── LoadingScreen.jsx     # Écran de chargement
│   ├── services/
│   │   └── apiService.js          # ⚠️ MOCK API (à connecter)
│   └── App.jsx                    # Routeur principal
└── package.json
```

### Backend (`Backend/`)

```
Backend/
├── public/
│   └── index.php                  # Point d'entrée API
├── src/
│   └── bootstrap.php              # Configuration DB + helpers
└── README.md
```

### Base de données (`sql/`)

```
sql/
├── 001_init_core.sql              # Schéma complet
└── 002_insert_parkings.sql        # Données de test
```

## 🗄️ Schéma de base de données

### Relations principales

```
users (1) ────< (N) parkings
  │                    │
  │                    │
  └───< (N) reservations >───┘
              │
              │
              └───< (1) stationnements
```

### Tables détaillées

#### `users`
- `id` (PK)
- `email` (UNIQUE)
- `password_hash`
- `firstname`, `lastname`
- `role` (user/owner)
- `type_abonnement` (gratuit/premium/business)

#### `parkings`
- `id` (PK)
- `owner_id` (FK → users)
- `nom`, `adresse`, `ville`
- `latitude`, `longitude`
- `nombre_places`
- `tarif_horaire`, `tarif_journalier`, `tarif_mensuel`
- `note` (rating)

#### `reservations`
- `id` (PK)
- `user_id` (FK → users)
- `parking_id` (FK → parkings)
- `date_debut`, `date_fin`
- `vehicule`, `immatriculation`
- `montant`
- `statut` (confirmée/annulée/terminée)

## 🔌 API Endpoints

### Actuellement implémentés

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Health check |
| GET | `/db/ping` | Test connexion DB |
| GET | `/api/parkings` | Liste tous les parkings |
| GET | `/api/parkings/:id` | Détails d'un parking |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/users` | Liste utilisateurs (debug) |

### À implémenter

- `POST /api/auth/register` - Inscription
- `GET /api/auth/profile` - Profil utilisateur
- `GET /api/parkings/search` - Recherche avec filtres
- `POST /api/reservations` - Créer réservation
- `GET /api/reservations` - Mes réservations
- `DELETE /api/reservations/:id` - Annuler réservation

## 🔄 État actuel

### ✅ Fonctionnel

- **Frontend** : Interface complète avec mock API
- **Base de données** : Schéma complet et logique
- **Backend** : Structure de base avec quelques endpoints

### ⚠️ À connecter

Le frontend utilise actuellement `apiService.js` qui simule un backend. Pour connecter au vrai backend :

1. Modifier `API_BASE_URL` dans `apiService.js`
2. Adapter les fonctions pour faire de vrais appels HTTP
3. Gérer les tokens JWT
4. Gérer les erreurs réseau

## 🔐 Sécurité

### Actuellement

- Hashage des mots de passe (bcrypt)
- Validation des données côté backend
- CORS configuré

### À améliorer

- Tokens JWT au lieu de tokens simples
- Validation côté frontend
- Rate limiting
- Sanitization des inputs

## 📝 Pour le groupe

### Chaque membre doit comprendre

1. **Frontend** : React + Tailwind, composants réutilisables
2. **Backend** : PHP simple, PDO pour MySQL
3. **Base de données** : Relations claires, schéma logique
4. **API** : RESTful, JSON, CORS

### Workflow recommandé

1. **Développement local** : Chacun sur sa machine
2. **Base de données** : Schéma partagé (même structure)
3. **Git** : Branches par fonctionnalité
4. **Tests** : Vérifier avec les comptes de test

### Partage de code

- ✅ **Partager** : Code source, schéma DB, documentation
- ❌ **Ne pas partager** : `.env`, `node_modules`, fichiers de log

## 🚀 Prochaines étapes

1. Connecter frontend au vrai backend
2. Implémenter tous les endpoints API
3. Ajouter authentification JWT
4. Tests unitaires
5. Déploiement

---

**Documentation maintenue pour faciliter le travail en groupe**





