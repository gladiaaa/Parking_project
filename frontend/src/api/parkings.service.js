// src/services/parkings.service.js
import { apiService } from "./apiService";

/**
 * Helpers
 */
function toSqlDatetime(value) {
  // accepte Date | string, renvoie string
  if (!value) return "";
  if (value instanceof Date) {
    const pad = (n) => String(n).padStart(2, "0");
    const y = value.getFullYear();
    const m = pad(value.getMonth() + 1);
    const d = pad(value.getDate());
    const hh = pad(value.getHours());
    const mm = pad(value.getMinutes());
    const ss = pad(value.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  return String(value);
}

function normalizeParking(p) {
  if (!p || typeof p !== "object") return p;

  return {
    ...p,
    // alias de confort (au cas où tu as encore du legacy dans certains composants)
    adresse: p.address ?? p.adresse,
    nombre_places: p.capacity ?? p.nombre_places,
    tarif_horaire: p.hourly_rate ?? p.tarif_horaire,
  };
}

/**
 * Parking service
 * - Public: search / details / availability
 * - Owner: listMine / create
 */
export const parkingsService = {
  // =====================
  // PUBLIC
  // =====================

  /**
   * Recherche (si ton backend expose /parkings/search)
   * Sinon, garde cette méthode mais elle échouera.
   */
  async search({ lat, lng, radius, start_at, end_at } = {}) {
    // Si tu as bien une route search côté backend.
    const payload = await apiService.searchParkings?.(
      lat,
      lng,
      radius,
      toSqlDatetime(start_at),
      toSqlDatetime(end_at)
    );

    // Si tu n'as pas apiService.searchParkings, fallback:
    // throw new Error("searchParkings not implemented in apiService");

    if (!payload) return payload;

    // payload attendu: { data: [...] } ou directement [...]
    const list = Array.isArray(payload) ? payload : payload.data;
    if (!Array.isArray(list)) return payload;

    return {
      ...payload,
      data: list.map(normalizeParking),
    };
  },

  async details(id) {
    const payload = await apiService.getParkingDetails(id);
    // payload attendu: { data: {...} } ou {...}
    if (!payload) return payload;

    if (payload.data && typeof payload.data === "object") {
      return { ...payload, data: normalizeParking(payload.data) };
    }
    if (typeof payload === "object") return normalizeParking(payload);
    return payload;
  },

  async availability({ parking_id, start_at, end_at }) {
    return apiService.checkAvailability(
      parking_id,
      toSqlDatetime(start_at),
      toSqlDatetime(end_at)
    );
  },

  // =====================
  // OWNER
  // =====================

  async listMine() {
    const payload = await apiService.getOwnerParkings();
    if (!payload) return payload;

    const list = payload.data;
    if (!Array.isArray(list)) return payload;

    return {
      ...payload,
      data: list.map(normalizeParking),
    };
  },

  async create(parkingData) {
    // parkingData attendu:
    // {
    //   latitude, longitude, capacity, hourly_rate,
    //   opening_time, closing_time,
    //   address, opening_days
    // }
    return apiService.createOwnerParking(parkingData);
  },
};
