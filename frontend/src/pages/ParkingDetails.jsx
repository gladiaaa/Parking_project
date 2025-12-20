// src/pages/ParkingDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";

/**
 * Utils
 */
function safeDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// datetime-local ("2025-12-20T12:00") -> "2025-12-20 12:00:00"
function toApiDateTime(dtLocal) {
  const d = safeDate(dtLocal);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// Date -> "YYYY-MM-DD HH:mm:ss"
function toApiDateTimeFromDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function hoursBetween(startLocal, endLocal) {
  const s = safeDate(startLocal);
  const e = safeDate(endLocal);
  if (!s || !e) return null;
  const diffMs = e.getTime() - s.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

function formatMoney(n) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

// ---------- Opening days helpers ----------
function normalizeOpeningDays(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((v) => {
        if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
        return v;
      })
      .filter((v) => v !== null && v !== undefined && v !== "");
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];

    if (!s.startsWith("[") && s.includes(",")) {
      return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((v) => (/^\d+$/.test(v) ? Number(v) : v));
    }

    try {
      const parsed = JSON.parse(s);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((v) => {
          if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
          return v;
        })
        .filter((v) => v !== null && v !== undefined && v !== "");
    } catch {
      if (/^\d+$/.test(s)) return [Number(s)];
      return [s];
    }
  }

  return [];
}

function formatOpeningDays(days) {
  if (!days || days.length === 0) return "Non renseigné";

  const numMap = {
    1: "Lun",
    2: "Mar",
    3: "Mer",
    4: "Jeu",
    5: "Ven",
    6: "Sam",
    7: "Dim",
  };

  const strMap = {
    mon: "Lun",
    tue: "Mar",
    wed: "Mer",
    thu: "Jeu",
    fri: "Ven",
    sat: "Sam",
    sun: "Dim",
    lundi: "Lun",
    mardi: "Mar",
    mercredi: "Mer",
    jeudi: "Jeu",
    vendredi: "Ven",
    samedi: "Sam",
    dimanche: "Dim",
  };

  const normalized = days
    .map((d) => {
      if (typeof d === "number") return d;
      const s = String(d).trim().toLowerCase();
      if (/^\d+$/.test(s)) return Number(s);
      return s;
    })
    .filter(Boolean);

  const nums = normalized.filter((x) => typeof x === "number");
  const strs = normalized.filter((x) => typeof x === "string");

  const parts = [];

  if (nums.length > 0) {
    const uniqueSorted = Array.from(new Set(nums))
      .filter((n) => n >= 1 && n <= 7)
      .sort((a, b) => a - b);

    parts.push(...uniqueSorted.map((n) => numMap[n] || `Jour ${n}`));
  }

  if (strs.length > 0) {
    const unique = Array.from(new Set(strs));
    parts.push(...unique.map((s) => strMap[s] || s));
  }

  return parts.length ? parts.join(" • ") : "Non renseigné";
}

// ---------- Subscriptions helpers ----------
function isoDate(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function isDateInRange(yyyy_mm_dd, start, end) {
  return yyyy_mm_dd >= start && yyyy_mm_dd <= end;
}

function normalizeSub(raw) {
  if (!raw) return null;
  const weeklySlots = raw.weekly_slots ?? raw.weeklySlots ?? raw.slots ?? [];
  return {
    id: raw.id ?? raw.subscription_id ?? null,
    parkingId: Number(raw.parking_id ?? raw.parkingId ?? 0),
    userId: Number(raw.user_id ?? raw.userId ?? 0),
    startDate: raw.start_date ?? raw.startDate ?? null, // Y-m-d
    endDate: raw.end_date ?? raw.endDate ?? null, // Y-m-d
    weeklySlots: Array.isArray(weeklySlots) ? weeklySlots : [],
    amount: Number(raw.amount ?? 0),
  };
}

function presetSlots(kind) {
  // dow: 1=Lundi ... 7=Dimanche
  if (kind === "EVENING") {
    return [1, 2, 3, 4, 5].map((dow) => ({ dow, start: "18:00", end: "23:59" }));
  }
  if (kind === "WEEKEND") {
    return [
      { dow: 6, start: "00:00", end: "23:59" },
      { dow: 7, start: "00:00", end: "23:59" },
    ];
  }
  if (kind === "FULL") {
    return [1, 2, 3, 4, 5, 6, 7].map((dow) => ({ dow, start: "00:00", end: "23:59" }));
  }
  return [{ dow: 1, start: "08:00", end: "18:00" }];
}

function dayLabel(dow) {
  return ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][dow] || `Jour ${dow}`;
}

// ---------- Parking normalization ----------
function normalizeParking(p) {
  const capacity = Number(p?.capacity ?? p?.nombre_places ?? 0);

  const openingDaysRaw = p?.opening_days ?? p?.jours_ouverture ?? p?.openingDays ?? null;

  return {
    id: Number(p?.id),
    name: p?.nom ?? p?.name ?? `Parking #${p?.id ?? "?"}`,
    address: p?.address ?? p?.adress ?? p?.adresse ?? "Adresse inconnue",
    latitude: Number(p?.latitude ?? p?.lat ?? 0) || 0,
    longitude: Number(p?.longitude ?? p?.lng ?? 0) || 0,
    capacity,
    openingTime: p?.opening_time ?? p?.horaire_ouverture ?? p?.openingTime ?? null,
    closingTime: p?.closing_time ?? p?.horaire_fermeture ?? p?.closingTime ?? null,
    openingDays: normalizeOpeningDays(openingDaysRaw),
    hourlyRate: Number(p?.hourly_rate ?? p?.tarif_horaire ?? 0) || 0,
    dailyRate: Number(p?.daily_rate ?? p?.tarif_journalier ?? 0) || 0,
    monthlyRate: Number(p?.monthly_rate ?? p?.tarif_mensuel ?? 0) || 0,
  };
}

export default function ParkingDetails() {
  const { id } = useParams();
  const parkingId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Availability state (source of truth pour occupied/remaining)
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Reservation UI
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    startAt: "",
    endAt: "",
    vehicleType: "car",
  });

  // Subscription UI
  const [showSubscription, setShowSubscription] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  // My subscriptions state
  const [mySubsLoading, setMySubsLoading] = useState(false);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [activeSub, setActiveSub] = useState(null);

  const [subscriptionForm, setSubscriptionForm] = useState({
    months: 1,
    startDate: "",
    preset: "EVENING",
    weeklySlots: presetSlots("EVENING"),
  });

  useEffect(() => {
    loadParkingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkingId]);

  async function loadAvailability(startAtStr, endAtStr, capacityFallback = null) {
    if (!parkingId) return;

    setAvailabilityLoading(true);
    try {
      // Tu dois avoir une méthode apiService.getParkingAvailability
      // qui appelle: GET /api/parkings/availability?parking_id=...&start_at=...&end_at=...
      const resp = await apiService.getParkingAvailability({
        parking_id: parkingId,
        start_at: startAtStr,
        end_at: endAtStr,
      });

      const a = resp?.data ?? resp;

      setAvailability({
        capacity: Number(a?.capacity ?? capacityFallback ?? 0),
        occupied: Number(a?.occupied ?? 0),
        remaining: Number(a?.remaining ?? 0),
        available: Boolean(a?.available),
        start_at: a?.start_at ?? null,
        end_at: a?.end_at ?? null,
      });
    } catch {
      setAvailability(null);
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function loadParkingDetails() {
    setLoading(true);
    setError("");

    try {
      const result = await apiService.getParkingDetails(parkingId);
      const p = result?.parking ?? result?.data?.parking ?? result?.data ?? null;

      if (!result?.success && !p) {
        throw new Error(result?.error || "Réponse inattendue (parking introuvable).");
      }

      const normalizedParking = normalizeParking(p);
      setParking(normalizedParking);

      // ✅ disponibilité "par défaut" : maintenant -> +45 min
      const now = new Date();
      const in45 = new Date(now.getTime() + 45 * 60 * 1000);
      await loadAvailability(
        toApiDateTimeFromDate(now),
        toApiDateTimeFromDate(in45),
        normalizedParking.capacity
      );

      // Charger abonnements user si connecté
      setMySubsLoading(true);
      try {
        await apiService.me();

        const subResp = await apiService.getMySubscriptions();
        const list =
          subResp?.subscriptions ??
          subResp?.data ??
          (Array.isArray(subResp) ? subResp : []);
        const normalized = (Array.isArray(list) ? list : []).map(normalizeSub).filter(Boolean);

        setMySubscriptions(normalized);

        const today = isoDate();
        const foundActive =
          normalized.find((s) => {
            if (Number(s.parkingId) !== Number(parkingId)) return false;
            if (!s.startDate || !s.endDate) return false;
            return isDateInRange(today, s.startDate, s.endDate);
          }) || null;

        setActiveSub(foundActive);
      } catch {
        setMySubscriptions([]);
        setActiveSub(null);
      } finally {
        setMySubsLoading(false);
      }
    } catch (err) {
      setParking(null);
      setAvailability(null);
      setError(err?.message || "Erreur lors du chargement des détails du parking");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Recalcule la dispo quand l'utilisateur prépare une réservation
  useEffect(() => {
    if (!showReservationForm) return;
    if (!reservationForm.startAt || !reservationForm.endAt) return;

    const startStr = toApiDateTime(reservationForm.startAt);
    const endStr = toApiDateTime(reservationForm.endAt);
    if (!startStr || !endStr) return;

    loadAvailability(startStr, endStr, parking?.capacity ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showReservationForm, reservationForm.startAt, reservationForm.endAt, parkingId]);

  const estimatedAmount = useMemo(() => {
    if (!parking) return 0;

    const h = hoursBetween(reservationForm.startAt, reservationForm.endAt);
    if (h == null) return 0;
    const amount = h * (parking.hourlyRate ?? 0);
    return Number(formatMoney(amount));
  }, [parking, reservationForm.startAt, reservationForm.endAt]);

  async function requireAuthOrRedirect() {
    try {
      await apiService.me();
      return true;
    } catch {
      navigate("/login", { state: { from: `/parking/${parkingId}` } });
      return false;
    }
  }

  async function handleReserve(e) {
    e.preventDefault();
    setError("");

    const ok = await requireAuthOrRedirect();
    if (!ok) return;

    const start = safeDate(reservationForm.startAt);
    const end = safeDate(reservationForm.endAt);

    if (!start || !end) return setError("Dates invalides.");
    if (end <= start) return setError("La fin doit être après le début.");

    // Si on a une availability calculée sur ce créneau, on peut refuser côté front
    if (availability && availability.available === false) {
      return setError("Créneau indisponible (parking complet).");
    }

    const payload = {
      parking_id: parkingId,
      start_at: toApiDateTime(reservationForm.startAt),
      end_at: toApiDateTime(reservationForm.endAt),
      vehicle_type: reservationForm.vehicleType,
      amount: estimatedAmount,
    };

    try {
      const resp = await apiService.createReservation(payload);
      if (resp?.success === false) throw new Error(resp?.error || "Réservation refusée.");
      navigate("/dashboard-user");
    } catch (err) {
      setError(err?.message || "Erreur lors de la réservation");
    }
  }

  async function handleSubscribe(e) {
    e.preventDefault();
    setError("");

    const ok = await requireAuthOrRedirect();
    if (!ok) return;

    const startDate = subscriptionForm.startDate || isoDate();
    const months = Number(subscriptionForm.months || 1);

    const payload = {
      parking_id: parkingId,
      start_date: startDate,
      months,
      weekly_slots: subscriptionForm.weeklySlots,
    };

    setSubLoading(true);
    try {
      const resp = await apiService.createSubscription(payload);
      if (resp?.success === false) throw new Error(resp?.error || "Souscription refusée.");

      setShowSubscription(false);
      setSubscriptionForm({
        months: 1,
        startDate: "",
        preset: "EVENING",
        weeklySlots: presetSlots("EVENING"),
      });

      await loadParkingDetails();
    } catch (err) {
      setError(err?.message || "Erreur lors de la souscription");
    } finally {
      setSubLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Chargement…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !parking) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link to="/reservation" className="text-black hover:underline font-medium">
              Retour à la recherche
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayedCapacity = Number(availability?.capacity ?? parking?.capacity ?? 0);
  const displayedOccupied = Number(availability?.occupied ?? 0);
  const displayedRemaining =
    availability?.remaining != null ? Number(availability.remaining) : Math.max(0, displayedCapacity - displayedOccupied);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pt-[96px]">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {parking && (
          <>
            {/* Header */}
            <div className="mb-8">
              <Link
                to="/reservation"
                className="text-black hover:underline font-medium mb-4 inline-block"
              >
                ← Retour à la recherche
              </Link>

              <h1 className="text-4xl font-bold mb-3 text-gray-900">{parking.name}</h1>
              <p className="text-gray-600">{parking.address}</p>
            </div>

            {/* Infos + Tarifs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Informations</h2>

                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-semibold">Capacité :</span>{" "}
                    {displayedCapacity}
                  </p>

                  <p>
                    <span className="font-semibold">Disponibilité :</span>{" "}
                    {availabilityLoading ? (
                      <span className="text-gray-500">Calcul…</span>
                    ) : (
                      <>
                        {displayedRemaining} libres • {displayedOccupied} occupées
                      </>
                    )}
                  </p>

                  {parking.openingTime && parking.closingTime && (
                    <p>
                      <span className="font-semibold">Horaires :</span>{" "}
                      {parking.openingTime} - {parking.closingTime}
                    </p>
                  )}

                  <p>
                    <span className="font-semibold">Jours d’ouverture :</span>{" "}
                    {formatOpeningDays(parking.openingDays)}
                  </p>

                  {/* Petit indicateur si on a un calcul d'availability */}
                  {availability?.start_at && availability?.end_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Dispo calculée sur le créneau:{" "}
                      <span className="font-semibold">
                        {new Date(availability.start_at).toLocaleString("fr-FR")}
                      </span>{" "}
                      →{" "}
                      <span className="font-semibold">
                        {new Date(availability.end_at).toLocaleString("fr-FR")}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Tarifs</h2>

                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-semibold">Horaire :</span>{" "}
                    {formatMoney(parking.hourlyRate)} €
                  </p>
                  <p>
                    <span className="font-semibold">Journalier :</span>{" "}
                    {formatMoney(parking.dailyRate)} €
                  </p>
                  <p>
                    <span className="font-semibold">Mensuel :</span>{" "}
                    {formatMoney(parking.monthlyRate)} €
                  </p>
                </div>
              </div>
            </div>

            {/* Réservation */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Réserver</h2>

                {!showReservationForm ? (
                  <button
                    onClick={() => setShowReservationForm(true)}
                    className="bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-900 transition font-medium"
                  >
                    Réserver
                  </button>
                ) : (
                  <button
                    onClick={() => setShowReservationForm(false)}
                    className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium"
                  >
                    Fermer
                  </button>
                )}
              </div>

              {showReservationForm && (
                <form onSubmit={handleReserve} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-gray-700 font-medium mb-2">
                        Véhicule
                      </label>
                      <select
                        value={reservationForm.vehicleType}
                        onChange={(e) =>
                          setReservationForm((p) => ({ ...p, vehicleType: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      >
                        <option value="car">Voiture</option>
                        <option value="moto">Moto</option>
                        <option value="bike">Vélo</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Doit matcher les valeurs attendues par l’API (`vehicle_type`).
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Début
                      </label>
                      <input
                        type="datetime-local"
                        value={reservationForm.startAt}
                        onChange={(e) =>
                          setReservationForm((p) => ({ ...p, startAt: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Fin
                      </label>
                      <input
                        type="datetime-local"
                        value={reservationForm.endAt}
                        onChange={(e) =>
                          setReservationForm((p) => ({ ...p, endAt: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                    </div>
                  </div>

                  {reservationForm.startAt && reservationForm.endAt && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Montant estimé</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatMoney(estimatedAmount)} €
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Calcul basé sur le tarif horaire (arrondi à l’heure sup).
                      </p>

                      {availability && availability.available === false && (
                        <p className="text-sm text-red-600 mt-3 font-semibold">
                          Créneau indisponible (parking complet).
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={availability && availability.available === false}
                    >
                      Confirmer la réservation
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowReservationForm(false)}
                      className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Abonnement */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Abonnement</h2>

                {!showSubscription ? (
                  <button
                    onClick={() => setShowSubscription(true)}
                    disabled={!!activeSub}
                    className={`bg-gray-900 text-white px-5 py-2.5 rounded-xl transition font-medium ${
                      activeSub ? "opacity-50 cursor-not-allowed" : "hover:bg-black"
                    }`}
                    title={activeSub ? "Tu as déjà un abonnement actif" : "Souscrire"}
                  >
                    {activeSub ? "Déjà abonné" : "Souscrire"}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubscription(false)}
                    className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl hover:bg-gray-200 transition font-medium"
                  >
                    Fermer
                  </button>
                )}
              </div>

              {mySubsLoading ? (
                <div className="mb-4 text-sm text-gray-600">
                  Vérification de tes abonnements…
                </div>
              ) : activeSub ? (
                <div className="mb-4 border border-green-200 bg-green-50 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-green-900">Abonnement actif</p>
                      <p className="text-sm text-green-800">
                        Du {activeSub.startDate} au {activeSub.endDate}
                      </p>

                      {Number.isFinite(activeSub.amount) && activeSub.amount > 0 ? (
                        <p className="text-sm text-green-800 mt-1">
                          Montant facturé:{" "}
                          <span className="font-semibold">
                            {formatMoney(activeSub.amount)} €
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-green-700 mt-1">
                          Montant indisponible (backend doit renvoyer `amount`).
                        </p>
                      )}
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-900">
                      ACTIF
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-semibold text-green-900 mb-2">
                      Créneaux hebdo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeSub.weeklySlots?.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-green-200 text-green-900"
                        >
                          {dayLabel(Number(s.dow))} {s.start}-{s.end}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 border border-gray-200 bg-gray-50 rounded-xl p-4">
                  <p className="font-bold text-gray-900">Aucun abonnement actif</p>
                  <p className="text-sm text-gray-600">
                    Tu peux en créer un avec des créneaux personnalisés.
                  </p>
                </div>
              )}

              <p className="text-gray-600 mb-4">
                Gagne du temps si tu reviens souvent. Les humains adorent payer “au mois” pour se sentir organisés.
              </p>

              {showSubscription && !activeSub && (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Preset</label>
                      <select
                        value={subscriptionForm.preset}
                        onChange={(e) => {
                          const preset = e.target.value;
                          setSubscriptionForm((p) => ({
                            ...p,
                            preset,
                            weeklySlots: preset === "CUSTOM" ? p.weeklySlots : presetSlots(preset),
                          }));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="EVENING">Soir (Lun-Ven 18:00-23:59)</option>
                        <option value="WEEKEND">Week-end (Sam-Dim)</option>
                        <option value="FULL">Total (7j/7)</option>
                        <option value="CUSTOM">Personnalisé</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Ça remplit automatiquement les créneaux hebdo.
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Durée (mois)</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={subscriptionForm.months}
                        onChange={(e) => setSubscriptionForm((p) => ({ ...p, months: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">Backend: 1 à 12 mois.</p>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Date de début</label>
                      <input
                        type="date"
                        value={subscriptionForm.startDate}
                        onChange={(e) => setSubscriptionForm((p) => ({ ...p, startDate: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <p className="text-xs text-gray-500 mt-2">Si vide, on envoie aujourd’hui.</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold text-gray-900">Créneaux hebdo</p>
                      <button
                        type="button"
                        onClick={() =>
                          setSubscriptionForm((p) => ({
                            ...p,
                            preset: "CUSTOM",
                            weeklySlots: [...p.weeklySlots, { dow: 1, start: "08:00", end: "18:00" }],
                          }))
                        }
                        className="text-sm font-semibold px-3 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100"
                      >
                        + Ajouter
                      </button>
                    </div>

                    <div className="space-y-3">
                      {subscriptionForm.weeklySlots.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                          <select
                            value={s.dow}
                            onChange={(e) => {
                              const dow = Number(e.target.value);
                              setSubscriptionForm((p) => {
                                const next = [...p.weeklySlots];
                                next[idx] = { ...next[idx], dow };
                                return { ...p, preset: "CUSTOM", weeklySlots: next };
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-xl"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                              <option key={d} value={d}>
                                {dayLabel(d)}
                              </option>
                            ))}
                          </select>

                          <input
                            type="time"
                            value={s.start}
                            onChange={(e) => {
                              const start = e.target.value;
                              setSubscriptionForm((p) => {
                                const next = [...p.weeklySlots];
                                next[idx] = { ...next[idx], start };
                                return { ...p, preset: "CUSTOM", weeklySlots: next };
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-xl"
                          />

                          <input
                            type="time"
                            value={s.end}
                            onChange={(e) => {
                              const end = e.target.value;
                              setSubscriptionForm((p) => {
                                const next = [...p.weeklySlots];
                                next[idx] = { ...next[idx], end };
                                return { ...p, preset: "CUSTOM", weeklySlots: next };
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-xl"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setSubscriptionForm((p) => {
                                const next = p.weeklySlots.filter((_, i) => i !== idx);
                                return { ...p, preset: "CUSTOM", weeklySlots: next };
                              })
                            }
                            className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-sm font-semibold"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Note: start &gt; end = traverse minuit (autorisé par ton backend).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={subLoading}
                    className="w-full bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subLoading ? "Souscription..." : "Confirmer l’abonnement"}
                  </button>
                </form>
              )}

              {false && (
                <pre className="mt-6 text-xs bg-gray-100 p-3 rounded-lg overflow-auto">
                  {JSON.stringify({ mySubscriptions, activeSub, parking, availability }, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
