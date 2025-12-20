// src/services/apiService.js

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8001/api";

/**
 * Petite util pour construire une query string propre
 */
function withQuery(path, query) {
  if (!query || Object.keys(query).length === 0) return path;

  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.append(k, String(v));
  });

  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/**
 * Parse JSON si possible, sinon texte (utile pour /invoice)
 */
async function parsePayload(res) {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  if (isJson) return res.json().catch(() => null);
  return res.text().catch(() => null);
}

/**
 * Request générique.
 * - credentials: include => cookies JWT
 * - auto refresh si 401 (une seule fois)
 */
async function request(path, { method = "GET", body, headers, raw = false, _retried = false } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 => tentative refresh UNE fois
  if (res.status === 401 && !_retried && !path.startsWith("/auth/refresh")) {
    try {
      await request("/auth/refresh", { method: "POST", _retried: true });
      return request(path, { method, body, headers, raw, _retried: true });
    } catch {
      const err = new Error("Session expirée");
      err.status = 401;
      throw err;
    }
  }

  // Si raw demandé (ex: invoice HTML), on renvoie direct le texte
  if (raw) {
    if (!res.ok) {
      const payload = await parsePayload(res);
      const err = new Error(
        (payload && (payload.message || payload.error)) || res.statusText
      );
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return res.text();
  }

  const payload = await parsePayload(res);

  if (!res.ok) {
    const err = new Error(
      (payload && (payload.message || payload.error)) || res.statusText
    );
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const apiService = {
  // =====================
  // AUTH
  // =====================

  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  register(userData) {
    // userData: { email, password, firstname, lastname, role }
    return request("/auth/register", {
      method: "POST",
      body: userData,
    });
  },

  refreshToken() {
    return request("/auth/refresh", { method: "POST" });
  },

  logout() {
    return request("/auth/logout", { method: "POST" });
  },

  me() {
    return request("/me", { method: "GET" });
  },

  // =====================
  // PARKINGS (strict: selon ton bootstrap)
  // =====================

getParkingDetails(id) {
  return request(withQuery("/parkings/details", { id }), { method: "GET" });
},

  searchParkings(lat, lng, radius, startAt, endAt) {
  return request(
    withQuery("/parkings/search", { lat, lng, radius, start_at: startAt, end_at: endAt }),
    { method: "GET" }
  );
},
  checkAvailability(parkingId, startAt, endAt) {
    return request(
      withQuery("/parkings/availability", {
        parking_id: parkingId,
        start_at: startAt,
        end_at: endAt,
      }),
      { method: "GET" }
    );
  },

  getOccupancyNow() {
    return request("/parkings/occupancy-now", { method: "GET" });
  },



  // =====================
  // RESERVATIONS
  // =====================

  createReservation(reservationData) {
    // adapte le payload EXACT au backend (parking_id, start_at, end_at, vehicle_type etc.)
    return request("/reservations", {
      method: "POST",
      body: reservationData,
    });
  },

  getMyReservations() {
    return request("/reservations/me", { method: "GET" });
  },

  enterReservation(id) {
    return request(`/reservations/${id}/enter`, { method: "POST" });
  },

  exitReservation(id) {
    return request(`/reservations/${id}/exit`, { method: "POST" });
  },

  getInvoiceHtml(id) {
    // backend renvoie du HTML
    return request(`/reservations/${id}/invoice`, { method: "GET", raw: true });
  },

  // =====================
  // SUBSCRIPTIONS
  // =====================

  createSubscription(subscriptionData) {
    return request("/subscriptions", {
      method: "POST",
      body: subscriptionData,
    });
  },

  getMySubscriptions() {
    return request("/subscriptions/me", { method: "GET" });
  },

  // =====================
  // OWNER
  // =====================

// OWNER

getOwnerParkings() {
  return request("/owner/parkings", { method: "GET" });
},
getOwnerParkingById(id) {
  return this.getOwnerParkings().then((res) => {
    const list = res?.parkings ?? res?.data ?? (Array.isArray(res) ? res : []);
    return list.find((p) => Number(p.id) === Number(id)) || null;
  });
},

createOwnerParking(parkingData) {
  // parkingData: { latitude, longitude, capacity, hourly_rate, opening_time, closing_time }
  return request("/owner/parkings", {
    method: "POST",
    body: parkingData,
  });
},


  getOwnerParkingReservations(id, { from, to } = {}) {
    return request(
      withQuery(`/owner/parkings/${id}/reservations`, { from, to }),
      { method: "GET" }
    );
  },

  getOwnerActiveStationnements(id) {
    return request(`/owner/parkings/${id}/stationnements/active`, { method: "GET" });
  },

  getOwnerMonthlyRevenue(id, month /* YYYY-MM */) {
    return request(withQuery(`/owner/parkings/${id}/revenue`, { month }), { method: "GET" });
  },
};
