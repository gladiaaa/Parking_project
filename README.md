# 🅿️ ParkingPartagé

Système de réservation de parkings en temps réel - Projet de groupe

## 🎯 Description

Application web moderne permettant de réserver des places de parking dans toute la France. Interface ultra-épurée et minimaliste inspirée des grandes marques (Apple, Tesla, Airbnb).

## 🏗️ Architecture

```
Parking_project/
├── frontend/          # React + Tailwind CSS
├── Backend/           # API PHP + MySQL
├── sql/               # import de la BDD
└── README.md          # Ce fichier
```

## 🚀 Installation rapide

### Frontend

```bash
cd frontend
npm install
npm start
# Ouvre http://localhost:3000
```

### Backend

```bash
# 1. Créer la base de données
mysql -u root -p < sql/001_init_core.sql
mysql -u root -p < sql/002_insert_parkings.sql

# Un fichier d'import sql est également disponible  "ImportParking_app.sql" 

# 2. Configurer .env
cp .env.example .env
# Éditer .env avec vos paramètres

# 3. Démarrer le serveur
cd Backend
php -S localhost:8001 -t public
```

## 📊 Base de données

### Tables principales

- **users** : Utilisateurs (email, password, role, abonnement)
- **parkings** : Parkings (nom, adresse, coordonnées GPS, tarifs)
- **reservations** : Réservations (dates, montant, statut)
- **stationnements** : Stationnements actifs
- **parking_services** : Services proposés
- **parking_type_vehicules** : Types de véhicules acceptés

### Scripts SQL

1. `sql/001_init_core.sql` - Création des tables
2. `sql/002_insert_parkings.sql` - Données de test

## 🔐 Comptes de test

**Utilisateur :**
- Email: `user@example.com`
- Password: `password123`

**Propriétaire :**
- Email: `owner@example.com`
- Password: `password123`

## ✨ Fonctionnalités

- ✅ Authentification complète (login/register)
- ✅ Recherche de parkings avec filtres avancés
- ✅ Carte interactive avec tous les parkings
- ✅ Système de réservation complet
- ✅ Gestion des réservations
- ✅ Empêchement des réservations simultanées
- ✅ Calcul automatique des prix
- ✅ Design ultra-moderne et minimaliste

## 🛠️ Technologies

**Frontend :**
- React 18
- Tailwind CSS
- React Router
- Leaflet (cartes)

**Backend :**
- PHP 8.0+
- MySQL 8.0+
- PDO

## 📁 Structure du projet

```
frontend/
├── src/
│   ├── pages/          # Pages principales
│   ├── components/      # Composants réutilisables
│   ├── services/        # API service (mock pour l'instant)
│   └── App.jsx         # Routeur principal

Backend/
├── public/             # Point d'entrée API
├── src/                # Code source PHP
└── README.md

sql/
├── 001_init_core.sql   # Schéma de base de données
└── 002_insert_parkings.sql  # Données de test
```

## 👥 Pour les membres du groupe

### Première installation

1. **Cloner le projet**
   ```bash
   git clone [url-du-repo]
   cd Parking_project
   ```

2. **Installer les dépendances frontend**
   ```bash
   cd frontend
   npm install
   ```

3. **Configurer la base de données**
   ```bash
   mysql -u root -p < sql/001_init_core.sql

   ou en cas de problème importer le fichier Parking_Help.sql 
   ```

4. **Configurer l'environnement backend**

   ```bash
   
   cd /Backend
   Composer install
   # .env.exemple disponible dans le /backend
   # Éditer .env dans /Backend avec vos paramètres MySQL
   ```

5. **Démarrer les serveurs**
   ```bash
   # Terminal 1 - Frontend
   cd frontend
   npm start

   # Terminal 2 - Backend
   cd Backend
   php -S localhost:8001 -t public
   ```
   ## Login User/Owner
### User

- Identifiant : User.siriphol@gmail.com
- mot de passe : UserTest

### Owner

- Identifiant : Owner.siriphol@gmail.com
- mot de passe : OwnerTest


### Utilisation quotidienne

- **Frontend** : http://localhost:3000 (ou 4000)
- **Backend API** : http://localhost:8001
- **Health check** : http://localhost:8001/health

## 📝 Notes importantes

- Le frontend utilise actuellement un **mock API** (`apiService.js`)
- Pour connecter le vrai backend, modifier `API_BASE_URL` dans `frontend/src/services/apiService.js`
- Les utilisateurs sont persistés dans `localStorage` (frontend)
- Les réservations sont stockées en mémoire (sera remplacé par la DB)

## 🔄 Prochaines étapes

1. Connecter le frontend au vrai backend PHP
2. Implémenter l'authentification JWT
3. Ajouter la géolocalisation
4. Système de paiement
5. Notifications en temps réel

## 📞 Support

Pour toute question, consulter :
- `frontend/AUTHENTIFICATION.md` - Documentation authentification
- `Backend/README.md` - Documentation backend
- `sql/001_init_core.sql` - Schéma de base de données

---




**Développé avec ❤️ pour le projet de groupe**

ANNIC Ryan
BONNICHON-JAQUES Baptiste
MOUHAJER Rayane
PAES RODRIGUES DA SILVA Raphael