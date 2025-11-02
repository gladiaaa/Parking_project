# Frontend - Système de Parking Partagé

Application React pour le système de parking partagé - Projet HETIC 2025

## 🚀 Technologies utilisées

- **React 19.2.0** - Bibliothèque JavaScript pour construire l'interface utilisateur
- **React Router DOM 6.30.1** - Navigation entre les pages sans rechargement
- **TailwindCSS 3.4.18** - Framework CSS pour le design moderne et responsive
- **fetch API** - Appels HTTP REST vers le backend PHP
- **LocalStorage** - Stockage du token JWT pour l'authentification

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🏗️ Structure du projet

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              # Page d'accueil
│   │   ├── Login.jsx              # Page de connexion
│   │   ├── Register.jsx           # Page d'inscription
│   │   ├── Dashboard.jsx          # Tableau de bord utilisateur
│   │   └── OwnerDashboard.jsx     # Tableau de bord propriétaire
│   ├── components/
│   │   ├── Header.jsx             # En-tête avec navigation
│   │   ├── Footer.jsx             # Pied de page
│   │   ├── SearchBar.jsx          # Barre de recherche
│   │   ├── ParkingCard.jsx        # Carte d'affichage d'un parking
│   │   └── ProtectedRoute.jsx     # Composant de protection des routes
│   ├── App.jsx                    # Configuration des routes
│   ├── index.js                   # Point d'entrée de l'application
│   └── index.css                  # Styles TailwindCSS
├── package.json
└── README.md
```

## 📄 Pages disponibles

### 1. Page d'accueil (`/`)

- Affichage du hero avec barre de recherche
- Section "Comment ça marche"
- Affichage des villes disponibles
- Témoignages utilisateurs
- Design inspiré de Zenpark avec fond vert (#34A853)

### 2. Page de connexion (`/login`)

- Formulaire email/password
- Authentification via API backend
- Sauvegarde du JWT dans localStorage
- Redirection vers `/dashboard` en cas de succès

### 3. Page d'inscription (`/register`)

- Formulaire : prénom, nom, email, mot de passe
- Envoi vers `/api/register`
- Redirection vers `/login` après succès

### 4. Tableau de bord utilisateur (`/dashboard`)

- **Route protégée** (nécessite authentification)
- Affichage des réservations (GET `/api/reservations`)
- Affichage des abonnements (GET `/api/abonnements`)
- Boutons "Entrer" et "Sortir" pour les réservations confirmées
- Gestion des erreurs et états de chargement

### 5. Tableau de bord propriétaire (`/owner`)

- **Route protégée** (nécessite authentification)
- Ajouter un parking (POST `/api/parkings`)
- Modifier tarifs et horaires d'un parking (PUT `/api/parkings/:id`)
- Consulter les revenus (GET `/api/parkings/:id/revenues`)
- Liste des parkings du propriétaire

## 🔌 Appels API utilisés

Tous les appels API pointent vers `http://localhost:8001/api/`

### Authentification

- `POST /api/login` - Connexion utilisateur
- `POST /api/register` - Inscription utilisateur

### Réservations

- `GET /api/reservations` - Liste des réservations de l'utilisateur
- `POST /api/reservations/:id/enter` - Entrer dans un parking
- `POST /api/reservations/:id/exit` - Sortir d'un parking

### Abonnements

- `GET /api/abonnements` - Liste des abonnements de l'utilisateur

### Parkings

- `GET /api/parkings` - Liste des parkings (avec query `?location=...` pour recherche)
- `POST /api/parkings` - Créer un parking (propriétaire)
- `PUT /api/parkings/:id` - Modifier un parking (propriétaire)
- `GET /api/parkings/:id/revenues` - Consulter les revenus d'un parking

### Format des requêtes

- Les requêtes authentifiées nécessitent un header :
  ```javascript
  {
    "Authorization": `Bearer ${token}`
  }
  ```
- Les données sont envoyées en JSON avec le header :
  ```javascript
  {
    "Content-Type": "application/json"
  }
  ```

## 🔐 Gestion de l'authentification

- Le token JWT est stocké dans `localStorage` sous la clé `"token"`
- Le composant `ProtectedRoute` vérifie la présence du token avant d'afficher une page protégée
- Si aucun token n'est trouvé, redirection automatique vers `/login`
- Les erreurs 401 (non autorisé) déclenchent une déconnexion et redirection

## 🎨 Design

- **Couleur principale** : #34A853 (vert)
- **Police** : Poppins / Inter (sans-serif)
- **Responsive** : Design adaptatif mobile/tablette/desktop avec TailwindCSS
- **Style** : Moderne, épuré, inspiré de Zenpark

## 📋 Scripts disponibles

```bash
# Développement
npm start          # Lance le serveur de développement (port 3000)

# Build de production
npm run build      # Crée un build optimisé dans le dossier `build`

# Tests
npm test           # Lance les tests

# Eject (déconseillé)
npm run eject      # Éjecte la configuration Create React App
```

## 🔧 Configuration TailwindCSS

TailwindCSS est configuré via :

- `tailwind.config.js` - Configuration du thème
- `postcss.config.js` - Configuration PostCSS
- `src/index.css` - Import des directives Tailwind

## ⚠️ Notes importantes

1. **Backend requis** : L'application nécessite que le backend PHP soit lancé sur `http://localhost:8001`
2. **CORS** : Le backend doit autoriser les requêtes depuis `http://localhost:3000`
3. **Token JWT** : Le token est stocké localement et doit être envoyé dans toutes les requêtes authentifiées
4. **Responsive** : Toutes les pages sont responsives et s'adaptent aux écrans mobiles

## 📝 Dépendances installées

Voir `package.json` pour la liste complète. Principales dépendances :

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^6.30.1",
  "react-scripts": "5.0.1",
  "tailwindcss": "^3.4.18",
  "postcss": "^8.5.6",
  "autoprefixer": "^10.4.21"
}
```

## 🐛 Dépannage

### L'application ne se connecte pas au backend

- Vérifiez que le backend PHP est lancé sur le port 8001
- Vérifiez les règles CORS dans le backend

### Erreur d'authentification

- Vérifiez que le token est bien stocké dans localStorage
- Vérifiez le format du header Authorization dans les requêtes

### Styles TailwindCSS non appliqués

- Vérifiez que les directives `@tailwind` sont présentes dans `index.css`
- Vérifiez la configuration dans `tailwind.config.js`

## 👨‍💻 Développeur

Rayane - Projet HETIC 2025
