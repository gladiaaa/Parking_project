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

function hoursBetween(startLocal, endLocal) {
  const s = safeDate(startLocal);
  const e = safeDate(endLocal);
  if (!s || !e) return null;
  const diffMs = e.getTime() - s.getTime();
  if (diffMs <= 0) return 0;
  // Arrondi supérieur à l'heure (cohérent avec ton autre page)
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

function formatMoney(n) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function normalizeParking(p) {
  // Supporte plusieurs noms de champs selon tes réponses backend
  const capacity = Number(p?.capacity ?? p?.nombre_places ?? 0);
  const occupied = Number(p?.occupied ?? p?.places_occupees ?? 0);
  const remaining =
    Number(p?.remaining ?? p?.places_disponibles ?? (capacity - occupied)) || 0;

  return {
    id: Number(p?.id),
    name: p?.nom ?? p?.name ?? `Parking #${p?.id ?? "?"}`,
    address: p?.address ?? p?.adresse ?? "Adresse inconnue",
    latitude: Number(p?.latitude ?? p?.lat ?? 0) || 0,
    longitude: Number(p?.longitude ?? p?.lng ?? 0) || 0,

    capacity,
    occupied,
    remaining,

    openingTime: p?.opening_time ?? p?.horaire_ouverture ?? p?.openingTime ?? null,
    closingTime: p?.closing_time ?? p?.horaire_fermeture ?? p?.closingTime ?? null,

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

  // Reservation UI
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    startAt: "",
    endAt: "",
    vehicleType: "car", // API wants: "car" (exemple). Tu peux ajouter "moto", "bike" etc.
  });

  // Subscription UI
  const [showSubscription, setShowSubscription] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: "monthly", // monthly / daily / etc (selon ton backend)
    startDate: "", // YYYY-MM-DD
    // endDate: optionnel si ton backend le demande
  });

  useEffect(() => {
    loadParkingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkingId]);

  async function loadParkingDetails() {
    setLoading(true);
    setError("");

    try {
      const result = await apiService.getParkingDetails(parkingId);
      const p = result?.parking ?? result?.data?.parking ?? result?.data ?? null;

      if (!result?.success && !p) {
        throw new Error(result?.error || "Réponse inattendue (parking introuvable).");
      }

      setParking(normalizeParking(p));
    } catch (err) {
      setParking(null);
      setError(err?.message || "Erreur lors du chargement des détails du parking");
    } finally {
      setLoading(false);
    }
  }

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

    // Payload EXACT demandé
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

      // Ton UX: retour dashboard user (ou mes réservations)
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

    // Si tu veux imposer une date de début: sinon mets today par défaut
    const startDate = subscriptionForm.startDate || new Date().toISOString().slice(0, 10);

    const payload = {
      parking_id: parkingId,
      plan: subscriptionForm.plan, // à aligner avec ton backend
      start_date: startDate, // à aligner avec ton backend
    };

    setSubLoading(true);
    try {
      // ⚠️ À implémenter côté apiService si pas encore fait
      const resp = await apiService.createSubscription(payload);

      if (resp?.success === false) throw new Error(resp?.error || "Souscription refusée.");

      // petit reset UI
      setShowSubscription(false);
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
              <Link to="/reservation" className="text-black hover:underline font-medium mb-4 inline-block">
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
                    {parking.capacity}
                  </p>

                  <p>
                    <span className="font-semibold">Disponibilité :</span>{" "}
                    {parking.remaining} libres • {parking.occupied} occupées
                  </p>

                  {(parking.openingTime && parking.closingTime) && (
                    <p>
                      <span className="font-semibold">Horaires :</span>{" "}
                      {parking.openingTime} - {parking.closingTime}
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
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition font-medium"
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
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition font-medium"
                  >
                    Souscrire
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

              <p className="text-gray-600 mb-4">
                Gagne du temps si tu reviens souvent. Les humains adorent payer “au mois” pour se sentir organisés.
              </p>

              {showSubscription && (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Offre
                      </label>
                      <select
                        value={subscriptionForm.plan}
                        onChange={(e) =>
                          setSubscriptionForm((p) => ({ ...p, plan: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="monthly">Mensuel</option>
                        <option value="weekly">Hebdo</option>
                        <option value="daily">Journalier</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        À aligner avec les valeurs acceptées par ton backend.
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={subscriptionForm.startDate}
                        onChange={(e) =>
                          setSubscriptionForm((p) => ({ ...p, startDate: e.target.value }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Si vide, on envoie aujourd’hui.
                      </p>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={subLoading}
                        className="w-full bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {subLoading ? "Souscription..." : "Confirmer l’abonnement"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
