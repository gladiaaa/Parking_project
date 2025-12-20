import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "leaflet/dist/leaflet.css";

// =========================
// Config
// =========================
const P = {
  // ✅ Mets ici ta vraie route details si besoin
  // ex: (id) => `/parking-details/${id}`
  PARKING_DETAILS_ROUTE: (id) => `/parking/${id}`,
};

// =========================
// Fix icônes Leaflet
// =========================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// =========================
// Helpers
// =========================
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!Array.isArray(center) || center.length !== 2) return;
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

function pickList(res) {
  // ultra tolérant : {data:[...]} | {parkings:[...]} | [...]
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.parkings)) return res.parkings;
  return [];
}

function normalizeParking(p) {
  if (!p || typeof p !== "object") return null;

  const latitude = Number(p.latitude ?? p.lat);
  const longitude = Number(p.longitude ?? p.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: Number(p.id),
    latitude,
    longitude,
    address: p.address ?? p.adresse ?? "Adresse inconnue",
    capacity: Number(p.capacity ?? p.nombre_places ?? 0) || 0,
    hourly_rate: Number(p.hourly_rate ?? p.tarif_horaire ?? 0) || 0,
  };
}

function tileUrl(style) {
  switch (style) {
    case "dark":
      return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    case "satellite":
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    default:
      return "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  }
}

function circleColor(p) {
  // Proxy sur la capacité (vu qu’on n’a pas “places dispo” ici)
  if ((p.capacity ?? 0) >= 50) return "#10b981"; // vert
  if ((p.capacity ?? 0) >= 20) return "#f59e0b"; // orange
  return "#ef4444"; // rouge
}

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// =========================
// Address search (api-adresse.data.gouv.fr)
// =========================
async function searchAddress(query) {
  const q = String(query || "").trim();
  if (!q) return [];
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=6`;

  const r = await fetch(url);
  if (!r.ok) throw new Error("Adresse: erreur API");
  const data = await r.json();

  const features = Array.isArray(data?.features) ? data.features : [];
  return features
    .map((f) => {
      const label = f?.properties?.label;
      const coords = f?.geometry?.coordinates; // [lng, lat]
      if (!label || !Array.isArray(coords) || coords.length < 2) return null;
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { label, lat, lng };
    })
    .filter(Boolean);
}

function AddressSearchBar({ onPick }) {
  const [value, setValue] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const debounced = useDebouncedValue(value, 250);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const q = String(debounced || "").trim();
      if (q.length < 3) {
        setItems([]);
        setErr("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const res = await searchAddress(q);
        if (cancelled) return;
        setItems(res);
        setOpen(true);
      } catch (e) {
        if (cancelled) return;
        setItems([]);
        setErr(e?.message || "Erreur adresse");
        setOpen(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // close dropdown on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-auto w-[380px] max-w-full relative">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">📍</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Rechercher une adresse…"
            className="w-full bg-transparent outline-none text-sm font-light text-gray-900 placeholder:text-gray-400"
          />
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          ) : (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setItems([]);
                setOpen(false);
                setErr("");
              }}
              className="text-xs text-gray-400 hover:text-gray-700"
              title="Effacer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {open && (items.length > 0 || err) && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {err ? (
            <div className="px-4 py-3 text-sm text-red-600">{err}</div>
          ) : (
            <ul className="max-h-72 overflow-auto">
              {items.map((it) => (
                <li key={`${it.label}-${it.lat}-${it.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(it.label);
                      setOpen(false);
                      onPick?.(it);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    {it.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// =========================
// Page
// =========================
export default function Maps() {
  const navigate = useNavigate();

  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedParking, setSelectedParking] = useState(null);
  const [mapStyle, setMapStyle] = useState("light");

  const defaultCenter = useMemo(() => [46.6034, 1.8883], []);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(6);

  useEffect(() => {
    loadParkings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadParkings() {
    setLoading(true);
    setError("");

    try {
      // ✅ GET /api/parkings
      const res = await apiService.getParkings();
      const list = pickList(res).map(normalizeParking).filter(Boolean);

      setParkings(list);

      // garde la France par défaut: pas de recenter agressif
      // (sinon tu te retrouves à zoomer sur un parking random en Lozère, et personne ne veut ça)
      setCenter(defaultCenter);
      setZoom(6);
    } catch (e) {
      setParkings([]);
      setError(e?.message || "Impossible de charger les parkings.");
    } finally {
      setLoading(false);
    }
  }

  function handleMarkerClick(p) {
    setSelectedParking(p);
    setCenter([p.latitude, p.longitude]);
    setZoom(14);
  }

  function goToDetails(parkingId) {
    navigate(P.PARKING_DETAILS_ROUTE(parkingId));
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-white relative">
        {/* Header flottant */}
        <div className="absolute top-24 left-0 right-0 z-[500] pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl p-6 pointer-events-auto">
                <h1 className="text-4xl font-extralight text-gray-900 tracking-tighter mb-1">
                  Carte des parkings
                </h1>
                <p className="text-xs text-gray-400 font-light uppercase tracking-wider">
                  {parkings.length} parkings chargés
                </p>
                {error && (
                  <p className="mt-2 text-sm text-red-600 font-light">{error}</p>
                )}
              </div>

              {/* Barre de recherche adresse */}
              <AddressSearchBar
                onPick={({ lat, lng }) => {
                  setSelectedParking(null);
                  setCenter([lat, lng]);
                  setZoom(13);
                }}
              />

              {/* Styles map */}
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl p-2 pointer-events-auto flex gap-2">
                {[
                  { value: "light", label: "Clair", icon: "☀️" },
                  { value: "dark", label: "Sombre", icon: "🌙" },
                  { value: "satellite", label: "Satellite", icon: "🛰️" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setMapStyle(s.value)}
                    className={[
                      "px-4 py-2.5 rounded-2xl text-sm font-light transition-all",
                      mapStyle === s.value
                        ? "bg-gray-900 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                    type="button"
                  >
                    <span className="mr-2">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map plein écran */}
        <div className="relative h-screen w-full">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom
            zoomControl
            className="modern-map"
          >
            <TileLayer attribution="&copy; OpenStreetMap &copy; CARTO" url={tileUrl(mapStyle)} />
            <MapController center={center} zoom={zoom} />

            {parkings.map((p) => {
              const color = circleColor(p);

              return (
                <React.Fragment key={p.id}>
                  <CircleMarker
                    center={[p.latitude, p.longitude]}
                    radius={10}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.25,
                      color,
                      weight: 2,
                    }}
                  />
                  <Marker
                    position={[p.latitude, p.longitude]}
                    eventHandlers={{
                      click: () => handleMarkerClick(p),
                    }}
                  >
                    <Popup className="modern-popup">
                      <div className="p-4 min-w-[260px]">
                        <h3 className="text-lg font-light text-gray-900 mb-2">
                          Parking #{p.id}
                        </h3>
                        <p className="text-sm text-gray-600 font-light mb-3">
                          📍 {p.address}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-500 font-light mb-4">
                          <span>🅿️ {p.capacity} places</span>
                          <span>💰 {Number(p.hourly_rate).toFixed(2)}€/h</span>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            to={P.PARKING_DETAILS_ROUTE(p.id)}
                            className="flex-1 text-center bg-gray-900 text-white py-2.5 rounded-xl text-sm font-light hover:bg-gray-800 transition-all shadow-lg"
                          >
                            Voir détails
                          </Link>

                          <button
                            type="button"
                            onClick={() => goToDetails(p.id)}
                            className="px-3 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm"
                            title="Ouvrir"
                          >
                            ↗
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        {/* Card sélectionnée */}
        {selectedParking && (
          <div className="fixed bottom-6 left-6 right-6 z-[600] pointer-events-none animate-fade-in">
            <div className="max-w-lg mx-auto">
              <div className="bg-white/98 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl p-7 pointer-events-auto">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-extralight text-gray-900 mb-2">
                      Parking #{selectedParking.id}
                    </h3>
                    <p className="text-gray-600 font-light text-sm mb-4">
                      📍 {selectedParking.address}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-extralight text-gray-900">
                          🅿️ {selectedParking.capacity}
                        </div>
                        <div className="text-xs text-gray-400 font-light">Capacité</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-extralight text-gray-900">
                          💰 {Number(selectedParking.hourly_rate).toFixed(2)}€
                        </div>
                        <div className="text-xs text-gray-400 font-light">/ heure</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedParking(null);
                      setZoom(6);
                      setCenter(defaultCenter);
                    }}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600 text-lg"
                    type="button"
                    title="Fermer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => {
                      setCenter([selectedParking.latitude, selectedParking.longitude]);
                      setZoom(16);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-light hover:bg-gray-200 transition-all text-sm"
                    type="button"
                  >
                    📍 Centrer
                  </button>

                  <button
                    onClick={() => goToDetails(selectedParking.id)}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-light hover:bg-gray-800 transition-all shadow-lg text-sm"
                    type="button"
                  >
                    Voir détails
                  </button>

                  <button
                    onClick={loadParkings}
                    className="px-4 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-light hover:bg-gray-50 transition-all text-sm"
                    type="button"
                    title="Rafraîchir les parkings"
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Légende */}
        <div className="absolute bottom-6 right-6 z-[500] bg-white/95 backdrop-blur-2xl rounded-2xl border border-gray-200/50 shadow-2xl p-4 pointer-events-auto">
          <div className="text-xs font-light text-gray-500 mb-2 uppercase tracking-wider">
            Capacité (proxy)
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 font-light">≥ 50 places</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600 font-light">20–49 places</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600 font-light">&lt; 20 places</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
