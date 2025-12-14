# 🔐 Documentation Authentification - ParkingPartagé

## 📋 Structure Complète de l'Utilisateur

Chaque utilisateur dans le système possède les champs suivants :

### Champs de Base
| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | number | Identifiant unique | ✅ |
| `email` | string | Email de connexion | ✅ |
| `password` | string | Mot de passe (hashé en production) | ✅ |
| `firstname` | string | Prénom | ✅ |
| `lastname` | string | Nom | ✅ |
| `role` | string | 'user' ou 'owner' | ✅ |

### Champs Avancés
| Champ | Type | Description | Par défaut |
|-------|------|-------------|------------|
| `reservations` | array | Liste des réservations | `[]` |
| `stationnements` | array | Liste des stationnements | `[]` |
| `typeAbonnement` | string | 'gratuit', 'premium', 'business' | `'gratuit'` |
| `debutAbonnement` | string/null | Date de début (YYYY-MM-DD) | `null` |
| `finAbonnement` | string/null | Date de fin (YYYY-MM-DD) | `null` |

---

## 🎯 Types d'Abonnements

### 1. **Gratuit** (par défaut)
- ✅ Accès aux fonctionnalités de base
- ✅ Réservations limitées
- ❌ Pas de priorité
- ❌ Pas de réductions

### 2. **Premium**
- ✅ Réservations illimitées
- ✅ Priorité sur les places
- ✅ 20% de réduction
- ✅ Support prioritaire

### 3. **Business**
- ✅ Tout de Premium +
- ✅ Facturation mensuelle
- ✅ Gestion multi-véhicules
- ✅ API d'intégration

---

## 🔧 Fonctions API Disponibles

### 1. **Authentification**

#### `login(email, password)`
Connecte un utilisateur existant.

```javascript
const result = await apiService.login('user@example.com', 'password123');
// Retourne: { success, token, user }
```

#### `register(userData)`
Crée un nouveau compte utilisateur.

```javascript
const result = await apiService.register({
  email: 'nouveau@email.com',
  password: 'motdepasse123',
  firstname: 'Jean',
  lastname: 'Dupont',
  role: 'user'
});
// Retourne: { success, message, token, user }
```

---

### 2. **Gestion Utilisateur**

#### `getUserProfile(token)`
Récupère les informations complètes de l'utilisateur.

```javascript
const result = await apiService.getUserProfile(token);
// Retourne: { success, user }
```

#### `upgradeAbonnement(token, typeAbonnement, dureeEnMois)`
Met à niveau l'abonnement de l'utilisateur.

```javascript
const result = await apiService.upgradeAbonnement(token, 'premium', 12);
// Retourne: { success, message, user }
```

---

### 3. **Réservations**

#### `getReservations(token)`
Récupère toutes les réservations de l'utilisateur.

```javascript
const result = await apiService.getReservations(token);
// Retourne: { success, reservations }
```

#### `reserveParking(token, parkingId, reservationData)`
Crée une nouvelle réservation.

```javascript
const result = await apiService.reserveParking(token, 1, {
  date_debut: '2025-01-15T10:00:00',
  date_fin: '2025-01-15T18:00:00',
  montant: 20
});
// Retourne: { success, reservation }
```

---

### 4. **Stationnements**

#### `getStationnements(token)`
Récupère les stationnements actifs de l'utilisateur.

```javascript
const result = await apiService.getStationnements(token);
// Retourne: { success, stationnements }
```

---

### 5. **Propriétaires (Owner)**

#### `getOwnerParkings(token)`
Récupère tous les parkings du propriétaire.

```javascript
const result = await apiService.getOwnerParkings(token);
// Retourne: { success, parkings }
```

#### `addParking(token, parkingData)`
Ajoute un nouveau parking.

```javascript
const result = await apiService.addParking(token, {
  nom: 'Mon Parking',
  adresse: '123 Rue Example',
  nombre_places: 50,
  tarif_horaire: 2.5,
  tarif_journalier: 15,
  tarif_mensuel: 120,
  horaire_ouverture: '06:00',
  horaire_fermeture: '23:00'
});
// Retourne: { success, parking }
```

#### `getMonthlyRevenue(token)`
Récupère les revenus mensuels du propriétaire.

```javascript
const result = await apiService.getMonthlyRevenue(token);
// Retourne: { success, revenus_mensuels }
```

---

## 📦 Exemple d'Utilisation Complète

### Inscription et Connexion

```javascript
// 1. Inscription d'un nouvel utilisateur
try {
  const registerResult = await apiService.register({
    email: 'jean.dupont@email.com',
    password: 'motdepasse123',
    firstname: 'Jean',
    lastname: 'Dupont',
    role: 'user'
  });
  
  // Stocker le token et les infos utilisateur
  localStorage.setItem('token', registerResult.token);
  localStorage.setItem('user', JSON.stringify(registerResult.user));
  
  console.log('Compte créé:', registerResult.user);
  // user.typeAbonnement === 'gratuit' par défaut
  
} catch (error) {
  console.error('Erreur inscription:', error.message);
}

// 2. Connexion d'un utilisateur existant
try {
  const loginResult = await apiService.login(
    'jean.dupont@email.com',
    'motdepasse123'
  );
  
  localStorage.setItem('token', loginResult.token);
  localStorage.setItem('user', JSON.stringify(loginResult.user));
  
  console.log('Connecté:', loginResult.user);
  
} catch (error) {
  console.error('Erreur connexion:', error.message);
}
```

### Mise à Niveau d'Abonnement

```javascript
const token = localStorage.getItem('token');

try {
  const upgradeResult = await apiService.upgradeAbonnement(
    token,
    'premium',
    12 // 12 mois
  );
  
  console.log(upgradeResult.message);
  // "Abonnement premium activé avec succès"
  
  // Mettre à jour les infos utilisateur en local
  const userStr = localStorage.getItem('user');
  const user = JSON.parse(userStr);
  user.typeAbonnement = upgradeResult.user.typeAbonnement;
  user.debutAbonnement = upgradeResult.user.debutAbonnement;
  user.finAbonnement = upgradeResult.user.finAbonnement;
  localStorage.setItem('user', JSON.stringify(user));
  
} catch (error) {
  console.error('Erreur upgrade:', error.message);
}
```

### Réserver un Parking

```javascript
const token = localStorage.getItem('token');

try {
  const reservationResult = await apiService.reserveParking(
    token,
    1, // ID du parking
    {
      date_debut: '2025-01-15T10:00:00',
      date_fin: '2025-01-15T18:00:00',
      montant: 20
    }
  );
  
  console.log('Réservation confirmée:', reservationResult.reservation);
  
} catch (error) {
  console.error('Erreur réservation:', error.message);
}
```

---

## 🔒 Sécurité

### En Production (Backend PHP)

1. **Hachage des mots de passe**
   - Utiliser `password_hash()` en PHP
   - Ne jamais stocker les mots de passe en clair

2. **Tokens JWT**
   - Générer des tokens JWT sécurisés
   - Expiration après 24h
   - Refresh tokens pour renouvellement

3. **Validation des données**
   - Valider tous les inputs côté serveur
   - Protection contre les injections SQL
   - Sanitization des données

4. **HTTPS**
   - Toujours utiliser HTTPS en production
   - Sécuriser les cookies

---

## ✅ Checklist Trello - Status

- ✅ **email** - Implémenté
- ✅ **password** - Implémenté
- ✅ **nom** - Implémenté (lastname)
- ✅ **prénom** - Implémenté (firstname)
- ✅ **une liste de réservations** - Implémenté (reservations: [])
- ✅ **une liste de stationnements** - Implémenté (stationnements: [])
- ✅ **type d'abonnement** - Implémenté (typeAbonnement)
- ✅ **début abonnement** - Implémenté (debutAbonnement)
- ✅ **fin abonnement** - Implémenté (finAbonnement)

---

## 🎨 Intégration Frontend

### Afficher les Infos Utilisateur

```jsx
// Dans un composant React
const user = JSON.parse(localStorage.getItem('user'));

return (
  <div>
    <h2>Profil de {user.firstname} {user.lastname}</h2>
    <p>Email: {user.email}</p>
    <p>Rôle: {user.role}</p>
    <p>Abonnement: {user.typeAbonnement}</p>
    {user.typeAbonnement !== 'gratuit' && (
      <>
        <p>Début: {user.debutAbonnement}</p>
        <p>Fin: {user.finAbonnement}</p>
      </>
    )}
    <p>Réservations: {user.reservations.length}</p>
    <p>Stationnements: {user.stationnements.length}</p>
  </div>
);
```

---

## 🚀 Prochaines Étapes

1. **Backend PHP**
   - Créer les endpoints API réels
   - Implémenter l'authentification JWT
   - Connecter à MySQL

2. **Paiements**
   - Intégrer Stripe pour les abonnements
   - Gérer les renouvellements automatiques

3. **Notifications**
   - Email de confirmation
   - Rappels de réservation
   - Alertes d'expiration d'abonnement

---

**Documentation mise à jour le:** 2025-11-20  
**Version:** 1.0.0


