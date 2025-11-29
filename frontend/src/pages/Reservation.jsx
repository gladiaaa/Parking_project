import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Reservation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [filteredParkings, setFilteredParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Paramètres de recherche
  const [searchParams, setSearchParams] = useState({
    ville: location.state?.ville || '',
    vehicule: location.state?.vehicule || 'Voiture',
    dateDebut: location.state?.dateDebut || '',
    dateFin: location.state?.dateFin || '',
    sort: 'distance'
  });

  // Filtres avancés
  const [filters, setFilters] = useState({
    prixMax: 10, // Prix max par défaut assez élevé pour voir tous les parkings
    noteMin: 0, // Note min à 0 pour voir tous les parkings
    services: []
  });

  const [showFilters, setShowFilters] = useState(false);

  // Charger les parkings au montage (toujours)
  useEffect(() => {
    loadParkings();
  }, []);

  // Filtrer les parkings quand les paramètres changent
  useEffect(() => {
    applyFilters();
  }, [parkings, filters, searchParams]);

  const loadParkings = async () => {
    setLoading(true);
    try {
      const params = {
        ...searchParams,
        dateDebut: searchParams.dateDebut || undefined,
        dateFin: searchParams.dateFin || undefined
      };
      const response = await apiService.searchParkings(params);
      console.log('✅ Parkings chargés:', response.parkings.length);
      setParkings(response.parkings || []);
      // Appliquer les filtres après le chargement
      setTimeout(() => {
        applyFiltersToResults(response.parkings || []);
      }, 100);
    } catch (error) {
      console.error('❌ Erreur chargement parkings:', error);
      setParkings([]);
      setFilteredParkings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersToResults = (parkingsList) => {
    let results = [...parkingsList];
    results = results.filter(p => p.tarif_horaire <= filters.prixMax);
    results = results.filter(p => p.note >= filters.noteMin);
    if (filters.services.length > 0) {
      results = results.filter(p =>
        filters.services.every(service => p.services.includes(service))
      );
    }
    console.log('✅ Parkings filtrés:', results.length);
    setFilteredParkings(results);
  };

  const applyFilters = () => {
    if (parkings.length === 0) return;
    applyFiltersToResults(parkings);
  };

  const handleSearch = () => {
    loadParkings();
  };

  const handleBooking = (parking) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/reservation', parking } });
      return;
    }
    setSelectedParking(parking);
    setShowBookingModal(true);
  };

  const calculatePrice = (parking) => {
    if (!searchParams.dateDebut || !searchParams.dateFin) {
      return parking.tarif_horaire.toFixed(2) + '/h';
    }
    const debut = new Date(searchParams.dateDebut);
    const fin = new Date(searchParams.dateFin);
    const diffMs = fin - debut;
    const diffMinutes = diffMs / (1000 * 60);
    const diffHeures = diffMinutes / 60;
    const diffJours = diffHeures / 24;
    if (diffJours < 1) {
      const heures = Math.ceil(diffHeures);
      return (heures * parking.tarif_horaire).toFixed(2);
    }
    if (diffJours <= 30) {
      const jours = Math.ceil(diffJours);
      return (jours * parking.tarif_journalier).toFixed(2);
    }
    const mois = Math.ceil(diffJours / 30);
    return (mois * parking.tarif_mensuel).toFixed(2);
  };

  const servicesDisponibles = ['Couvert', 'Gardé', 'Sécurisé', 'Vidéo-surveillance', 'Bornes électriques', 'Lavage auto', 'Accessible PMR'];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        {/* Hero Section Ultra-Minimaliste */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50"></div>
          <div className="relative max-w-6xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
              <h1 className="text-6xl md:text-7xl font-extralight text-gray-900 tracking-tighter mb-6">
                Trouvez votre place
              </h1>
              <p className="text-xl text-gray-400 font-light tracking-wide">
                Réservez en quelques secondes
              </p>
            </div>

            {/* Barre de recherche ultra-épurée */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-2xl p-1">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-1">
                  <input
                    type="text"
                    placeholder="Où ?"
                    value={searchParams.ville}
                    onChange={(e) => setSearchParams({ ...searchParams, ville: e.target.value })}
                    className="px-6 py-5 bg-transparent rounded-xl border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 text-lg font-light"
                  />
                  <select
                    value={searchParams.vehicule}
                    onChange={(e) => setSearchParams({ ...searchParams, vehicule: e.target.value })}
                    className="px-6 py-5 bg-transparent rounded-xl border-0 focus:outline-none focus:ring-0 text-gray-900 text-lg font-light appearance-none"
                  >
                    <option value="Voiture">🚗 Voiture</option>
                    <option value="Moto">🏍️ Moto</option>
                    <option value="Vélo">🚲 Vélo</option>
                    <option value="Trottinette">🛴 Trottinette</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={searchParams.dateDebut}
                    onChange={(e) => setSearchParams({ ...searchParams, dateDebut: e.target.value })}
                    className="px-6 py-5 bg-transparent rounded-xl border-0 focus:outline-none focus:ring-0 text-gray-900 text-lg font-light"
                  />
                  <input
                    type="datetime-local"
                    value={searchParams.dateFin}
                    onChange={(e) => setSearchParams({ ...searchParams, dateFin: e.target.value })}
                    className="px-6 py-5 bg-transparent rounded-xl border-0 focus:outline-none focus:ring-0 text-gray-900 text-lg font-light"
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-gray-900 text-white py-5 rounded-xl font-light text-lg hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filtres - Ultra-minimaliste */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="sticky top-28">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden w-full mb-4 px-6 py-3 bg-gray-100 rounded-xl text-gray-900 font-light"
                >
                  {showFilters ? 'Masquer' : 'Filtres'}
                </button>

                <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  {/* Tri */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-light text-gray-500 mb-4 uppercase tracking-wider">Trier</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'distance', label: 'Distance' },
                        { value: 'prix_asc', label: 'Prix ↑' },
                        { value: 'prix_desc', label: 'Prix ↓' },
                        { value: 'note', label: 'Note' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setSearchParams({ ...searchParams, sort: option.value })}
                          className={`w-full px-4 py-2.5 rounded-lg text-left text-sm transition-all ${
                            searchParams.sort === option.value
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-light text-gray-500 mb-4 uppercase tracking-wider">Prix max</h3>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.prixMax}
                      onChange={(e) => setFilters({ ...filters, prixMax: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-center mt-3 text-2xl font-extralight text-gray-900">
                      {filters.prixMax}€
                    </div>
                  </div>

                  {/* Services */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-light text-gray-500 mb-4 uppercase tracking-wider">Services</h3>
                    <div className="space-y-2">
                      {servicesDisponibles.map(service => (
                        <label key={service} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filters.services.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters({ ...filters, services: [...filters.services, service] });
                              } else {
                                setFilters({ ...filters, services: filters.services.filter(s => s !== service) });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                            {service}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des parkings */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extralight text-gray-900">
                  {filteredParkings.length} {filteredParkings.length > 1 ? 'parkings' : 'parking'}
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                </div>
              ) : filteredParkings.length === 0 ? (
                <div className="text-center py-32">
                  <div className="text-7xl mb-6 font-extralight">🅿️</div>
                  <h3 className="text-2xl font-extralight text-gray-900 mb-3">Aucun parking</h3>
                  <p className="text-gray-400 font-light">Modifiez vos critères de recherche</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredParkings.map(parking => (
                    <ParkingCard
                      key={parking.id}
                      parking={parking}
                      price={calculatePrice(parking)}
                      onBook={() => handleBooking(parking)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de réservation */}
      {showBookingModal && selectedParking && (
        <BookingModal
          parking={selectedParking}
          searchParams={searchParams}
          price={calculatePrice(selectedParking)}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedParking(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setSelectedParking(null);
            navigate('/mes-reservations');
          }}
        />
      )}
      <Footer />
    </>
  );
};

// Composant ParkingCard ultra-minimaliste
const ParkingCard = ({ parking, price, onBook }) => {
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-900 transition-all duration-500 hover:shadow-2xl">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-7xl font-extralight">
            🅿️
          </div>
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-light text-gray-900">
            {parking.places_disponibles} places
          </div>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-light text-gray-900 flex items-center gap-1">
            ⭐ {parking.note}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-3xl font-extralight text-gray-900 mb-2">{parking.nom}</h3>
              <p className="text-gray-400 font-light text-sm mb-1">
                📍 {parking.adresse}
              </p>
              <p className="text-gray-300 text-xs font-light">
                {parking.distance}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extralight text-gray-900 mb-1">{price}€</div>
              <div className="text-xs text-gray-400 font-light">total</div>
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-2 mb-6">
            {parking.services.slice(0, 4).map(service => (
              <span
                key={service}
                className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-light"
              >
                {service}
              </span>
            ))}
          </div>

          {/* Bouton */}
          <button
            onClick={onBook}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-light hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal ultra-minimaliste
const BookingModal = ({ parking, searchParams, price, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dateDebut: searchParams.dateDebut,
    dateFin: searchParams.dateFin,
    vehicule: searchParams.vehicule,
    immatriculation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const debut = new Date(formData.dateDebut);
    const fin = new Date(formData.dateFin);
    const now = new Date();
    
    if (debut < now) {
      alert('❌ La date de début ne peut pas être dans le passé');
      return;
    }
    
    if (fin <= debut) {
      alert('❌ La date de fin doit être après la date de début');
      return;
    }
    
    const diffMinutes = (fin - debut) / (1000 * 60);
    if (diffMinutes < 30) {
      alert('❌ Durée minimum: 30 minutes');
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await apiService.reserveParking(token, parking.id, {
        date_debut: formData.dateDebut,
        date_fin: formData.dateFin,
        vehicule: formData.vehicule,
        immatriculation: formData.immatriculation
      });

      if (response.success) {
        alert(`✅ ${response.message}\n\n💰 ${response.reservation.montant}€`);
        onSuccess();
      }
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-3xl font-extralight text-gray-900">Confirmer</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-extralight text-gray-900 mb-2">{parking.nom}</h3>
            <p className="text-gray-500 font-light mb-4">📍 {parking.adresse}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-500 font-light">Total</span>
              <span className="text-3xl font-extralight text-gray-900">{price}€</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-light text-gray-500 mb-2 uppercase tracking-wider">
                Début
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 rounded-xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-gray-900 font-light"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-gray-500 mb-2 uppercase tracking-wider">
                Fin
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 rounded-xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-gray-900 font-light"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-gray-500 mb-2 uppercase tracking-wider">
                Véhicule
              </label>
              <select
                required
                value={formData.vehicule}
                onChange={(e) => setFormData({ ...formData, vehicule: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 rounded-xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-gray-900 font-light"
              >
                {parking.type_vehicules.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-light hover:bg-gray-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-light hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Réservation...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Reservation;
