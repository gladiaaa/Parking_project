# 🔌 Guide de Connexion Frontend ↔ Backend

Comment connecter le frontend React au backend PHP réel.

## 📍 État actuel

Le frontend utilise actuellement un **mock API** (`apiService.js`) qui simule toutes les fonctionnalités en mémoire et localStorage.

## 🎯 Objectif

Remplacer le mock par de vrais appels HTTP vers le backend PHP.

## 🔄 Étapes de migration

### 1. Vérifier que le backend fonctionne

```bash
# Démarrer le backend
cd Backend
php -S localhost:8001 -t public

# Tester
curl http://localhost:8001/health
# Devrait retourner: {"ok":true,"php":"8.x"}
```

### 2. Modifier `apiService.js`

Le fichier `frontend/src/services/apiService.js` contient déjà `API_BASE_URL = 'http://localhost:8001/api'`.

**Option A : Migration progressive**

Créer une fonction helper pour les appels HTTP :

```javascript
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
```

**Option B : Remplacer fonction par fonction**

Commencer par `login()` :

```javascript
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } else {
      throw new Error(data.error || 'Erreur de connexion');
    }
  } catch (error) {
    throw new Error(error.message || 'Erreur réseau');
  }
};
```

### 3. Endpoints à implémenter dans le backend

#### Authentification

```php
// POST /api/auth/login
// Body: { "email": "...", "password": "..." }
// Retour: { "success": true, "token": "...", "user": {...} }

// POST /api/auth/register
// Body: { "email": "...", "password": "...", "firstname": "...", "lastname": "...", "role": "user" }
// Retour: { "success": true, "token": "...", "user": {...} }

// GET /api/auth/profile
// Header: Authorization: Bearer {token}
// Retour: { "success": true, "user": {...} }
```

#### Parkings

```php
// GET /api/parkings
// Query: ?ville=Paris&prixMax=50
// Retour: { "success": true, "parkings": [...], "total": 10 }

// GET /api/parkings/:id
// Retour: { "success": true, "parking": {...} }
```

#### Réservations

```php
// POST /api/reservations
// Body: { "parking_id": 1, "date_debut": "...", "date_fin": "...", "vehicule": "..." }
// Retour: { "success": true, "reservation": {...} }

// GET /api/reservations
// Header: Authorization: Bearer {token}
// Retour: { "success": true, "reservations": [...] }

// DELETE /api/reservations/:id
// Header: Authorization: Bearer {token}
// Retour: { "success": true }
```

## 🔐 Gestion des tokens

### Backend : Générer un token JWT

```php
// Installer: composer require firebase/php-jwt

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function generateToken($user) {
    $payload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'exp' => time() + (60 * 60 * 24) // 24h
    ];
    
    return JWT::encode($payload, env('JWT_SECRET'), 'HS256');
}

function verifyToken($token) {
    try {
        return JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));
    } catch (Exception $e) {
        return null;
    }
}
```

### Frontend : Utiliser le token

```javascript
// Dans apiService.js
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Exemple d'appel authentifié
const getMyReservations = async () => {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return response.json();
};
```

## 🧪 Tests

### Tester chaque endpoint

```bash
# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Liste parkings
curl http://localhost:8001/api/parkings

# Créer réservation (avec token)
curl -X POST http://localhost:8001/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"parking_id":1,"date_debut":"2025-01-20 10:00:00","date_fin":"2025-01-20 12:00:00","vehicule":"Voiture"}'
```

## 📝 Checklist de migration

- [ ] Backend démarré et accessible
- [ ] Endpoint `/health` fonctionne
- [ ] Endpoint `/api/auth/login` implémenté
- [ ] Frontend `login()` utilise le vrai backend
- [ ] Token stocké et envoyé dans les headers
- [ ] Endpoint `/api/parkings` implémenté
- [ ] Frontend `searchParkings()` utilise le vrai backend
- [ ] Endpoint `/api/reservations` implémenté
- [ ] Frontend `reserveParking()` utilise le vrai backend
- [ ] Gestion des erreurs réseau
- [ ] Tests de bout en bout

## ⚠️ Points d'attention

1. **CORS** : Le backend doit autoriser les requêtes depuis `http://localhost:4000`
2. **Validation** : Valider toutes les données côté backend
3. **Erreurs** : Retourner des messages d'erreur clairs
4. **Sécurité** : Ne jamais exposer les mots de passe en clair
5. **Performance** : Optimiser les requêtes SQL (indexes)

## 🚀 Exemple complet

### Backend : `Backend/public/index.php`

```php
// POST /api/auth/login
if ($route === 'auth/login' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = trim(strtolower($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    
    $stmt = pdo()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password_hash'])) {
        $token = generateToken($user);
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'role' => $user['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Email ou mot de passe incorrect']);
    }
    exit;
}
```

### Frontend : `frontend/src/services/apiService.js`

```javascript
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: email.trim().toLowerCase(), 
      password 
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }
  
  throw new Error(data.error || 'Erreur de connexion');
};
```

---

**Guide pour connecter progressivement le frontend au backend réel**

