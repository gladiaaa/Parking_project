/**
 * Service API simulé pour les appels backend
 * Tous les appels sont simulés pour l'instant jusqu'à la connexion au backend PHP
 */

const API_BASE_URL = 'http://localhost:8001/api';

// Simuler un délai de réponse réseau
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data pour les tests
const mockUsers = {
  'user@example.com': {
    id: 1,
    email: 'user@example.com',
    password: 'password123',
    firstname: 'Jean',
    lastname: 'Dupont',
    role: 'user',
    token: 'mock-token-user-123',
    reservations: [],
    stationnements: [],
    typeAbonnement: 'gratuit',
    debutAbonnement: null,
    finAbonnement: null
  },
  'owner@example.com': {
    id: 2,
    email: 'owner@example.com',
    password: 'password123',
    firstname: 'Marie',
    lastname: 'Martin',
    role: 'owner',
    token: 'mock-token-owner-456',
    reservations: [],
    stationnements: [],
    typeAbonnement: 'premium',
    debutAbonnement: '2025-01-01',
    finAbonnement: '2025-12-31'
  }
};

const mockParkings = [
  {
    id: 1,
    nom: 'Parking Centre-Ville',
    adresse: '15 Rue de la République, 75001 Paris',
    nombre_places: 50,
    places_disponibles: 35,
    tarif_horaire: 2.5,
    tarif_journalier: 15,
    tarif_mensuel: 120,
    horaire_ouverture: '06:00',
    horaire_fermeture: '23:00'
  },
  {
    id: 2,
    nom: 'Parking Gare',
    adresse: '8 Avenue de la Gare, 69000 Lyon',
    nombre_places: 100,
    places_disponibles: 67,
    tarif_horaire: 3,
    tarif_journalier: 18,
    tarif_mensuel: 150,
    horaire_ouverture: '05:00',
    horaire_fermeture: '00:00'
  }
];

const mockReservations = [
  {
    id: 1,
    parking_id: 1,
    parking_nom: 'Parking Centre-Ville',
    date_debut: '2025-01-15T10:00:00',
    date_fin: '2025-01-15T18:00:00',
    statut: 'confirmée',
    montant: 20
  }
];

// Service API
export const apiService = {
  /**
   * Connexion utilisateur
   */
  async login(email, password) {
    await delay(500);
    
    const user = mockUsers[email];
    if (user && user.password === password) {
      return {
        success: true,
        token: user.token,
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          reservations: user.reservations,
          stationnements: user.stationnements,
          typeAbonnement: user.typeAbonnement,
          debutAbonnement: user.debutAbonnement,
          finAbonnement: user.finAbonnement
        }
      };
    }
    
    throw new Error('Email ou mot de passe incorrect');
  },

  /**
   * Inscription utilisateur
   */
  async register(userData) {
    await delay(500);
    
    // Simuler une inscription réussie
    const newUser = {
      id: Date.now(),
      ...userData,
      token: `mock-token-${userData.role}-${Date.now()}`,
      reservations: [],
      stationnements: [],
      typeAbonnement: 'gratuit', // Par défaut, tous les nouveaux utilisateurs sont en mode gratuit
      debutAbonnement: null,
      finAbonnement: null
    };
    
    mockUsers[userData.email] = newUser;
    
    return {
      success: true,
      message: 'Compte créé avec succès',
      token: newUser.token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        role: newUser.role,
        reservations: newUser.reservations,
        stationnements: newUser.stationnements,
        typeAbonnement: newUser.typeAbonnement,
        debutAbonnement: newUser.debutAbonnement,
        finAbonnement: newUser.finAbonnement
      }
    };
  },

  /**
   * Récupérer les réservations de l'utilisateur
   */
  async getReservations(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    return {
      success: true,
      reservations: mockReservations
    };
  },

  /**
   * Récupérer les stationnements actifs de l'utilisateur
   */
  async getStationnements(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    // Simuler les stationnements actifs
    return {
      success: true,
      stationnements: mockReservations.filter(r => r.statut === 'confirmée')
    };
  },

  /**
   * Récupérer les abonnements de l'utilisateur
   */
  async getAbonnements(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    return {
      success: true,
      abonnements: []
    };
  },

  /**
   * Récupérer les parkings du propriétaire
   */
  async getOwnerParkings(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    return {
      success: true,
      parkings: mockParkings
    };
  },

  /**
   * Ajouter un parking (propriétaire)
   */
  async addParking(token, parkingData) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    const newParking = {
      id: Date.now(),
      ...parkingData,
      places_disponibles: parkingData.nombre_places
    };
    
    mockParkings.push(newParking);
    
    return {
      success: true,
      parking: newParking
    };
  },

  /**
   * Récupérer les détails d'un parking
   */
  async getParkingDetails(parkingId) {
    await delay(500);
    
    const parking = mockParkings.find(p => p.id === parseInt(parkingId));
    
    if (!parking) {
      throw new Error('Parking non trouvé');
    }
    
    return {
      success: true,
      parking
    };
  },

  /**
   * Réserver un parking
   */
  async reserveParking(token, parkingId, reservationData) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    const parking = mockParkings.find(p => p.id === parseInt(parkingId));
    
    if (!parking) {
      throw new Error('Parking non trouvé');
    }
    
    const newReservation = {
      id: Date.now(),
      parking_id: parkingId,
      parking_nom: parking.nom,
      ...reservationData,
      statut: 'confirmée'
    };
    
    mockReservations.push(newReservation);
    
    return {
      success: true,
      reservation: newReservation
    };
  },

  /**
   * Récupérer les revenus mensuels (propriétaire)
   */
  async getMonthlyRevenue(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    return {
      success: true,
      revenus_mensuels: 2450.50
    };
  },

  /**
   * Récupérer les réservations en cours (propriétaire)
   */
  async getActiveReservations(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    return {
      success: true,
      reservations_en_cours: 12
    };
  },

  /**
   * Récupérer les stationnements actifs (propriétaire)
   */
  async getActiveStationnements(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    return {
      success: true,
      stationnements_actifs: 8
    };
  },

  /**
   * Récupérer les informations complètes de l'utilisateur
   */
  async getUserProfile(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    // Trouver l'utilisateur par son token
    const user = Object.values(mockUsers).find(u => u.token === token);
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        reservations: user.reservations,
        stationnements: user.stationnements,
        typeAbonnement: user.typeAbonnement,
        debutAbonnement: user.debutAbonnement,
        finAbonnement: user.finAbonnement
      }
    };
  },

  /**
   * Mettre à niveau l'abonnement de l'utilisateur
   */
  async upgradeAbonnement(token, typeAbonnement, dureeEnMois = 1) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    // Trouver l'utilisateur par son token
    const user = Object.values(mockUsers).find(u => u.token === token);
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Calculer les dates de début et fin
    const debutAbonnement = new Date().toISOString().split('T')[0];
    const finDate = new Date();
    finDate.setMonth(finDate.getMonth() + dureeEnMois);
    const finAbonnement = finDate.toISOString().split('T')[0];
    
    // Mettre à jour l'utilisateur
    user.typeAbonnement = typeAbonnement;
    user.debutAbonnement = debutAbonnement;
    user.finAbonnement = finAbonnement;
    
    return {
      success: true,
      message: `Abonnement ${typeAbonnement} activé avec succès`,
      user: {
        typeAbonnement: user.typeAbonnement,
        debutAbonnement: user.debutAbonnement,
        finAbonnement: user.finAbonnement
      }
    };
  }
};

// Fonction helper pour les appels API réels (à utiliser quand le backend sera connecté)
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur API');
    }
    
    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

