/**
 * Service API simulé pour les appels backend
 * Système de réservation complet et fonctionnel
 */

const API_BASE_URL = 'http://localhost:8001/api';

// Simuler un délai de réponse réseau
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Stockage global des réservations (simulé)
let globalReservations = [];
let reservationIdCounter = 1;

// Fonction pour charger les utilisateurs depuis localStorage
const loadUsersFromStorage = () => {
  try {
    const stored = localStorage.getItem('mockUsers');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Erreur chargement utilisateurs depuis localStorage:', e);
  }
  return null;
};

// Fonction pour sauvegarder les utilisateurs dans localStorage
const saveUsersToStorage = (users) => {
  try {
    localStorage.setItem('mockUsers', JSON.stringify(users));
  } catch (e) {
    console.error('Erreur sauvegarde utilisateurs dans localStorage:', e);
  }
};

// Utilisateurs par défaut
const defaultUsers = {
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

// Fonction pour initialiser mockUsers
const initializeMockUsers = () => {
  const stored = loadUsersFromStorage();
  if (stored) {
    // Fusionner les utilisateurs stockés avec les défauts (les défauts ont priorité)
    return { ...stored, ...defaultUsers };
  }
  return { ...defaultUsers };
};

// Initialiser mockUsers
let mockUsers = initializeMockUsers();

// Sauvegarder les utilisateurs par défaut si localStorage est vide
if (!loadUsersFromStorage()) {
  saveUsersToStorage(mockUsers);
}

// Fonction pour mettre à jour mockUsers et sauvegarder
const updateMockUsers = (email, user) => {
  mockUsers[email] = user;
  saveUsersToStorage(mockUsers);
  return mockUsers;
};

const mockParkings = [
  {
    id: 1,
    nom: 'Parking Opéra Premium',
    adresse: '15 Rue Scribe, 75009 Paris',
    ville: 'Paris',
    latitude: 48.8706,
    longitude: 2.3319,
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
    latitude: 48.8584,
    longitude: 2.3470,
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
    latitude: 48.8809,
    longitude: 2.3553,
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
    latitude: 48.8756,
    longitude: 2.3262,
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
    latitude: 48.8522,
    longitude: 2.3697,
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
    latitude: 45.7606,
    longitude: 4.8564,
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
    latitude: 45.7578,
    longitude: 4.8320,
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
    latitude: 43.2965,
    longitude: 5.3698,
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

// === FONCTIONS UTILITAIRES ===

/**
 * Calculer le prix exact selon la durée
 */
const calculatePrice = (parking, dateDebut, dateFin) => {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diffMs = fin - debut;
  const diffMinutes = diffMs / (1000 * 60);
  const diffHeures = diffMinutes / 60;
  const diffJours = diffHeures / 24;

  // Si moins de 24h, tarif horaire
  if (diffJours < 1) {
    const heures = Math.ceil(diffHeures);
    return parseFloat((heures * parking.tarif_horaire).toFixed(2));
  }
  
  // Si entre 1 et 30 jours, tarif journalier
  if (diffJours <= 30) {
    const jours = Math.ceil(diffJours);
    return parseFloat((jours * parking.tarif_journalier).toFixed(2));
  }
  
  // Si plus de 30 jours, tarif mensuel
  const mois = Math.ceil(diffJours / 30);
  return parseFloat((mois * parking.tarif_mensuel).toFixed(2));
};

/**
 * Vérifier si deux périodes se chevauchent
 */
const periodsOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

/**
 * Trouver l'utilisateur par token
 */
const findUserByToken = (token) => {
  if (!token) {
    console.error('❌ Token manquant dans findUserByToken');
    return null;
  }
  
  // Chercher dans tous les utilisateurs
  const allUsers = Object.values(mockUsers);
  
  // Log pour debug
  console.log('🔍 Recherche utilisateur avec token:', token);
  console.log('📋 Nombre d\'utilisateurs:', allUsers.length);
  
  const user = allUsers.find(u => {
    if (!u || !u.token) return false;
    return u.token === token;
  });
  
  if (!user) {
    console.error('❌ Token non trouvé:', token);
    console.error('📋 Tokens disponibles:', allUsers.map(u => ({ email: u?.email, token: u?.token })));
    console.error('👥 Utilisateurs disponibles:', Object.keys(mockUsers));
    
    // Essayer de trouver par email depuis localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const savedUser = JSON.parse(userStr);
        const userByEmail = mockUsers[savedUser.email];
        if (userByEmail) {
          console.log('✅ Utilisateur trouvé par email, mise à jour du token');
          // Mettre à jour le token dans localStorage
          localStorage.setItem('token', userByEmail.token);
          return userByEmail;
        }
      }
    } catch (e) {
      console.error('Erreur lors de la récupération depuis localStorage:', e);
    }
    
    return null;
  }
  
  console.log('✅ Utilisateur trouvé:', user.email);
  return user;
};

/**
 * Calculer les places réellement disponibles pour une période
 */
const getAvailablePlaces = (parkingId, dateDebut, dateFin, excludeReservationId = null) => {
  const parking = mockParkings.find(p => p.id === parseInt(parkingId));
  if (!parking) return 0;

  // Compter les réservations actives qui se chevauchent avec la période demandée
  const overlappingReservations = globalReservations.filter(r => {
    if (r.parking_id !== parkingId) return false;
    if (r.statut === 'annulée') return false;
    if (excludeReservationId && r.id === excludeReservationId) return false;
    
    return periodsOverlap(
      new Date(r.date_debut),
      new Date(r.date_fin),
      new Date(dateDebut),
      new Date(dateFin)
    );
  });

  return parking.nombre_places - overlappingReservations.length;
};

// === SERVICE API ===

export const apiService = {
  /**
   * Connexion utilisateur
   */
  async login(email, password) {
    await delay(500);
    
    // Recharger les utilisateurs depuis localStorage à chaque connexion
    const storedUsers = loadUsersFromStorage();
    if (storedUsers) {
      // Fusionner avec les défauts (défauts en priorité)
      mockUsers = { ...storedUsers, ...defaultUsers };
    }
    
    // Normaliser l'email
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('🔍 Tentative de connexion:', normalizedEmail);
    console.log('📋 Utilisateurs disponibles:', Object.keys(mockUsers));
    console.log('📦 Utilisateurs complets:', mockUsers);
    
    const user = mockUsers[normalizedEmail];
    
    if (!user) {
      console.error('❌ Utilisateur non trouvé:', normalizedEmail);
      console.error('📋 Tous les emails disponibles:', Object.keys(mockUsers));
      console.error('📦 Contenu localStorage:', localStorage.getItem('mockUsers'));
      throw new Error('Email ou mot de passe incorrect');
    }
    
    console.log('✅ Utilisateur trouvé:', user.email);
    console.log('🔑 Comparaison mot de passe:', {
      entré: password,
      longueur_entré: password.length,
      stocké: user.password,
      longueur_stocké: user.password ? user.password.length : 0,
      match: user.password === password,
      type_entré: typeof password,
      type_stocké: typeof user.password
    });
    
    if (!user.password || user.password !== password) {
      console.error('❌ Mot de passe incorrect ou manquant');
      console.error('Détails utilisateur:', {
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
      throw new Error('Email ou mot de passe incorrect');
    }
    
    // Charger les réservations de l'utilisateur
    const userReservations = globalReservations.filter(r => r.user_id === user.id);
    
    console.log('✅ Connexion réussie:', normalizedEmail, 'Token:', user.token);
    
    return {
      success: true,
      token: user.token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        reservations: userReservations,
        stationnements: user.stationnements,
        typeAbonnement: user.typeAbonnement,
        debutAbonnement: user.debutAbonnement,
        finAbonnement: user.finAbonnement
      }
    };
  },

  /**
   * Inscription utilisateur
   */
  async register(userData) {
    await delay(500);
    
    // Normaliser l'email
    const email = userData.email.trim().toLowerCase();
    
    console.log('📝 Inscription en cours pour:', email);
    console.log('📋 Utilisateurs existants:', Object.keys(mockUsers));
    
    // Vérifier si l'email existe déjà
    if (mockUsers[email]) {
      console.error('❌ Email déjà utilisé:', email);
      throw new Error('Cet email est déjà utilisé');
    }
    
    // Générer un token unique
    const userId = Date.now();
    const token = `mock-token-${userData.role}-${userId}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newUser = {
      id: userId,
      email: email,
      password: userData.password, // Sauvegarder le mot de passe tel quel
      firstname: userData.firstname.trim(),
      lastname: userData.lastname.trim(),
      role: userData.role,
      token: token,
      reservations: [],
      stationnements: [],
      typeAbonnement: 'gratuit',
      debutAbonnement: null,
      finAbonnement: null
    };
    
    // Sauvegarder l'utilisateur
    updateMockUsers(email, newUser);
    
    console.log('✅ Nouvel utilisateur créé:', {
      email: email,
      token: token,
      password: userData.password,
      passwordLength: userData.password.length,
      role: userData.role
    });
    console.log('📋 Tous les utilisateurs maintenant:', Object.keys(mockUsers));
    console.log('📦 Utilisateur sauvegardé dans localStorage');
    
    // Vérifier que l'utilisateur est bien sauvegardé
    const verify = loadUsersFromStorage();
    if (verify && verify[email]) {
      console.log('✅ Vérification: utilisateur bien sauvegardé dans localStorage');
    } else {
      console.error('❌ ERREUR: utilisateur non sauvegardé dans localStorage!');
    }
    
    return {
      success: true,
      message: 'Compte créé avec succès',
      token: token,
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
   * Rechercher des parkings avec disponibilité en temps réel
   */
  async searchParkings(searchParams = {}) {
    await delay(800);
    
    let results = JSON.parse(JSON.stringify(mockParkings)); // Deep copy
    
    // Si des dates sont fournies, calculer la disponibilité réelle
    if (searchParams.dateDebut && searchParams.dateFin) {
      results = results.map(parking => {
        const placesDispos = getAvailablePlaces(
          parking.id,
          searchParams.dateDebut,
          searchParams.dateFin
        );
        
        return {
          ...parking,
          places_disponibles: placesDispos
        };
      });
    }
    
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
   * Vérifier la disponibilité d'un parking pour une période
   */
  async checkAvailability(parkingId, dateDebut, dateFin) {
    await delay(300);
    
    const parking = mockParkings.find(p => p.id === parseInt(parkingId));
    if (!parking) {
      throw new Error('Parking non trouvé');
    }
    
    const placesDispos = getAvailablePlaces(parkingId, dateDebut, dateFin);
    
    return {
      success: true,
      available: placesDispos > 0,
      places_disponibles: placesDispos,
      parking
    };
  },

  /**
   * Réserver un parking (avec toutes les validations)
   */
  async reserveParking(token, parkingId, reservationData) {
    await delay(500);
    
    if (!token) {
      throw new Error('Vous devez être connecté pour réserver');
    }
    
    // Trouver l'utilisateur
    const user = findUserByToken(token);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Trouver le parking
    const parking = mockParkings.find(p => p.id === parseInt(parkingId));
    if (!parking) {
      throw new Error('Parking non trouvé');
    }
    
    const { date_debut, date_fin, vehicule, immatriculation } = reservationData;
    
    // === VALIDATIONS ===
    
    // 1. Vérifier que les dates sont valides
    const now = new Date();
    const debut = new Date(date_debut);
    const fin = new Date(date_fin);
    
    if (debut < now) {
      throw new Error('La date de début ne peut pas être dans le passé');
    }
    
    if (fin <= debut) {
      throw new Error('La date de fin doit être après la date de début');
    }
    
    const diffMs = fin - debut;
    const diffMinutes = diffMs / (1000 * 60);
    
    if (diffMinutes < 30) {
      throw new Error('La durée minimum de réservation est de 30 minutes');
    }
    
    // 2. Vérifier qu'il n'y a pas de chevauchement avec une autre réservation de cet utilisateur
    const debutReservation = new Date(date_debut);
    const finReservation = new Date(date_fin);
    
    const overlappingReservations = globalReservations.filter(r => {
      if (r.user_id !== user.id) return false;
      if (r.statut === 'annulée') return false;
      
      const rDebut = new Date(r.date_debut);
      const rFin = new Date(r.date_fin);
      
      // Vérifier si les périodes se chevauchent
      return periodsOverlap(debutReservation, finReservation, rDebut, rFin);
    });
    
    if (overlappingReservations.length > 0) {
      const conflict = overlappingReservations[0];
      const conflictDebut = new Date(conflict.date_debut).toLocaleString('fr-FR');
      const conflictFin = new Date(conflict.date_fin).toLocaleString('fr-FR');
      throw new Error(`Vous avez déjà une réservation du ${conflictDebut} au ${conflictFin}. Vous ne pouvez pas réserver deux places en même temps.`);
    }
    
    // 3. Vérifier la disponibilité
    const placesDispos = getAvailablePlaces(parkingId, date_debut, date_fin);
    
    if (placesDispos <= 0) {
      throw new Error('Ce parking n\'a plus de places disponibles pour cette période');
    }
    
    // 4. Vérifier que le type de véhicule est accepté
    if (!parking.type_vehicules.includes(vehicule)) {
      throw new Error(`Ce parking n'accepte pas les ${vehicule}`);
    }
    
    // === CALCUL DU PRIX ===
    const montant = calculatePrice(parking, date_debut, date_fin);
    
    // === CRÉER LA RÉSERVATION ===
    const newReservation = {
      id: reservationIdCounter++,
      user_id: user.id,
      user_nom: `${user.firstname} ${user.lastname}`,
      user_email: user.email,
      parking_id: parkingId,
      parking_nom: parking.nom,
      parking_adresse: parking.adresse,
      date_debut: date_debut,
      date_fin: date_fin,
      vehicule: vehicule,
      immatriculation: immatriculation || null,
      montant: montant,
      statut: 'confirmée',
      date_creation: new Date().toISOString()
    };
    
    // Ajouter aux réservations globales
    globalReservations.push(newReservation);
    
    return {
      success: true,
      message: 'Réservation confirmée avec succès !',
      reservation: newReservation
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
    
    const user = findUserByToken(token);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Récupérer toutes les réservations de l'utilisateur
    const userReservations = globalReservations.filter(r => r.user_id === user.id);
    
    // Trier par date (plus récentes en premier)
    userReservations.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    
    return {
      success: true,
      reservations: userReservations
    };
  },

  /**
   * Annuler une réservation
   */
  async cancelReservation(token, reservationId) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    const user = findUserByToken(token);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Trouver la réservation
    const reservation = globalReservations.find(r => r.id === reservationId);
    
    if (!reservation) {
      throw new Error('Réservation non trouvée');
    }
    
    // Vérifier que c'est bien la réservation de cet utilisateur
    if (reservation.user_id !== user.id) {
      throw new Error('Vous ne pouvez pas annuler cette réservation');
    }
    
    // Vérifier que la réservation n'est pas déjà annulée
    if (reservation.statut === 'annulée') {
      throw new Error('Cette réservation est déjà annulée');
    }
    
    // Vérifier qu'on peut encore annuler (pas dans le passé)
    const now = new Date();
    const debut = new Date(reservation.date_debut);
    
    if (debut < now) {
      throw new Error('Impossible d\'annuler une réservation déjà commencée');
    }
    
    // Annuler la réservation (cela libère automatiquement la place)
    reservation.statut = 'annulée';
    reservation.date_annulation = new Date().toISOString();
    
    return {
      success: true,
      message: 'Réservation annulée avec succès',
      reservation
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
   * Récupérer les stationnements actifs de l'utilisateur
   */
  async getStationnements(token) {
    await delay(500);
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    const user = findUserByToken(token);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    const now = new Date();
    
    // Réservations en cours (commencées mais pas encore terminées)
    const stationnements = globalReservations.filter(r => 
      r.user_id === user.id &&
      r.statut === 'confirmée' &&
      new Date(r.date_debut) <= now &&
      new Date(r.date_fin) > now
    );
    
    return {
      success: true,
      stationnements
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
    
    const now = new Date();
    const activeCount = globalReservations.filter(r => 
      r.statut === 'confirmée' &&
      new Date(r.date_fin) > now
    ).length;
    
    return {
      success: true,
      reservations_en_cours: activeCount
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
    
    const now = new Date();
    const activeCount = globalReservations.filter(r => 
      r.statut === 'confirmée' &&
      new Date(r.date_debut) <= now &&
      new Date(r.date_fin) > now
    ).length;
    
    return {
      success: true,
      stationnements_actifs: activeCount
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
    
    const user = findUserByToken(token);
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Charger les réservations de l'utilisateur
    const userReservations = globalReservations.filter(r => r.user_id === user.id);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        reservations: userReservations,
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
    
    const user = findUserByToken(token);
    
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
