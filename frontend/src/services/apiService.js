// frontend/src/services/apiService.js
const API_BASE_URL = "http://localhost:8001";

async function readJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function handleResponse(res) {
  const data = await readJsonSafe(res);

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `API error (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/**
 * Fetch helper:
 * - always sends cookies
 * - on 401 tries refresh once, then retries request once
 */
async function authFetch(path, options = {}, retry = true) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
  });

  if (res.status === 401 && retry) {
    const ok = await apiService.refresh();
    if (!ok) return res;
    return authFetch(path, options, false);
  }

  return res;
}

export const apiService = {
  // ---------- AUTH ----------
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse(res);

    // Si ton back renvoie un statut 2FA, tu peux le gérer ici plus tard
    if (data?.status === "2fa_required") {
      return { status: "2fa_required" };
    }

    const meRes = await authFetch("/api/me", { method: "GET" });
    const me = await handleResponse(meRes);

    return {
      success: true,
      user: {
        id: me.id,
        email: me.email,
        firstname: me.firstname ?? null,
        lastname: me.lastname ?? null,
        role: me.role ? String(me.role).toLowerCase().trim() : "user",
      },
    };
  },

  async register({ firstname, lastname, email, password, role }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firstname,
        lastname,
        email,
        password,
        role: role === "owner" ? "OWNER" : "USER",
      }),
    });

    await handleResponse(res);

    const meRes = await authFetch("/api/me", { method: "GET" });
    const me = await handleResponse(meRes);

    return {
      success: true,
      user: {
        id: me.id,
        email: me.email,
        firstname: me.firstname ?? null,
        lastname: me.lastname ?? null,
        role: me.role ? String(me.role).toLowerCase().trim() : "user",
      },
    };
  },

  async getCurrentUser() {
    const res = await authFetch("/api/me", { method: "GET" });
    if (res.status === 401) return null;

    const me = await handleResponse(res);
    return {
      id: me.id,
      email: me.email,
      firstname: me.firstname ?? null,
      lastname: me.lastname ?? null,
      role: me.role ? String(me.role).toLowerCase().trim() : "user",
    };
  },

  async refresh() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      await handleResponse(res);
      return true;
    } catch {
      return false;
    }
  },

  async logout() {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },

  // ---------- RESERVATIONS ----------
  async createReservation({ parkingId, startAt, endAt, vehicleType, amount }) {
    const res = await authFetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parking_id: parkingId,
        start_at: startAt,
        end_at: endAt,
        vehicle_type: vehicleType,
        amount,
      }),
    });
    return handleResponse(res);
  },

  async getMyReservations() {
    const res = await authFetch("/api/reservations/me", { method: "GET" });
    return handleResponse(res);
  },

  // ---------- PARKINGS (à brancher selon tes routes réelles) ----------
  async searchParkings(query = {}) {
    const qs = new URLSearchParams(query).toString();
    const res = await authFetch(`/api/parkings${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
    return handleResponse(res);
  },

  async getParkingDetails(id) {
    const res = await authFetch(`/api/parkings/${id}`, { method: "GET" });
    return handleResponse(res);
  },
};

export default apiService;
