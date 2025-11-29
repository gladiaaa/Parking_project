import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { apiService } from '../services/apiService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Composant pour centrer la carte
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

const Maps = () => {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParking, setSelectedParking] = useState(null);
  const [mapStyle, setMapStyle] = useState('light'); // light, dark, satellite
  const [center, setCenter] = useState([46.6034, 1.8883]);
  const [zoom, setZoom] = useState(6);

  useEffect(() => {
    loadParkings();
  }, []);

  const loadParkings = async () => {
    setLoading(true);
    try {
      const response = await apiService.searchParkings({});
      setParkings(response.parkings || []);
    } catch (error) {
      console.error('Erreur chargement parkings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (parking) => {
    setSelectedParking(parking);
    setCenter([parking.latitude, parking.longitude]);
    setZoom(13);
  };

  const handleReserve = (parking) => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    window.location.href = `/reservation?parking=${parking.id}`;
  };

  const getTileUrl = () => {
    switch (mapStyle) {
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white relative">
        {/* Header Flottant Ultra-Moderne */}
        <div className="absolute top-24 left-0 right-0 z-[100] pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl p-6 pointer-events-auto">
                <h1 className="text-4xl font-extralight text-gray-900 tracking-tighter mb-1">
                  Carte des parkings
                </h1>
                <p className="text-xs text-gray-400 font-light uppercase tracking-wider">
                  {parkings.length} parkings disponibles
                </p>
              </div>

              {/* Sélecteur de style de carte */}
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl p-2 pointer-events-auto flex gap-2">
                {[
                  { value: 'light', label: 'Clair', icon: '☀️' },
                  { value: 'dark', label: 'Sombre', icon: '🌙' },
                  { value: 'satellite', label: 'Satellite', icon: '🛰️' }
                ].map(style => (
                  <button
                    key={style.value}
                    onClick={() => setMapStyle(style.value)}
                    className={`px-4 py-2.5 rounded-2xl text-sm font-light transition-all ${
                      mapStyle === style.value
                        ? 'bg-gray-900 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{style.icon}</span>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Carte Plein Écran */}
        <div className="relative h-screen w-full">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={true}
            className="modern-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url={getTileUrl()}
            />
            <MapController center={center} zoom={zoom} />
            
            {parkings.map((parking) => {
              if (!parking.latitude || !parking.longitude) return null;
              
              return (
                <React.Fragment key={parking.id}>
                  {/* Cercle animé autour du marqueur */}
                  <CircleMarker
                    center={[parking.latitude, parking.longitude]}
                    radius={8}
                    pathOptions={{
                      fillColor: parking.places_disponibles > 50 ? '#10b981' : parking.places_disponibles > 20 ? '#f59e0b' : '#ef4444',
                      fillOpacity: 0.3,
                      color: parking.places_disponibles > 50 ? '#10b981' : parking.places_disponibles > 20 ? '#f59e0b' : '#ef4444',
                      weight: 2
                    }}
                  />
                  <Marker
                    position={[parking.latitude, parking.longitude]}
                    eventHandlers={{
                      click: () => handleMarkerClick(parking),
                    }}
                  >
                    <Popup className="modern-popup" autoClose={false} closeOnClick={false}>
                      <div className="p-5 min-w-[300px]">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-extralight text-gray-900 mb-2">
                              {parking.nom}
                            </h3>
                            <p className="text-sm text-gray-500 font-light mb-3">
                              📍 {parking.adresse}
                            </p>
                            <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 font-light">
                              <span className="flex items-center gap-1">
                                ⭐ {parking.note}
                              </span>
                              <span className="flex items-center gap-1">
                                🅿️ {parking.places_disponibles} places
                              </span>
                              <span className="flex items-center gap-1">
                                💰 {parking.tarif_horaire}€/h
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {parking.services.slice(0, 3).map(service => (
                                <span
                                  key={service}
                                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-light"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleReserve(parking)}
                          className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl text-sm font-light hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
                        >
                          Réserver maintenant
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        {/* Card sélectionnée - Design Ultra-Moderne */}
        {selectedParking && (
          <div className="fixed bottom-6 left-6 right-6 z-[100] pointer-events-none animate-fade-in">
            <div className="max-w-lg mx-auto">
              <div className="bg-white/98 backdrop-blur-2xl rounded-3xl border border-gray-200/50 shadow-2xl p-8 pointer-events-auto transform transition-all duration-500">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-xl">
                        🅿️
                      </div>
                      <div>
                        <h3 className="text-2xl font-extralight text-gray-900 mb-1">
                          {selectedParking.nom}
                        </h3>
                        <p className="text-xs text-gray-400 font-light uppercase tracking-wider">
                          {selectedParking.ville}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-500 font-light text-sm mb-4">
                      📍 {selectedParking.adresse}
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-extralight text-gray-900 mb-1">
                          ⭐ {selectedParking.note}
                        </div>
                        <div className="text-xs text-gray-400 font-light">Note</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-extralight text-gray-900 mb-1">
                          🅿️ {selectedParking.places_disponibles}
                        </div>
                        <div className="text-xs text-gray-400 font-light">Places</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-extralight text-gray-900 mb-1">
                          {selectedParking.tarif_horaire}€
                        </div>
                        <div className="text-xs text-gray-400 font-light">Par heure</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedParking.services.map(service => (
                        <span
                          key={service}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-light"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedParking(null);
                      setZoom(6);
                      setCenter([46.6034, 1.8883]);
                    }}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600 text-lg ml-4"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCenter([selectedParking.latitude, selectedParking.longitude]);
                      setZoom(15);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-light hover:bg-gray-200 transition-all text-sm"
                  >
                    📍 Centrer
                  </button>
                  <button
                    onClick={() => handleReserve(selectedParking)}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-light hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Réserver
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Légende */}
        <div className="absolute bottom-6 right-6 z-[100] bg-white/95 backdrop-blur-2xl rounded-2xl border border-gray-200/50 shadow-2xl p-4 pointer-events-auto">
          <div className="text-xs font-light text-gray-500 mb-2 uppercase tracking-wider">Disponibilité</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600 font-light">+50 places</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-600 font-light">20-50 places</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600 font-light">&lt;20 places</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Maps;
