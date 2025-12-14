# 🚀 Guide d'Installation - ParkingPartagé

Guide complet pour installer et configurer le projet en groupe.

## 📋 Prérequis

- **Node.js** 16+ et npm
- **PHP** 8.0+ avec extensions PDO et MySQL
- **MySQL** 8.0+
- **Git**

## 🔧 Installation étape par étape

### 1. Cloner le projet

```bash
git clone [url-du-repo]
cd Parking_project
```

### 2. Configuration de la base de données

```bash
# Se connecter à MySQL
mysql -u root -p

# Ou créer un utilisateur dédié
mysql -u root -p
CREATE USER 'parking_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON parking_app.* TO 'parking_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Créer la base de données et les tables
mysql -u root -p < sql/001_init_core.sql

# Insérer les données de test
mysql -u root -p < sql/002_insert_parkings.sql
```

### 3. Configuration Backend

```bash
# Créer le fichier .env à la racine du projet
cat > .env << EOF
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=parking_app
DB_USER=root
DB_PASS=votre_mot_de_passe_mysql
API_BASE_URL=http://localhost:8001/api
FRONTEND_URL=http://localhost:4000
JWT_SECRET=changez-moi-en-production
APP_ENV=development
APP_DEBUG=true
EOF
```

### 4. Installation Frontend

```bash
cd frontend
npm install
```

### 5. Démarrer les serveurs

**Terminal 1 - Backend :**
```bash
cd Backend
php -S localhost:8001 -t public
```

**Terminal 2 - Frontend :**
```bash
cd frontend
PORT=4000 npm start
```

## ✅ Vérification

1. **Backend** : http://localhost:8001/health
   - Devrait retourner : `{"ok":true,"php":"8.x"}`

2. **Base de données** : http://localhost:8001/db/ping
   - Devrait retourner : `{"ok":true,"mysql_version":"8.x"}`

3. **Frontend** : http://localhost:4000
   - Devrait afficher la page d'accueil

## 🔐 Comptes de test

**Utilisateur :**
- Email: `user@example.com`
- Password: `password123`

**Propriétaire :**
- Email: `owner@example.com`
- Password: `password123`

## 📊 Structure de la base de données

### Tables créées

1. **users** - Utilisateurs (user/owner)
2. **parkings** - Parkings disponibles
3. **parking_services** - Services par parking
4. **parking_type_vehicules** - Types de véhicules acceptés
5. **reservations** - Réservations
6. **stationnements** - Stationnements actifs

### Relations

- `users` → `parkings` (owner_id)
- `users` → `reservations` (user_id)
- `parkings` → `reservations` (parking_id)
- `reservations` → `stationnements` (reservation_id)

## 🐛 Dépannage

### Erreur de connexion MySQL

```bash
# Vérifier que MySQL tourne
sudo service mysql status

# Redémarrer MySQL
sudo service mysql restart
```

### Port déjà utilisé

```bash
# Changer le port dans .env
DB_PORT=3307

# Ou pour le frontend
PORT=4001 npm start
```

### Erreur "Table doesn't exist"

```bash
# Réexécuter les scripts SQL
mysql -u root -p < sql/001_init_core.sql
mysql -u root -p < sql/002_insert_parkings.sql
```

## 📝 Notes importantes

- Le frontend utilise actuellement un **mock API** (`apiService.js`)
- Pour connecter au vrai backend, modifier `API_BASE_URL` dans `frontend/src/services/apiService.js`
- Les données sont persistées dans MySQL (backend) et localStorage (frontend mock)

## 👥 Pour le groupe

Chaque membre doit :
1. Cloner le repo
2. Installer les dépendances
3. Configurer sa base de données locale
4. Créer son fichier `.env`
5. Démarrer les serveurs

**Tous les membres partagent le même schéma de base de données !**





