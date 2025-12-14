<<<<<<< HEAD
// frontend/src/services/apiService.js
const API_BASE_URL = "http://localhost:8001";

async function handleResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // certains endpoints peuvent ne pas renvoyer de JSON
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Erreur API (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * Helper interne :
 * - fait le fetch avec credentials: "include"
 * - sur 401, tente un refresh puis rejoue la requête une fois
 */
async function authFetch(path, options = {}, retry = true) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
  });

  if (res.status === 401 && retry) {
    // tentative de refresh silencieux
    const refreshed = await apiService.refresh();
    if (!refreshed) {
      return res; // token mort, on laisse la 401
    }

    // on rejoue la requête UNE seule fois
    return authFetch(path, options, false);
  }

  return res;
}

=======
const API_BASE_URL = 'http://localhost:8001/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = (data && data.error) || response.statusText;
    throw new Error(error);
  }
  return data;
};

>>>>>>> origin/Rayane
export const apiService = {
  /**
   * Connexion utilisateur :
   * - POST /api/auth/login
   * - puis /api/me via authFetch (token fraîchement posé)
   */
  async login(email, password) {
<<<<<<< HEAD
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse(res);

    if (data.status === "2fa_required") {
      throw new Error(
        "Double authentification requise (2FA), pas encore gérée côté interface."
      );
    }

    const meRes = await authFetch("/api/me", {
      method: "GET",
    });

    const me = await handleResponse(meRes);

    return {
      success: true,
      user: {
        id: me.id,
        email: me.email,
        firstname: me.firstname,
        lastname: me.lastname,
        role: me.role ? me.role.toLowerCase().trim() : "user",

      },
    };
  },

  /**
   * Inscription :
   * - POST /api/auth/register
   * - puis login auto
   */
  async register(form) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
        role: form.role === "owner" ? "OWNER" : "USER",
      }),
    });

    const data = await handleResponse(res);

    // le back pose déjà les cookies ici.
    // maintenant on récupère /api/me comme dans login()
    const meRes = await authFetch("/api/me", { method: "GET" });
    const me = await handleResponse(meRes);

    return {
      success: true,
      user: {
        id: me.id,
        email: me.email,
        role: me.role ? me.role.toLowerCase().trim() : "user",
        firstname: me.firstname,
        lastname: me.lastname,
      },
    };
  }
  ,

  /**
   * Récupère l'utilisateur courant :
   * - GET /api/me
   * - si 401 → tente un refresh → rejoue /api/me
   * - si toujours 401 → retourne null
   */
  async getCurrentUser() {
    const res = await authFetch("/api/me", { method: "GET" });

    if (res.status === 401) {
      return null;
    }

    const me = await handleResponse(res);

    return {
      id: me.id,
      email: me.email,
      firstname: me.firstname ?? null,
      lastname: me.lastname ?? null,
      role: me.role ? me.role.toLowerCase().trim() : "user",
    };
  },

  /**
   * Appelle /api/auth/refresh pour obtenir un nouveau ACCESS_TOKEN
   * Retourne true si ça a marché, false sinon.
   */
  async refresh() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      try {
        await handleResponse(res);
        return true;
      } catch {
        return false;
      }

    } catch {
      return false;
=======
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
>>>>>>> origin/Rayane
    }
  },

  /**
<<<<<<< HEAD
   * Déconnexion : purge les cookies côté back
   */
  async logout() {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },
};

export default apiService;
=======
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
>>>>>>> origin/Rayane
