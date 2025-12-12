const API_BASE_URL = 'http://localhost:8001/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = (data && data.error) || response.statusText;
    throw new Error(error);
  }
  return data;
};

export const apiService = {
  /**
   * Connexion utilisateur
   */
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  /**
   * Inscription utilisateur
   */
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  /**
   * Rechercher des parkings avec disponibilité en temps réel
   */
  async searchParkings(params = {}) {
    const query = new URLSearchParams();
    if (params.ville) query.append('ville', params.ville);
    if (params.vehicule) query.append('vehicule', params.vehicule);
    if (params.dateDebut) query.append('dateDebut', params.dateDebut);
    if (params.dateFin) query.append('dateFin', params.dateFin);
    if (params.sort) query.append('sort', params.sort);

    const response = await fetch(`${API_BASE_URL}/parkings?${query.toString()}`);
    return handleResponse(response);
  },

  /**
   * Récupérer les détails d'un parking
   */
  async getParkingDetails(id) {
    const response = await fetch(`${API_BASE_URL}/parkings/${id}`);
    return handleResponse(response);
  },

  /**
   * Vérifier la disponibilité d'un parking pour une période
   */
  async checkAvailability(parkingId, dateDebut, dateFin) {
    const response = await fetch(`${API_BASE_URL}/parkings/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parkingId, dateDebut, dateFin }),
    });
    return handleResponse(response);
  },

  /**
   * Réserver un parking
   */
  async reserveParking(token, parkingId, reservationData) {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        parkingId,
        ...reservationData
      }),
    });
    return handleResponse(response);
  },

  /**
   * Récupérer les réservations de l'utilisateur
   */
  async getReservations(token) {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },
  
  /**
   * Annuler une réservation
   */
  async cancelReservation(token, reservationId) {
      const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/cancel`, {
          method: 'POST',
           headers: {
            'Authorization': `Bearer ${token}`
          }
      });
      return handleResponse(response);
  },

  /**
   * Récupérer les stationnements actifs (dérivé des réservations)
   */
  async getStationnements(token) {
    try {
        const data = await this.getReservations(token);
        const now = new Date();
        const active = (data.reservations || []).filter(r => {
            const start = new Date(r.date_debut);
            const end = new Date(r.date_fin);
            return r.statut === 'confirmée' && start <= now && end >= now;
        });
        return { success: true, stationnements: active };
    } catch (error) {
        console.error("Erreur getStationnements:", error);
        return { success: false, stationnements: [] };
    }
  },

  /**
   * --- OWNER METHODS ---
   */
  async getOwnerParkings(token) {
    const response = await fetch(`${API_BASE_URL}/owner/parkings`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
  },

  async addParking(token, parkingData) {
    const response = await fetch(`${API_BASE_URL}/parkings`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parkingData)
    });
    return handleResponse(response);
  },

  async getMonthlyRevenue(token) {
      const response = await fetch(`${API_BASE_URL}/owner/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      return handleResponse(response);
  },

  async getActiveReservations(token) {
      const response = await fetch(`${API_BASE_URL}/owner/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      return handleResponse(response);
  },

  async getActiveStationnements(token) {
      const response = await fetch(`${API_BASE_URL}/owner/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      return handleResponse(response);
  }
};
