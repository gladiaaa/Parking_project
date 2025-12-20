// src/components/ReservationMap.jsx
import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!center || !Array.isArray(center)) return;
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);
  return null;
}

function toLatLng(p) {
  const lat = Number(p?.latitude);
  const lng = Number(p?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
  return [lat, lng];
}

export default function ReservationMap({
  allParkings = [],
  nearbyParkings = [],
  centerLat,
  centerLng,
  selectedParking,
  loadingAll = false,
  getPriceLabel,
  onSelectParking,
  onOpenParking,
}) {
  const center = useMemo(() => {
    const lat = Number(centerLat);
    const lng = Number(centerLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    return [46.6034, 1.8883]; // France
  }, [centerLat, centerLng]);

  const zoom = useMemo(() => {
    const lat = Number(centerLat);
    const lng = Number(centerLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return 12;
    return 6;
  }, [centerLat, centerLng]);

  // Index nearby par id pour “prioriser” les points proches (label prix)
  const nearbyById = useMemo(() => {
    const m = new Map();
    (nearbyParkings || []).forEach((p) => m.set(Number(p.id), p));
    return m;
  }, [nearbyParkings]);

  const selectedId = Number(selectedParking?.id || 0);

  return (
    <div className="absolute inset-0 bg-[#eef2f7]">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        style={{ zIndex: 0 }} // ✅ important
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapController center={center} zoom={zoom} />

        {/* Loading overlay léger */}
        {loadingAll && (
          <div className="absolute top-4 right-4 z-[500] bg-white/90 backdrop-blur rounded-xl px-4 py-2 border border-gray-200 shadow">
            <span className="text-sm text-gray-700 font-semibold">Chargement des parkings…</span>
          </div>
        )}

        {/* Point “centre de recherche” */}
        {Number.isFinite(Number(centerLat)) && Number.isFinite(Number(centerLng)) && (
          <CircleMarker
            center={[Number(centerLat), Number(centerLng)]}
            radius={8}
            pathOptions={{ color: "#111827", fillColor: "#111827", fillOpacity: 0.2, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              Zone de recherche
            </Tooltip>
          </CircleMarker>
        )}

        {/* Tous les parkings France (petits points neutres) */}
        {(allParkings || []).map((p) => {
          const pos = toLatLng(p);
          if (!pos) return null;

          const isNearby = nearbyById.has(Number(p.id));
          const isSelected = Number(p.id) === selectedId;

          // si nearby: on ne le dessine pas ici, il sera dessiné en “focus” plus bas
          if (isNearby) return null;

          return (
            <CircleMarker
              key={`all-${p.id}`}
              center={pos}
              radius={4}
              pathOptions={{
                color: isSelected ? "#111827" : "#9ca3af",
                fillColor: isSelected ? "#111827" : "#9ca3af",
                fillOpacity: 0.35,
                weight: 1,
              }}
              eventHandlers={{
                click: () => {
                  onSelectParking?.(p);
                  onOpenParking?.(p);
                },
                mouseover: () => onSelectParking?.(p),
              }}
            />
          );
        })}

        {/* Parkings proches (plus gros + label prix) */}
        {(nearbyParkings || []).map((p) => {
          const pos = toLatLng(p);
          if (!pos) return null;

          const isSelected = Number(p.id) === selectedId;
          const label = typeof getPriceLabel === "function" ? getPriceLabel(p) : null;

          return (
            <CircleMarker
              key={`near-${p.id}`}
              center={pos}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? "#111827" : "#f97316",
                fillColor: isSelected ? "#111827" : "#f97316",
                fillOpacity: isSelected ? 0.35 : 0.25,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => {
                  onSelectParking?.(p);
                  onOpenParking?.(p);
                },
                mouseover: () => onSelectParking?.(p),
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div className="text-sm font-semibold">
                  Parking #{p.id}
                  {label ? ` • ${label}€` : ""}
                </div>
                <div className="text-xs opacity-80">{p.address}</div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
