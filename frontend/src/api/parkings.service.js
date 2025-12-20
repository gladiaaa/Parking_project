// src/services/parkings.service.js
import { apiService } from "./apiService";

/**
 * Helpers
 */
function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Accepte:
 * - Date
 * - string "YYYY-MM-DDTHH:mm" (input datetime-local)
 * - string déjà SQL/ISO
 *
 * Renvoie un format SQL "YYYY-MM-DD HH:mm:ss" (safe pour ton backend PHP).
 */
function toSqlDatetime(value) {
  if (!value) return "";

  // Date object
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = pad2(value.getMonth() + 1);
    const d = pad2(value.getDate());
    const hh = pad2(value.getHours());
    const mm = pad2(value.getMinutes());
    const ss = pad2(value.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  const s = String(value).trim();
  if (!s) return "";

  // datetime-local: "YYYY-MM-DDTHH:mm"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
    return `${s.replace("T", " ")}:00`;
  }

  // ISO complet: "YYYY-MM-DDTHH:mm:ss(.sss)Z" -> on garde tel quel (ton backend doit parser)
  // SQL déjà OK -> on garde tel quel
  return s;
}

/**
 * Normalise un parking pour:
 * - UI user
 * - compat legacy (adresse / tarif_horaire / nombre_places)
 */
function normalizeParking(p) {
  if (!p || typeof p !== "object") return p;

  // opening_days peut être string JSON ("[1,2,3]") ou déjà array
  let openingDays = p.opening_days ?? p.openingDays ?? null;
  if (typeof openingDays === "string") {
    try {
      const parsed = JSON.parse(openingDays);
      if (Array.isArray(parsed)) openingDays = parsed;
    } catch {
      // parfois "" -> on ignore
    }
  }
  if (!Array.isArray(openingDays)) openingDays = [];

  const address = p.address ?? p.adresse ?? "";
  const hourlyRate = Number(p.hourly_rate ?? p.tarif_horaire ?? 0);
  const capacity = Number(p.capacity ?? p.nombre_places ?? 0);

  const normalized = {
    // champs “backend”
    ...p,

    id: Number(p.id),
    address,
    hourly_rate: hourlyRate,
    capacity,

    latitude: Number(p.latitude ?? p.lat ?? 0),
    longitude: Number(p.longitude ?? p.lng ?? 0),

    opening_time: p.opening_time ?? p.openingTime ?? null,
    closing_time: p.closing_time ?? p.closingTime ?? null,
    opening_days: openingDays,

    distance_km: p.distance_km ?? p.distanceKm ?? null,
    occupied: p.occupied ?? null,
    remaining: p.remaining ?? null,
    available: p.available ?? null,

    // alias legacy (tes vieux composants)
    adresse: address,
    tarif_horaire: hourlyRate,
    nombre_places: capacity,
  };

  return normalized;
}

function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeParking);
}

/**
 * Parking service
 * - Public: search / details / availability / occupancyNow
 * - Owner: listMine / create
 */
export const parkingsService = {
  // =====================
  // PUBLIC
  // =====================

  /**
   * GET /api/parkings/search?lat&lng&radius&start_at&end_at
   * Backend actuel: { success, parkings: [...], total }
   */
  async search({ lat, lng, radius, start_at, end_at } = {}) {
    if (typeof apiService.searchParkings !== "function") {
      throw new Error("apiService.searchParkings is not implemented");
    }

    const payload = await apiService.searchParkings({
      lat,
      lng,
      radius,
      start_at: toSqlDatetime(start_at),
      end_at: toSqlDatetime(end_at),
    });

    if (!payload) return payload;

    // Supporte plusieurs formats
    const list =
      payload.parkings ??
      payload.data ??
      (Array.isArray(payload) ? payload : null);

    if (!Array.isArray(list)) return payload;

    const parkings = normalizeList(list);

    // on renvoie un format “stable” côté front
    return {
      ...payload,
      parkings, // format backend
      data: parkings, // format compat (si certains écrans attendent .data)
      total:
        payload.total ??
        payload.count ??
        (Array.isArray(parkings) ? parkings.length : 0),
    };
  },

  /**
   * GET /api/parkings/details?id=7
   * Backend actuel: { success, parking: {...} }
   */
  async details(id) {
    const payload = await apiService.getParkingDetails(id);
    if (!payload) return payload;

    const raw =
      payload.parking ??
      payload.data ??
      (payload.success === true && payload.parking ? payload.parking : null);

    if (raw && typeof raw === "object") {
      const parking = normalizeParking(raw);
      return { ...payload, parking, data: parking };
    }

    // fallback: si le backend renvoie direct l’objet parking
    if (payload && typeof payload === "object" && payload.id) {
      return normalizeParking(payload);
    }

    return payload;
  },

  /**
   * GET /api/parkings/availability?parking_id&start_at&end_at
   */
  async availability({ parking_id, start_at, end_at }) {
    return apiService.checkAvailability(
      parking_id,
      toSqlDatetime(start_at),
      toSqlDatetime(end_at)
    );
  },

  /**
   * GET /api/parkings/occupancy-now?parking_id=2
   */
  async occupancyNow(parking_id) {
    if (typeof apiService.getOccupancyNow !== "function") {
      throw new Error("apiService.getOccupancyNow is not implemented");
    }
    return apiService.getOccupancyNow(parking_id);
  },

  // =====================
  // OWNER
  // =====================

  /**
   * GET /api/owner/parkings
   * Supporte: { parkings: [...] } ou { data: [...] } ou [...]
   */
  async listMine() {
    const payload = await apiService.getOwnerParkings();
    if (!payload) return payload;

    const list =
      payload.parkings ??
      payload.data ??
      (Array.isArray(payload) ? payload : null);

    if (!Array.isArray(list)) return payload;

    const parkings = normalizeList(list);

    return {
      ...payload,
      parkings,
      data: parkings,
      total:
        payload.total ??
        payload.count ??
        (Array.isArray(parkings) ? parkings.length : 0),
    };
  },

  /**
   * POST /api/owner/parkings
   */
  async create(parkingData) {
    return apiService.createOwnerParking(parkingData);
  },
};
