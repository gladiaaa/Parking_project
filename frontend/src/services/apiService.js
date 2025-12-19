const API_BASE_URL = 'http://localhost:8001/api';

const handleResponse = async (response) => {
  // Gestion automatique du refresh token si 401
  if (response.status === 401 && !response.url.includes('/auth/refresh')) {
    try {
      // Tentative de refresh
      await apiService.refreshToken();
      // On rejoue la requête initiale (attention aux boucles infinies, à gérer dans l'implémentation finale)
      // Pour l'instant on throw pour que le composant redirige vers login
      throw new Error('Session expirée');
    } catch (e) {
      throw new Error('Session expirée');
    }
  }

  const data = await response.json();
  if (!response.ok) {
    const error = (data && data.error) || response.statusText;
    throw new Error(error);
  }
  return data;
};

export const apiService = {
  // --- AUTH ---

  /**
   * Connexion utilisateur
   * Payload: { email, password }
   * Retour: JWT via cookies (géré par le navigateur)
   */
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    // Pas de return de token ici car cookie
    return handleResponse(response);
  },

  /**
   * Inscription utilisateur
   * Payload: { email, password, firstname, lastname, role }
   */
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Refresh Token
   * À appeler automatiquement si 401
   */
  async refreshToken() {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Déconnexion
   */
  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Récupérer l'utilisateur courant
   * Retour: { id, email, role }
   */
  async me() {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // --- PARKINGS ---

  /**
   * Rechercher des parkings
   * Note: L'endpoint /parkings/availability n'est pas pour la recherche globale mais pour un parking spécifique
   * On garde l'endpoint existant s'il correspond, sinon on adapte selon la doc
   * Doc: GET /api/parkings/details?id={parkingId} -> Détail
   * Doc: GET /api/parkings/availability -> Dispo spécifique
   * Il manque un endpoint de recherche globale dans la doc fournie ("Recherche parkings" n'est pas explicite sur l'endpoint)
   * Je suppose que le backend a un endpoint GET /api/parkings (standard REST) comme vu dans le code précédent
   * Mais je dois suivre STRICTEMENT la doc fournie.
   * La doc dit:
   * GET /api/parkings/details?id={parkingId}
   * GET /api/parkings/availability
   * GET /api/parkings/occupancy-now
   * 
   * Elle ne mentionne PAS de GET /api/parkings pour la liste.
   * Cependant, le code précédent utilisait GET /api/parkings.
   * Je vais supposer que pour la liste, c'est GET /api/parkings (car sinon impossible de lister).
   * Si erreur 404, je le signalerai.
   */
  async searchParkings(params = {}) {
    const query = new URLSearchParams();
    if (params.ville) query.append('ville', params.ville);
    // Adaptation aux query params standards si besoin, ou on laisse tel quel si le backend le supporte
    const response = await fetch(`${API_BASE_URL}/parkings?${query.toString()}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Récupérer les détails d'un parking
   * Doc: GET /api/parkings/details?id={parkingId}
   */
  async getParkingDetails(id) {
    const response = await fetch(`${API_BASE_URL}/parkings/details?id=${id}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Vérifier la disponibilité
   * Doc: GET /api/parkings/availability
   * Query: parking_id, start_at, end_at
   */
  async checkAvailability(parkingId, startAt, endAt) {
    const query = new URLSearchParams({
      parking_id: parkingId,
      start_at: startAt,
      end_at: endAt
    });
    const response = await fetch(`${API_BASE_URL}/parkings/availability?${query.toString()}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Occupation actuelle
   * Doc: GET /api/parkings/occupancy-now
   */
  async getOccupancyNow() {
    const response = await fetch(`${API_BASE_URL}/parkings/occupancy-now`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // --- RESERVATIONS ---

  /**
   * Créer une réservation
   * Signature supportée: 
   * 1. (reservationData) -> { parkingId, date_debut, ... }
   * 2. (token, parkingId, data) -> compatibilité legacy
   */
  async reserveParking(arg1, arg2 = null, arg3 = null) {
    let reservationData = {};

    if (arg2 !== null && arg3 !== null) {
      // Cas legacy: (token, parkingId, data)
      reservationData = { 
        ...arg3, 
        parkingId: arg2 
      };
    } else {
      // Cas standard: (reservationData)
      reservationData = arg1;
    }

    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Mes réservations
   * Doc: GET /api/reservations/me
   */
  async getReservations() {
    const response = await fetch(`${API_BASE_URL}/reservations/me`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Entrer dans le parking
   * Doc: POST /api/reservations/{id}/enter
   */
  async enterReservation(id) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Sortir du parking
   * Doc: POST /api/reservations/{id}/exit
   */
  async exitReservation(id) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Facture
   * Doc: GET /api/reservations/{id}/invoice
   */
  async getInvoice(id) {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/invoice`, {
      credentials: 'include'
    });
    // Ici on retourne le blob ou le text car c'est du HTML/PDF potentiellement
    if (!response.ok) throw new Error('Erreur facture');
    return response.text();
  },

  // --- ABONNEMENTS ---

  /**
   * Créer un abonnement
   * Payload: { parking_id, start_date, months, weekly_slots }
   */
  async createSubscription(subscriptionData) {
    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Mes abonnements
   * Doc: GET /api/subscriptions/me
   */
  async getSubscriptions() {
    const response = await fetch(`${API_BASE_URL}/subscriptions/me`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // --- OWNER ---

  /**
   * Mes parkings (Owner)
   * Doc: GET /api/owner/parkings
   */
  async getOwnerParkings() {
    const response = await fetch(`${API_BASE_URL}/owner/parkings`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Créer un parking (Owner)
   * Doc: POST /api/owner/parkings
   */
  async createOwnerParking(parkingData) {
    const response = await fetch(`${API_BASE_URL}/owner/parkings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parkingData),
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Réservations d'un parking (Owner)
   * Doc: GET /api/owner/parkings/{id}/reservations
   */
  async getOwnerParkingReservations(id) {
    const response = await fetch(`${API_BASE_URL}/owner/parkings/${id}/reservations`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Stationnements actifs (Owner)
   * Doc: GET /api/owner/parkings/{id}/stationnements/active
   */
  async getOwnerActiveParkings(id) {
    const response = await fetch(`${API_BASE_URL}/owner/parkings/${id}/stationnements/active`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  /**
   * Revenus (Owner)
   * Doc: GET /api/owner/parkings/{id}/revenue?month=YYYY-MM
   */
  async getOwnerRevenue(id, month) {
    const response = await fetch(`${API_BASE_URL}/owner/parkings/${id}/revenue?month=${month}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  }
};
