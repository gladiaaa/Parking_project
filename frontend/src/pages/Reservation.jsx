import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  MapPin, 
  Search, 
  Calendar, 
  Car, 
  Bike, 
  Zap, 
  List, 
  Map, 
  Star, 
  X, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  SquareParking
} from 'lucide-react';

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
    prixMax: 10,
    noteMin: 0,
    services: []
  });

  const [activeFilter, setActiveFilter] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map' for mobile

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
    <div className="flex flex-col h-screen bg-white overflow-hidden">
        <Header />
        
        <div className="flex flex-1 pt-[72px] overflow-hidden">
            {/* COLONNE GAUCHE : LISTE + RECHERCHE */}
            <div className={`w-full lg:w-[650px] flex flex-col h-full border-r border-gray-200 bg-white z-10 shadow-xl ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* BARRE DE RECHERCHE (Sticky) */}
                <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-20">
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Où cherchez-vous ?" 
                                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-lg font-medium text-gray-900 focus:ring-2 focus:ring-black transition-all"
                                value={searchParams.ville}
                                onChange={(e) => setSearchParams({ ...searchParams, ville: e.target.value })}
                            />
                        </div>
                        <button onClick={handleSearch} className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition-colors shadow-md">
                            Rechercher
                        </button>
                    </div>

                    {/* FILTRES RAPIDES */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                         {/* Date Picker Button */}
                         <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:border-black transition-colors whitespace-nowrap group relative">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>Dates</span>
                            {/* Date Inputs Popup (Simplified for demo) */}
                            <div className="absolute top-full left-0 mt-2 p-4 bg-white shadow-xl rounded-xl border border-gray-100 hidden group-hover:block min-w-[300px] z-50">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Début</label>
                                        <input type="datetime-local" value={searchParams.dateDebut} onChange={(e) => setSearchParams({ ...searchParams, dateDebut: e.target.value })} className="w-full text-sm border-gray-200 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Fin</label>
                                        <input type="datetime-local" value={searchParams.dateFin} onChange={(e) => setSearchParams({ ...searchParams, dateFin: e.target.value })} className="w-full text-sm border-gray-200 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Type */}
                        <select 
                            value={searchParams.vehicule}
                            onChange={(e) => setSearchParams({ ...searchParams, vehicule: e.target.value })}
                            className="bg-white border border-gray-200 px-3 py-2 rounded-full text-sm font-medium text-gray-700 cursor-pointer hover:border-black transition-colors outline-none appearance-none"
                        >
                            <option value="Voiture">Voiture</option>
                            <option value="Moto">Moto</option>
                            <option value="Vélo">Vélo</option>
                        </select>

                        {servicesDisponibles.slice(0, 3).map(service => (
                            <button
                                key={service}
                                onClick={() => {
                                    if (filters.services.includes(service)) {
                                        setFilters({ ...filters, services: filters.services.filter(s => s !== service) });
                                    } else {
                                        setFilters({ ...filters, services: [...filters.services, service] });
                                    }
                                }}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                                    filters.services.includes(service)
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                                }`}
                            >
                                {service}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LISTE DES RÉSULTATS (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <h2 className="text-xl font-bold text-gray-900">{filteredParkings.length} parkings disponibles</h2>
                        <span className="text-sm text-gray-500 font-medium cursor-pointer hover:text-black">Trier par pertinence ▼</span>
                    </div>

                    {loading ? (
                         <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
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
                    {filteredParkings.length === 0 && !loading && (
                        <div className="text-center py-20 text-gray-500">Aucun parking trouvé dans cette zone.</div>
                    )}
                </div>
            </div>

            {/* COLONNE DROITE : CARTE (Full height) */}
            <div className={`flex-1 bg-gray-200 relative ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
                {/* Placeholder Carte Type Google Maps */}
                <div className="absolute inset-0 bg-[#e5e7eb] flex items-center justify-center overflow-hidden">
                    <div className="text-center opacity-30 select-none pointer-events-none flex flex-col items-center">
                        <Map className="w-32 h-32 mb-4 text-gray-400" />
                        <p className="text-3xl font-bold text-gray-400">Carte Interactive</p>
                    </div>
                    {/* Fake Map Pins */}
                    {filteredParkings.map((p, i) => (
                        <div key={p.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style={{ top: `${30 + (i * 15) % 60}%`, left: `${30 + (i * 20) % 60}%` }}>
                            <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg font-bold text-sm border border-gray-200 group-hover:bg-black group-hover:text-white transition-colors">
                                {calculatePrice(p)}€
                            </div>
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white mx-auto group-hover:border-t-black"></div>
                        </div>
                    ))}
                </div>

                {/* Mobile Toggle Button */}
                <button 
                    className="lg:hidden absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-xl font-bold z-50 flex items-center gap-2"
                    onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                >
                    {viewMode === 'list' ? <><Map className="w-5 h-5" /> Carte</> : <><List className="w-5 h-5" /> Liste</>}
                </button>
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
    </div>
  );
};

// --- COMPOSANTS ENFANTS ---

const ParkingCard = ({ parking, price, onBook }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group flex gap-4">
            {/* Image */}
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center"><SquareParking className="w-16 h-16 text-gray-300" /></div>
                {parking.note >= 4.5 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                        Coup de cœur
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{parking.nom}</h3>
                        <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-xs font-bold text-gray-900">
                            <Star className="w-3 h-3 fill-current" /> {parking.note}
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-2 truncate">{parking.adresse}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{parking.places_disponibles} places dispo</span>
                        {parking.services.slice(0, 2).map(s => (
                            <span key={s} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                        ))}
                    </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                    <div>
                        <span className="text-lg font-bold text-primary">{price}€</span>
                        <span className="text-xs text-gray-500 ml-1">/ total</span>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onBook();
                        }}
                        className="bg-white border border-gray-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-black hover:text-white hover:border-black transition-all"
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
      alert('La date de début ne peut pas être dans le passé');
      return;
    }
    
    if (fin <= debut) {
      alert('La date de fin doit être après la date de début');
      return;
    }
    
    const diffMinutes = (fin - debut) / (1000 * 60);
    if (diffMinutes < 30) {
      alert('Durée minimum: 30 minutes');
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
        alert(`${response.message}\n\nMontant: ${response.reservation.montant}€`);
        onSuccess();
      }
    } catch (error) {
      alert(error.message);
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
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-extralight text-gray-900 mb-2">{parking.nom}</h3>
            <p className="text-gray-500 font-light mb-4 flex items-center gap-1"><MapPin className="w-4 h-4" /> {parking.adresse}</p>
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
