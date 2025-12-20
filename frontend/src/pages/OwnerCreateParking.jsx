// src/pages/OwnerCreateParking.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { apiService } from "../services/apiService";
import { notifyAuthChanged } from "../services/authStore";

const DAYS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mer" },
  { id: 4, label: "Jeu" },
  { id: 5, label: "Ven" },
  { id: 6, label: "Sam" },
  { id: 7, label: "Dim" },
];

const initialForm = {
  address: "",
  latitude: null,
  longitude: null,
  capacity: "",
  hourly_rate: "",
  opening_time: "08:00",
  closing_time: "22:00",
  opening_days: [1, 2, 3, 4, 5],
};

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function toNumber(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function formatOpeningDays(days) {
  if (!Array.isArray(days) || days.length === 0) return "—";
  const map = new Map(DAYS.map((d) => [d.id, d.label]));
  return days
    .map((d) => map.get(Number(d)) || "")
    .filter(Boolean)
    .join(", ");
}

export default function OwnerCreateParking() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);

  const [error, setError] = useState("");
  const [addrQuery, setAddrQuery] = useState("");
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrSuggestions, setAddrSuggestions] = useState([]);
  const [addrOpen, setAddrOpen] = useState(false);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const canSubmit = useMemo(() => {
    const capacity = toNumber(form.capacity);
    const rate = toNumber(form.hourly_rate);

    return (
      String(form.address || "").trim().length > 0 &&
      form.latitude !== null &&
      form.longitude !== null &&
      capacity !== null &&
      capacity > 0 &&
      rate !== null &&
      rate >= 0 &&
      form.opening_time &&
      form.closing_time &&
      Array.isArray(form.opening_days) &&
      form.opening_days.length > 0
    );
  }, [form]);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap() {
    setLoadingMe(true);
    setError("");

    try {
      const meResult = await apiService.me();
      const user = meResult?.user ?? meResult;

      if (!user?.role) throw new Error("Réponse /me inattendue");

      localStorage.setItem("user", JSON.stringify(user));
      notifyAuthChanged();

      const role = normalizeRole(user.role);
      if (role !== "owner") {
        navigate("/dashboard-user", { replace: true });
        return;
      }

      setMe(user);
    } catch {
      navigate("/login", { replace: true });
    } finally {
      setLoadingMe(false);
    }
  }

  function updateField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  function toggleOpeningDay(dayId) {
    setForm((p) => {
      const current = Array.isArray(p.opening_days) ? p.opening_days : [];
      const has = current.includes(dayId);
      const next = has ? current.filter((d) => d !== dayId) : [...current, dayId];
      next.sort((a, b) => a - b);
      return { ...p, opening_days: next };
    });
  }

  // --- Géocodage (adresse.data.gouv.fr) ---
  async function fetchAddressSuggestions(q) {
    const query = String(q || "").trim();
    if (query.length < 3) {
      setAddrSuggestions([]);
      return;
    }

    // Cancel previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAddrLoading(true);

    try {
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        query
      )}&limit=6`;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("Service d’adresse indisponible");
      const data = await res.json();

      const features = Array.isArray(data?.features) ? data.features : [];
      const list = features
        .map((f) => {
          const label = f?.properties?.label;
          const coords = f?.geometry?.coordinates; // [lng, lat]
          if (!label || !Array.isArray(coords) || coords.length < 2) return null;
          return {
            label,
            longitude: coords[0],
            latitude: coords[1],
          };
        })
        .filter(Boolean);

      setAddrSuggestions(list);
    } catch (e) {
      // Si abort: rien
      if (String(e?.name) !== "AbortError") {
        setAddrSuggestions([]);
      }
    } finally {
      setAddrLoading(false);
    }
  }

  function handleAddressInput(value) {
    setAddrQuery(value);
    updateField("address", value);

    // dès que l'utilisateur retape, on invalide lat/lng
    updateField("latitude", null);
    updateField("longitude", null);

    setAddrOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 250);
  }

  function pickSuggestion(s) {
    updateField("address", s.label);
    updateField("latitude", s.latitude);
    updateField("longitude", s.longitude);

    setAddrQuery(s.label);
    setAddrOpen(false);
    setAddrSuggestions([]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      address: String(form.address || "").trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      capacity: toNumber(form.capacity),
      hourly_rate: toNumber(form.hourly_rate),
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      opening_days: Array.isArray(form.opening_days)
        ? form.opening_days
            .map((d) => Number(d))
            .filter((d) => Number.isFinite(d) && d >= 1 && d <= 7)
        : [],
    };

    if (!payload.address) return setError("L’adresse est obligatoire.");
    if (payload.latitude === null || payload.longitude === null)
      return setError("Choisis une adresse dans les suggestions pour obtenir la position.");
    if (payload.capacity === null || payload.capacity <= 0)
      return setError("La capacité doit être > 0.");
    if (payload.hourly_rate === null || payload.hourly_rate < 0)
      return setError("Le tarif horaire doit être un nombre valide (>= 0).");
    if (!payload.opening_time || !payload.closing_time)
      return setError("Les horaires sont obligatoires.");
    if (!payload.opening_days || payload.opening_days.length === 0)
      return setError("Choisis au moins un jour d’ouverture.");

    setSubmitting(true);
    try {
      await apiService.createOwnerParking(payload);
      navigate("/dashboard-owner", { replace: true });
    } catch (e2) {
      setError(e2?.message || "Erreur lors de la création du parking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Layout>
        <main className="flex-1">
          {/* HERO */}
          <section className="relative bg-primary text-white py-12">
            <div className="container mx-auto px-6 lg:px-12">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-serif font-normal mb-2">
                    Créer un parking
                  </h1>
                  <p className="text-white/95 text-base font-light">
                    {me?.firstname ? `Bonjour ${me.firstname}. ` : ""}
                    Ajoutez un nouveau parking sans saisir des coordonnées comme en 2009.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/dashboard-owner")}
                  className="hidden md:inline-flex bg-white text-primary px-6 py-3 rounded-full hover:bg-gray-100 transition font-normal"
                  type="button"
                >
                  ← Retour
                </button>
              </div>
            </div>
          </section>

          <div className="container mx-auto px-6 lg:px-12 py-12">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
                {error}
              </div>
            )}

            {loadingMe ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-gray-600">Chargement…</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-serif font-normal text-gray-900 mb-6">
                  Informations du parking
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Adresse + suggestions */}
                  <div className="relative">
                    <label className="block text-gray-700 font-medium mb-2">
                      Adresse
                    </label>

                    <input
                      type="text"
                      value={addrQuery}
                      onChange={(e) => handleAddressInput(e.target.value)}
                      onFocus={() => setAddrOpen(true)}
                      onBlur={() => {
                        // petit delay pour laisser le clic sur une suggestion
                        setTimeout(() => setAddrOpen(false), 120);
                      }}
                      placeholder="10 Rue de Rivoli, 75004 Paris"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm"
                      required
                    />

                    <div className="mt-2 text-xs text-gray-500">
                      {form.latitude && form.longitude ? (
                        <span>
                          Position trouvée:{" "}
                          <span className="font-medium text-gray-900">
                            {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}
                          </span>
                        </span>
                      ) : (
                        <span>
                          Tape au moins 3 caractères et sélectionne une suggestion.
                        </span>
                      )}
                    </div>

                    {addrOpen && (addrLoading || addrSuggestions.length > 0) && (
                      <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                        {addrLoading ? (
                          <div className="px-4 py-3 text-sm text-gray-600">
                            Recherche…
                          </div>
                        ) : addrSuggestions.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-600">
                            Aucune suggestion.
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-100">
                            {addrSuggestions.map((s) => (
                              <li key={`${s.latitude}-${s.longitude}-${s.label}`}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()} // évite blur avant click
                                  onClick={() => pickSuggestion(s)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                                >
                                  <div className="text-sm text-gray-900">{s.label}</div>
                                  <div className="text-xs text-gray-500">
                                    {Number(s.latitude).toFixed(6)}, {Number(s.longitude).toFixed(6)}
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Capacité (places)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.capacity}
                        onChange={(e) => updateField("capacity", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm"
                        placeholder="10"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Tarif horaire (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.hourly_rate}
                        onChange={(e) => updateField("hourly_rate", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm"
                        placeholder="2.50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Heure d’ouverture
                      </label>
                      <input
                        type="time"
                        value={form.opening_time}
                        onChange={(e) => updateField("opening_time", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Heure de fermeture
                      </label>
                      <input
                        type="time"
                        value={form.closing_time}
                        onChange={(e) => updateField("closing_time", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Jours */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Jours d’ouverture
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => {
                        const active =
                          Array.isArray(form.opening_days) &&
                          form.opening_days.includes(d.id);

                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleOpeningDay(d.id)}
                            className={[
                              "px-4 py-2 rounded-full border text-sm transition",
                              active
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                            ].join(" ")}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Sélection:{" "}
                      <span className="font-medium text-gray-900">
                        {formatOpeningDays(form.opening_days)}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col md:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className={[
                        "inline-flex items-center justify-center px-8 py-3 rounded-full text-base font-normal transition-all duration-300 shadow-md",
                        !canSubmit || submitting
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                          : "bg-primary text-white hover:bg-accent hover:shadow-lg",
                      ].join(" ")}
                    >
                      {submitting ? "Création..." : "Créer le parking"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/dashboard-owner")}
                      className="inline-flex items-center justify-center px-8 py-3 rounded-full text-base font-normal bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 shadow-md"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </Layout>
    </div>
  );
}
