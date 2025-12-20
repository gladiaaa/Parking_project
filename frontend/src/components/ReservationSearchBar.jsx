import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, MapPin, Navigation, Search } from "lucide-react";

/**
 * Helpers dates
 */
function pad(n) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocal(d) {
  if (!(d instanceof Date)) return "";
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function defaultSlot() {
  // créneau par défaut: maintenant + 1h (arrondi) -> + 2h
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { startAt: toDatetimeLocal(start), endAt: toDatetimeLocal(end) };
}

/**
 * Hook: click outside
 */
function useOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (!ref.current) return;
      if (ref.current.contains(e.target)) return;
      onOutside?.();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

/**
 * Réservation Search Bar
 * - Adresse -> lat/lng via api-adresse.data.gouv.fr
 * - Dates: menu toggle au clic (pas hover)
 */
export default function ReservationSearchBar({
  value,
  onChange,
  onSearch,
  loading = false,
  className = "",
}) {
  const containerRef = useRef(null);

  // Adresse
  const [addrQuery, setAddrQuery] = useState(value?.addressText || "");
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrSuggestions, setAddrSuggestions] = useState([]);

  // Dates
  const [datesOpen, setDatesOpen] = useState(false);

  // Debounce + abort
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useOutside(containerRef, () => {
    setAddrOpen(false);
    setDatesOpen(false);
  });

  // Sync si parent change (rare, mais propre)
  useEffect(() => {
    setAddrQuery(value?.addressText || "");
  }, [value?.addressText]);

  const canSearch = useMemo(() => {
    return !!value?.lat && !!value?.lng && !!value?.startAt && !!value?.endAt;
  }, [value?.lat, value?.lng, value?.startAt, value?.endAt]);

  async function fetchSuggestions(q) {
    const query = String(q || "").trim();
    if (query.length < 3) {
      setAddrSuggestions([]);
      return;
    }

    // Abort previous
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
            lng: coords[0],
            lat: coords[1],
          };
        })
        .filter(Boolean);

      setAddrSuggestions(list);
    } catch (e) {
      if (String(e?.name) !== "AbortError") setAddrSuggestions([]);
    } finally {
      setAddrLoading(false);
    }
  }

  function handleAddressInput(next) {
    setAddrQuery(next);
    setAddrOpen(true);

    // Quand on retape: on invalide lat/lng côté parent (sinon tu “penses” être à l’ancienne adresse)
    onChange?.({
      ...value,
      addressText: next,
      lat: null,
      lng: null,
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(next), 250);
  }

  function pickSuggestion(s) {
    setAddrQuery(s.label);
    setAddrOpen(false);
    setAddrSuggestions([]);

    onChange?.({
      ...value,
      addressText: s.label,
      lat: s.lat,
      lng: s.lng,
    });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      alert("Géolocalisation non disponible sur ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange?.({
          ...value,
          addressText: value?.addressText?.trim() ? value.addressText : "Ma position",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Impossible de récupérer ta position.")
    );
  }

  function toggleDates() {
    setDatesOpen((p) => !p);
    setAddrOpen(false);
  }

  function triggerSearch() {
    // Tu peux décider d’autoriser une recherche même si pas de lat/lng, mais ton backend veut lat/lng.
    if (!canSearch) {
      alert("Choisis une adresse (ou 'Ma position') + des dates.");
      return;
    }
    onSearch?.();
  }

  return (
    <div ref={containerRef} className={["p-5", className].join(" ")}>
      {/* Ligne 1: adresse + buttons */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>

          <input
            type="text"
            value={addrQuery}
            onChange={(e) => handleAddressInput(e.target.value)}
            onFocus={() => {
              setAddrOpen(true);
              if (addrQuery.trim().length >= 3 && addrSuggestions.length === 0) {
                fetchSuggestions(addrQuery);
              }
            }}
            placeholder="Adresse (ex: 10 Rue de Rivoli, Paris)"
            className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border border-transparent rounded-2xl font-medium text-gray-900 focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
          />

          {/* Suggestions */}
          {addrOpen && (addrLoading || addrSuggestions.length > 0) && (
            <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
              {addrLoading ? (
                <div className="px-4 py-3 text-sm text-gray-600">Recherche…</div>
              ) : addrSuggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-600">Aucune suggestion.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {addrSuggestions.map((s) => (
                    <li key={`${s.lat}-${s.lng}-${s.label}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()} // évite blur avant click
                        onClick={() => pickSuggestion(s)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <div className="text-sm text-gray-900">{s.label}</div>
                        <div className="text-xs text-gray-500">
                          {Number(s.lat).toFixed(6)}, {Number(s.lng).toFixed(6)}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          className="bg-white border border-gray-200 text-gray-900 px-5 py-3.5 rounded-2xl font-bold hover:border-black/30 transition-colors shadow-sm flex items-center justify-center gap-2"
          title="Utiliser ma position"
        >
          <Navigation className="w-5 h-5" />
          <span>Ma position</span>
        </button>

        <button
          type="button"
          onClick={triggerSearch}
          disabled={loading}
          className="bg-primary text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-primary-600 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Recherche…" : "Rechercher"}
        </button>
      </div>

      {/* Ligne 2: filtres */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        {/* Dates (toggle click) */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleDates}
            className={[
              "flex items-center gap-2 bg-white border px-4 py-2.5 rounded-full text-sm font-semibold transition-colors",
              datesOpen ? "border-black/20" : "border-gray-200 hover:border-black/20",
            ].join(" ")}
          >
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>Dates</span>
          </button>

          {datesOpen && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-white shadow-xl rounded-2xl border border-gray-100 min-w-[320px] z-50">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Début</label>
                  <input
                    type="datetime-local"
                    value={value?.startAt || ""}
                    onChange={(e) => onChange?.({ ...value, startAt: e.target.value })}
                    className="w-full text-sm border-gray-200 rounded-xl mt-1 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Fin</label>
                  <input
                    type="datetime-local"
                    value={value?.endAt || ""}
                    onChange={(e) => onChange?.({ ...value, endAt: e.target.value })}
                    className="w-full text-sm border-gray-200 rounded-xl mt-1 px-3 py-2"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setDatesOpen(false)}
                    className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rayon */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-full text-sm font-semibold hover:border-black/20 transition-colors">
          <MapPin className="w-4 h-4 text-gray-500" />
          <select
            value={value?.radiusKm ?? 3}
            onChange={(e) => onChange?.({ ...value, radiusKm: Number(e.target.value) })}
            className="bg-transparent outline-none"
          >
            <option value={1}>1 km</option>
            <option value={3}>3 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
          </select>
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-full text-sm font-semibold hover:border-black/20 transition-colors">
          <span>Trier</span>
          <select
            value={value?.sort ?? "distance"}
            onChange={(e) => onChange?.({ ...value, sort: e.target.value })}
            className="bg-transparent outline-none"
          >
            <option value="distance">Distance</option>
            <option value="price">Prix</option>
            <option value="note">Note</option>
          </select>
        </div>

        {/* Badge zone */}
        <span
          className={[
            "ml-auto text-xs font-bold px-3 py-1.5 rounded-full border",
            value?.lat && value?.lng
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-amber-50 text-amber-700 border-amber-100",
          ].join(" ")}
        >
          {value?.lat && value?.lng ? "Zone OK" : "Zone: adresse requise"}
        </span>
      </div>
    </div>
  );
}

/**
 * Petit helper exportable si tu veux init la page ailleurs
 */
export function getDefaultSearchParams() {
  const slot = defaultSlot();
  return {
    addressText: "Paris (défaut)",
    lat: 48.8566,
    lng: 2.3522,
    radiusKm: 3,
    startAt: slot.startAt,
    endAt: slot.endAt,
    vehicleType: "Voiture",
    sort: "distance",
  };
}
