import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';

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
    prixMax: 100,
    noteMin: 0,
    services: []
  });

  const [showFilters, setShowFilters] = useState(false);

  // Charger les parkings au montage
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
      const response = await apiService.searchParkings(searchParams);
      setParkings(response.parkings);
      setFilteredParkings(response.parkings);
    } catch (error) {
      console.error('Erreur chargement parkings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let results = [...parkings];

    // Filtre prix
    results = results.filter(p => p.tarif_horaire <= filters.prixMax);

    // Filtre note
    results = results.filter(p => p.note >= filters.noteMin);

    // Filtre services
    if (filters.services.length > 0) {
      results = results.filter(p =>
        filters.services.every(service => p.services.includes(service))
      );
    }

    setFilteredParkings(results);
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
    if (!searchParams.dateDebut || !searchParams.dateFin) return parking.tarif_horaire;

    const debut = new Date(searchParams.dateDebut);
    const fin = new Date(searchParams.dateFin);
    const heures = Math.ceil((fin - debut) / (1000 * 60 * 60));

    if (heures <= 24) {
      return (heures * parking.tarif_horaire).toFixed(2);
    } else {
      const jours = Math.ceil(heures / 24);
      return (jours * parking.tarif_journalier).toFixed(2);
    }
  };

  const servicesDisponibles = ['Couvert', 'Gardé', 'Sécurisé', 'Vidéo-surveillance', 'Bornes électriques', 'Lavage auto', 'Accessible PMR'];

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      {/* Hero Search Section - Style Apple/Tesla */}
      <div className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Titre minimaliste */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 tracking-tight mb-4">
              Trouvez votre place
            </h1>
            <p className="text-xl text-gray-500 font-light">
              Simple. Rapide. Intelligent.
            </p>
          </div>

          {/* Barre de recherche ultra-moderne */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Ville */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Où ?"
                    value={searchParams.ville}
                    onChange={(e) => setSearchParams({ ...searchParams, ville: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-primary transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Type véhicule */}
                <div className="relative">
                  <select
                    value={searchParams.vehicule}
                    onChange={(e) => setSearchParams({ ...searchParams, vehicule: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-primary transition-all text-gray-900 appearance-none"
                  >
                    <option value="Voiture">🚗 Voiture</option>
                    <option value="Moto">🏍️ Moto</option>
                    <option value="Vélo">🚲 Vélo</option>
                    <option value="Trottinette">🛴 Trottinette</option>
                  </select>
                </div>

                {/* Date début */}
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={searchParams.dateDebut}
                    onChange={(e) => setSearchParams({ ...searchParams, dateDebut: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-primary transition-all text-gray-900"
                  />
                </div>

                {/* Date fin */}
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={searchParams.dateFin}
                    onChange={(e) => setSearchParams({ ...searchParams, dateFin: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-primary transition-all text-gray-900"
                  />
                </div>
              </div>

              {/* Bouton recherche */}
              <button
                onClick={handleSearch}
                className="w-full mt-3 bg-gray-900 text-white py-5 rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres - Style minimaliste */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-28">
              {/* Toggle filtres mobile */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden w-full mb-4 px-6 py-3 bg-gray-100 rounded-2xl text-gray-900 font-medium"
              >
                {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              </button>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Tri */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Trier par</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'distance', label: 'Distance' },
                      { value: 'prix_asc', label: 'Prix croissant' },
                      { value: 'prix_desc', label: 'Prix décroissant' },
                      { value: 'note', label: 'Meilleures notes' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSearchParams({ ...searchParams, sort: option.value })}
                        className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                          searchParams.sort === option.value
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prix maximum */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Prix max/heure</h3>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.prixMax}
                    onChange={(e) => setFilters({ ...filters, prixMax: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center mt-2 text-2xl font-light text-gray-900">
                    {filters.prixMax}€
                  </div>
                </div>

                {/* Note minimum */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Note minimum</h3>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map(note => (
                      <button
                        key={note}
                        onClick={() => setFilters({ ...filters, noteMin: note })}
                        className={`flex-1 py-2 rounded-xl transition-all ${
                          filters.noteMin === note
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {note === 0 ? 'Tous' : `${note}★`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Services</h3>
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
                          className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
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
            {/* Header résultats */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-light text-gray-900">
                {filteredParkings.length} {filteredParkings.length > 1 ? 'parkings disponibles' : 'parking disponible'}
              </h2>
            </div>

            {/* Chargement */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredParkings.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🅿️</div>
                    <h3 className="text-2xl font-light text-gray-900 mb-2">Aucun parking trouvé</h3>
                    <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
                  </div>
                ) : (
                  filteredParkings.map(parking => (
                    <ParkingCard
                      key={parking.id}
                      parking={parking}
                      price={calculatePrice(parking)}
                      onBook={() => handleBooking(parking)}
                    />
                  ))
                )}
              </div>
            )}
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
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};

// Composant ParkingCard ultra-design
const ParkingCard = ({ parking, price, onBook }) => {
  return (
    <div className="group bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-80 h-64 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-6xl">
            🅿️
          </div>
          {/* Badge disponibilité */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-900">
            {parking.places_disponibles} places
          </div>
          {/* Badge note */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-900 flex items-center gap-1">
            ⭐ {parking.note}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-medium text-gray-900 mb-2">{parking.nom}</h3>
              <p className="text-gray-500 flex items-center gap-2">
                📍 {parking.adresse}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                À {parking.distance} de votre position
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-light text-gray-900">{price}€</div>
              <div className="text-sm text-gray-500">par session</div>
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-2 mb-6">
            {parking.services.slice(0, 4).map(service => (
              <span
                key={service}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {service}
              </span>
            ))}
            {parking.services.length > 4 && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                +{parking.services.length - 4}
              </span>
            )}
          </div>

          {/* Horaires */}
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              🕐 {parking.horaire_ouverture} - {parking.horaire_fermeture}
            </span>
            <span className="flex items-center gap-2">
              🚗 {parking.type_vehicules.join(', ')}
            </span>
          </div>

          {/* Bouton réserver */}
          <button
            onClick={onBook}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Réserver maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant Modal de réservation
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
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await apiService.reserveParking(token, parking.id, {
        date_debut: formData.dateDebut,
        date_fin: formData.dateFin,
        montant: parseFloat(price)
      });

      if (response.success) {
        alert('✅ Réservation confirmée !');
        onSuccess();
      }
    } catch (error) {
      alert('❌ Erreur lors de la réservation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-3xl font-light text-gray-900">Confirmer la réservation</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Récap parking */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-medium text-gray-900 mb-2">{parking.nom}</h3>
            <p className="text-gray-600 mb-4">📍 {parking.adresse}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-gray-600">Montant total</span>
              <span className="text-3xl font-light text-gray-900">{price}€</span>
            </div>
          </div>

          {/* Formulaire */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure de début
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure de fin
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de véhicule
              </label>
              <select
                required
                value={formData.vehicule}
                onChange={(e) => setFormData({ ...formData, vehicule: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-gray-900"
              >
                {parking.type_vehicules.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immatriculation (optionnel)
              </label>
              <input
                type="text"
                placeholder="AA-123-BB"
                value={formData.immatriculation}
                onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-0 focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Réservation...' : 'Confirmer et payer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Reservation;

