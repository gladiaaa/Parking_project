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

export const apiService = {
  /**
   * Connexion utilisateur :
   * - POST /api/auth/login
   * - puis /api/me via authFetch (token fraîchement posé)
   */
  async login(email, password) {
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
    }
  },

  /**
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