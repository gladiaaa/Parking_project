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
    nom: 'Parking Opéra Premium',
    adresse: '15 Rue Scribe, 75009 Paris',
    ville: 'Paris',
    nombre_places: 150,
    places_disponibles: 87,
    tarif_horaire: 3.5,
    tarif_journalier: 25,
    tarif_mensuel: 280,
    horaire_ouverture: '00:00',
    horaire_fermeture: '23:59',
    services: ['Couvert', 'Sécurisé', 'Vidéo-surveillance', 'Bornes électriques'],
    distance: '0.5 km',
    note: 4.8,
    image: '/images/parking1.jpg',
    type_vehicules: ['Voiture', 'Moto', 'Vélo']
  },
  {
    id: 2,
    nom: 'Station Châtelet',
    adresse: '1 Place du Châtelet, 75001 Paris',
    ville: 'Paris',
    nombre_places: 200,
    places_disponibles: 142,
    tarif_horaire: 4,
    tarif_journalier: 30,
    tarif_mensuel: 320,
    horaire_ouverture: '00:00',
    horaire_fermeture: '23:59',
    services: ['Couvert', 'Gardé', 'Vidéo-surveillance', 'Accessible PMR'],
    distance: '0.8 km',
    note: 4.9,
    image: '/images/parking2.jpg',
    type_vehicules: ['Voiture', 'Moto']
  },
  {
    id: 3,
    nom: 'Parking Gare du Nord',
    adresse: '18 Rue de Dunkerque, 75010 Paris',
    ville: 'Paris',
    nombre_places: 300,
    places_disponibles: 201,
    tarif_horaire: 3,
    tarif_journalier: 22,
    tarif_mensuel: 250,
    horaire_ouverture: '00:00',
    horaire_fermeture: '23:59',
    services: ['Couvert', 'Sécurisé', 'Lavage auto', 'Bornes électriques'],
    distance: '1.2 km',
    note: 4.6,
    image: '/images/parking3.jpg',
    type_vehicules: ['Voiture', 'Moto', 'Vélo', 'Trottinette']
  },
  {
    id: 4,
    nom: 'Park Saint-Lazare',
    adresse: '108 Rue Saint-Lazare, 75008 Paris',
    ville: 'Paris',
    nombre_places: 120,
    places_disponibles: 45,
    tarif_horaire: 4.5,
    tarif_journalier: 35,
    tarif_mensuel: 350,
    horaire_ouverture: '06:00',
    horaire_fermeture: '22:00',
    services: ['Couvert', 'Gardé', 'Vidéo-surveillance'],
    distance: '1.5 km',
    note: 4.7,
    image: '/images/parking4.jpg',
    type_vehicules: ['Voiture']
  },
  {
    id: 5,
    nom: 'Parking Bastille Central',
    adresse: '120 Rue de Lyon, 75012 Paris',
    ville: 'Paris',
    nombre_places: 180,
    places_disponibles: 98,
    tarif_horaire: 3.2,
    tarif_journalier: 24,
    tarif_mensuel: 270,
    horaire_ouverture: '00:00',
    horaire_fermeture: '23:59',
    services: ['Couvert', 'Sécurisé', 'Accessible PMR', 'Bornes électriques'],
    distance: '2.0 km',
    note: 4.5,
    image: '/images/parking5.jpg',
    type_vehicules: ['Voiture', 'Moto', 'Vélo']
  },
  {
    id: 6,
    nom: 'Lyon Part-Dieu Premium',
    adresse: '21 Boulevard Vivier Merle, 69003 Lyon',
    ville: 'Lyon',
    nombre_places: 250,
    places_disponibles: 156,
    tarif_horaire: 2.8,
    tarif_journalier: 20,
    tarif_mensuel: 220,
    horaire_ouverture: '00:00',
    horaire_fermeture: '23:59',
    services: ['Couvert', 'Gardé', 'Vidéo-surveillance', 'Lavage auto'],
    distance: '0.3 km',
    note: 4.9,
    image: '/images/parking6.jpg',
    type_vehicules: ['Voiture', 'Moto']
  },
  {
    id: 7,
    nom: 'Station Bellecour',
    adresse: '12 Place Bellecour, 69002 Lyon',
    ville: 'Lyon',
    nombre_places: 180,
    places_disponibles: 112,
    tarif_horaire: 3.5,
    tarif_journalier: 26,
    tarif_mensuel: 280,
    horaire_ouverture: '00:00',
    horaire_fermeture: '23:59',
    services: ['Couvert', 'Sécurisé', 'Bornes électriques'],
    distance: '0.6 km',
    note: 4.7,
    image: '/images/parking7.jpg',
    type_vehicules: ['Voiture', 'Moto', 'Vélo']
  },
  {
    id: 8,
    nom: 'Parking Vieux-Port',
    adresse: '46 Quai du Port, 13002 Marseille',
    ville: 'Marseille',
    nombre_places: 220,
    places_disponibles: 134,
    tarif_horaire: 3,
    tarif_journalier: 22,
    tarif_mensuel: 240,
    horaire_ouverture: '00:00',
    horaire_fermeture: '23:59',
    services: ['Couvert', 'Sécurisé', 'Vidéo-surveillance'],
    distance: '0.4 km',
    note: 4.6,
    image: '/images/parking8.jpg',
    type_vehicules: ['Voiture', 'Moto']
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
   * Rechercher des parkings
   */
  async searchParkings(searchParams = {}) {
    await delay(800);
    
    let results = [...mockParkings];
    
    // Filtrer par ville
    if (searchParams.ville) {
      results = results.filter(p => 
        p.ville.toLowerCase().includes(searchParams.ville.toLowerCase()) ||
        p.adresse.toLowerCase().includes(searchParams.ville.toLowerCase())
      );
    }
    
    // Filtrer par type de véhicule
    if (searchParams.vehicule) {
      results = results.filter(p => 
        p.type_vehicules.includes(searchParams.vehicule)
      );
    }
    
    // Filtrer par disponibilité
    if (searchParams.places_min) {
      results = results.filter(p => 
        p.places_disponibles >= parseInt(searchParams.places_min)
      );
    }
    
    // Trier les résultats
    if (searchParams.sort === 'prix_asc') {
      results.sort((a, b) => a.tarif_horaire - b.tarif_horaire);
    } else if (searchParams.sort === 'prix_desc') {
      results.sort((a, b) => b.tarif_horaire - a.tarif_horaire);
    } else if (searchParams.sort === 'note') {
      results.sort((a, b) => b.note - a.note);
    } else if (searchParams.sort === 'distance') {
      results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }
    
    return {
      success: true,
      parkings: results,
      total: results.length
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

