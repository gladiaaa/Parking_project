// src/pages/Reservation.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";
import ReservationSearchBar, { getDefaultSearchParams } from "../components/ReservationSearchBar";
import ReservationMap from "../components/ReservationMap";
import { List, Map, SquareParking, Star } from "lucide-react";

/**
 * Helpers
 */
function safeDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function hoursBetween(start, end) {
  const s = safeDate(start);
  const e = safeDate(end);
  if (!s || !e) return null;
  const diffMs = e.getTime() - s.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

function formatMoney(n) {
  const x = Number(n ?? 0);
  return x.toFixed(2);
}

function normalizeParking(p) {
  const lat = Number(p?.latitude ?? p?.lat ?? 0);
  const lng = Number(p?.longitude ?? p?.lng ?? 0);

  return {
    id: Number(p?.id),
    name: p?.nom ?? p?.name ?? `Parking #${Number(p?.id)}`,
    address: p?.address ?? p?.adresse ?? "Adresse inconnue",

    hourlyRate: Number(p?.hourly_rate ?? p?.tarif_horaire ?? 0),
    capacity: Number(p?.capacity ?? p?.nombre_places ?? 0),

    latitude: Number.isFinite(lat) ? lat : 0,
    longitude: Number.isFinite(lng) ? lng : 0,

    // champs search (si présents)
    distanceKm: Number(p?.distance_km ?? p?.distanceKm ?? 0),
    available: p?.available ?? true,
    occupied: Number(p?.occupied ?? 0),
    remaining: Number(p?.remaining ?? 0),

    note: Number(p?.note ?? 0),
  };
}

function pickList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.parkings)) return res.parkings;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

export default function Reservation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);

  // Résultat “proche” (searchParkings)
  const [parkings, setParkings] = useState([]);
  const [filteredParkings, setFilteredParkings] = useState([]);

  // France entière (GET /api/parkings) pour la map
  const [allParkings, setAllParkings] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  const [selectedParking, setSelectedParking] = useState(null);
  const [viewMode, setViewMode] = useState("list");

  // Params init (state -> fallback)
  const [searchParams, setSearchParams] = useState(() => {
    const fallback = getDefaultSearchParams();
    return {
      ...fallback,
      ...(location.state || {}),
      lat: location.state?.lat ?? fallback.lat,
      lng: location.state?.lng ?? fallback.lng,
      radiusKm: location.state?.radiusKm ?? fallback.radiusKm,
      startAt: location.state?.startAt ?? fallback.startAt,
      endAt: location.state?.endAt ?? fallback.endAt,
      addressText: location.state?.addressText ?? fallback.addressText,
      sort: location.state?.sort ?? fallback.sort,
    };
  });

  const [filters, setFilters] = useState({
    prixMax: 9999,
    noteMin: 0,
    dispoOnly: true,
  });

  // Auth check (non-bloquant)
  useEffect(() => {
    (async () => {
      setBooting(true);
      try {
        await apiService.me();
      } catch {
        // OK: l’utilisateur peut juste parcourir
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Charger France entière pour la map
  useEffect(() => {
    loadAllParkings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recherche auto au montage (liste proche)
  useEffect(() => {
    loadParkings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrage local liste
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkings, filters, searchParams.sort]);

  function applyFilters() {
    let results = [...parkings];

    results = results.filter((p) => p.hourlyRate <= filters.prixMax);
    results = results.filter((p) => (p.note ?? 0) >= filters.noteMin);
    if (filters.dispoOnly) results = results.filter((p) => p.available !== false);

    if (searchParams.sort === "price") {
      results.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (searchParams.sort === "note") {
      results.sort((a, b) => (b.note ?? 0) - (a.note ?? 0));
    } else {
      results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    setFilteredParkings(results);
  }

  async function loadAllParkings() {
    setAllLoading(true);
    try {
      const resp = await apiService.getAllParkings(); // GET /api/parkings
      const list = pickList(resp);
      const normalized = list
        .map(normalizeParking)
        .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude !== 0 && p.longitude !== 0);

      setAllParkings(normalized);
    } catch (e) {
      console.error("❌ Erreur chargement ALL parkings:", e);
      setAllParkings([]);
    } finally {
      setAllLoading(false);
    }
  }

  async function loadParkings() {
    if (!searchParams.lat || !searchParams.lng) {
      setParkings([]);
      setFilteredParkings([]);
      return;
    }

    setLoading(true);
    try {
      const resp = await apiService.searchParkings(
        searchParams.lat,
        searchParams.lng,
        searchParams.radiusKm,
        searchParams.startAt,
        searchParams.endAt
      );

      const list = pickList(resp);
      const normalized = list.map(normalizeParking);

      setParkings(normalized);
      setFilteredParkings(normalized);
    } catch (e) {
      console.error("❌ Erreur chargement parkings:", e);
      setParkings([]);
      setFilteredParkings([]);
    } finally {
      setLoading(false);
    }
  }

  function calculateTotalPrice(parking) {
    if (!searchParams.startAt || !searchParams.endAt) return `${formatMoney(parking.hourlyRate)}/h`;
    const h = hoursBetween(searchParams.startAt, searchParams.endAt);
    if (h == null) return `${formatMoney(parking.hourlyRate)}/h`;
    return formatMoney(h * parking.hourlyRate);
  }

  function goParkingDetails(parking) {
    // On passe les infos utiles à ParkingDetails (dates + éventuellement coords)
    navigate(`/parking/${parking.id}`, {
      state: {
        startAt: searchParams.startAt,
        endAt: searchParams.endAt,
        addressText: searchParams.addressText,
        lat: searchParams.lat,
        lng: searchParams.lng,
      },
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="flex flex-1 pt-[72px] overflow-hidden">
        {/* Colonne gauche (au-dessus de la map sur desktop) */}
        <div
          className={[
            "w-full lg:w-[680px] flex flex-col h-full border-r border-gray-200 bg-white z-10",
            viewMode === "map" ? "hidden lg:flex" : "flex",
          ].join(" ")}
        >
          <ReservationSearchBar
            value={searchParams}
            onChange={setSearchParams}
            onSearch={loadParkings}
            loading={loading}
            className="border-b border-gray-200"
          />

          <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, dispoOnly: !p.dispoOnly }))}
              className={[
                "px-4 py-2 rounded-full text-sm font-semibold border transition",
                filters.dispoOnly
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-800 border-gray-200 hover:border-black/20",
              ].join(" ")}
            >
              Dispo
            </button>

            <div className="ml-auto text-sm text-gray-500 font-medium">
              {searchParams.addressText || "Zone"} • {filteredParkings.length} résultats
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {booting || loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              filteredParkings.map((parking) => (
                <ParkingCard
                  key={parking.id}
                  parking={parking}
                  price={calculateTotalPrice(parking)}
                  onOpen={() => goParkingDetails(parking)}
                  onHover={() => setSelectedParking(parking)}
                />
              ))
            )}

            {filteredParkings.length === 0 && !loading && !booting && (
              <div className="text-center py-20 text-gray-500">
                Aucun parking trouvé. (Si Postman en renvoie, check `pickList/normalizeParking`.)
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite: map (derrière la colonne gauche sur desktop, pas l’inverse) */}
        <div className={`flex-1 bg-gray-200 relative z-0 ${viewMode === "list" ? "hidden lg:block" : "block"}`}>
          <ReservationMap
            allParkings={allParkings}
            nearbyParkings={filteredParkings}
            centerLat={searchParams.lat}
            centerLng={searchParams.lng}
            selectedParking={selectedParking}
            loadingAll={allLoading}
            onSelectParking={(p) => setSelectedParking(p)}
            onOpenParking={(p) => goParkingDetails(p)}
            getPriceLabel={(p) => calculateTotalPrice(p)}
          />

          <button
            className="lg:hidden absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-xl font-bold z-[1000] flex items-center gap-2"
            onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
            type="button"
          >
            {viewMode === "list" ? (
              <>
                <Map className="w-5 h-5" /> Carte
              </>
            ) : (
              <>
                <List className="w-5 h-5" /> Liste
              </>
            )}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/**
 * Card
 */
function ParkingCard({ parking, price, onOpen, onHover }) {
  const disabled = parking.available === false;

  return (
    <div
      onMouseEnter={onHover}
      onClick={() => onOpen()}
      role="button"
      tabIndex={0}
      className={[
        "bg-white border rounded-2xl p-5 transition-all duration-200 flex gap-4 cursor-pointer",
        disabled ? "border-gray-200 opacity-70" : "border-gray-200 hover:shadow-lg",
      ].join(" ")}
    >
      <div className="w-32 h-32 bg-gray-100 rounded-xl flex-shrink-0 relative overflow-hidden flex items-center justify-center">
        <SquareParking className="w-16 h-16 text-gray-300" />
        <div className="absolute top-3 left-3">
          <span
            className={[
              "text-[10px] font-bold px-2 py-1 rounded-full border",
              disabled
                ? "bg-gray-50 text-gray-500 border-gray-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-100",
            ].join(" ")}
          >
            {disabled ? "Indispo" : "Disponible"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-3">
            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
              {parking.name || `Parking #${parking.id}`}
            </h3>

            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full text-xs font-bold text-gray-900 border border-gray-200">
              <Star className="w-3 h-3 fill-current" /> {parking.note ?? 0}
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-3 truncate">{parking.address}</p>

          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {parking.capacity} places
            </span>
            <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {formatMoney(parking.hourlyRate)}€/h
            </span>
            {Number.isFinite(parking.distanceKm) && parking.distanceKm > 0 && (
              <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {parking.distanceKm.toFixed(2)} km
              </span>
            )}
          </div>

          {(parking.occupied || parking.remaining) ? (
            <div className="text-xs text-gray-500">
              Occupées: {parking.occupied ?? 0} • Restantes: {parking.remaining ?? 0}
            </div>
          ) : null}
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <span className="text-lg font-extrabold text-primary">{price}€</span>
            <span className="text-xs text-gray-500 ml-1">/ total</span>
          </div>

          <div
            className={[
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all border",
              disabled ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-white text-gray-900 border-gray-300",
            ].join(" ")}
          >
            Voir
          </div>
        </div>
      </div>
    </div>
  );
}
