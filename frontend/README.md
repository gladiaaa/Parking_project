# Système de Parking Partagé - Frontend

Application React pour la gestion de parkings partagés - Projet HETIC 2025

## Installation

```bash
npm install
npm start
```

L'application sera accessible sur http://localhost:3000

## Technologies

- React 19.2.0
- React Router DOM 6.30.1
- TailwindCSS 3.4.18
- PostCSS + Autoprefixer

## Structure

```
src/
├── components/      # Composants réutilisables
├── pages/           # Pages de l'application
├── routes/          # Configuration des routes
├── services/        # Appels API
├── App.jsx          # Configuration Router
└── index.js         # Point d'entrée
```

## Pages principales

- `/` - Accueil
- `/login` - Connexion
- `/register` - Inscription (utilisateur/propriétaire)
- `/dashboard-user` - Espace utilisateur
- `/dashboard-owner` - Espace propriétaire
- `/parking/:id` - Détails d'un parking

## Fonctionnalités

### Utilisateurs

- Inscription avec choix de rôle
- Réservation de parking
- Suivi des réservations et stationnements

### Propriétaires

- Ajout et gestion de parkings
- Visualisation des statistiques (CA, réservations, stationnements)
- Modification des tarifs et horaires

## Configuration

Configuration TailwindCSS dans `tailwind.config.js` et `postcss.config.js`

Couleur principale : #34A853

## Scripts

```bash
npm start     # Développement
npm run build # Production
npm test      # Tests
```

## Backend

Application prête à être connectée au backend PHP sur http://localhost:8001

Tous les appels API sont simulés dans `src/services/apiService.js`
