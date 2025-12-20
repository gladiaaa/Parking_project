import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { apiService } from "../services/apiService";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "leaflet/dist/leaflet.css";

// Fix icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
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
    id: p.id,
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
  // Si tu n’as pas "places_disponibles", on fait simple:
  // plus la capacité est grande, plus c’est “vert”.
  if ((p.capacity ?? 0) >= 100) return "#10b981"; // vert
  if ((p.capacity ?? 0) >= 30) return "#f59e0b"; // orange
  return "#ef4444"; // rouge
}

export default function Maps() {
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
      const res = await apiService.getParkings();
      const list = pickList(res)
        .map(normalizeParking)
        .filter(Boolean);

      setParkings(list);

      // Si tu veux: auto-centre sur le premier parking dispo
      if (list.length > 0) {
        setCenter([list[0].latitude, list[0].longitude]);
        setZoom(6);
      }
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
        <div className="absolute top-24 left-0 right-0 z-[100] pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between gap-4">
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
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; CARTO'
              url={tileUrl(mapStyle)}
            />
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

                        <div className="flex items-center gap-3 text-xs text-gray-500 font-light">
                          <span>🅿️ {p.capacity} places</span>
                          <span>💰 {p.hourly_rate.toFixed(2)}€/h</span>
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
          <div className="fixed bottom-6 left-6 right-6 z-[100] pointer-events-none animate-fade-in">
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
                        <div className="text-xs text-gray-400 font-light">
                          Capacité
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-extralight text-gray-900">
                          💰 {selectedParking.hourly_rate.toFixed(2)}€
                        </div>
                        <div className="text-xs text-gray-400 font-light">
                          / heure
                        </div>
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
                    onClick={() => loadParkings()}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-light hover:bg-gray-800 transition-all shadow-lg text-sm"
                    type="button"
                  >
                    ↻ Rafraîchir
                  </button>
                </div>
                
              </div>
              
            </div>
            
          </div>
        )}
                {/* Légende (capacité, faute de “places dispo”) */}
        <div className="absolute bottom-6 right-6 z-[100] bg-white/95 backdrop-blur-2xl rounded-2xl border border-gray-200/50 shadow-2xl p-4 pointer-events-auto">
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
