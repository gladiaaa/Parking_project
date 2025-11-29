import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MesReservations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Vous devez être connecté pour voir vos réservations');
        navigate('/login');
        return;
      }

      const response = await apiService.getReservations(token);
      if (response.success) {
        setReservations(response.reservations || []);
      } else {
        alert('❌ Erreur lors du chargement des réservations');
      }
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      if (error.message.includes('Utilisateur non trouvé') || error.message.includes('Token')) {
        alert('❌ Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        alert('❌ Erreur: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReservations = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return reservations.filter(r => new Date(r.date_debut) > now);
      case 'past':
        return reservations.filter(r => new Date(r.date_fin) < now);
      case 'cancelled':
        return reservations.filter(r => r.statut === 'annulée');
      default:
        return reservations;
    }
  };

  const filteredReservations = getFilteredReservations();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (reservation) => {
    const now = new Date();
    const debut = new Date(reservation.date_debut);
    const fin = new Date(reservation.date_fin);

    if (reservation.statut === 'annulée') {
      return <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">Annulée</span>;
    }
    if (now < debut) {
      return <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">À venir</span>;
    }
    if (now >= debut && now <= fin) {
      return <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">En cours</span>;
    }
    return <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Terminée</span>;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight">
              Mes réservations
            </h1>
            <p className="text-xl text-gray-500 font-light">
              Gérez toutes vos réservations en un seul endroit
            </p>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { value: 'all', label: 'Toutes', count: reservations.length },
              { value: 'upcoming', label: 'À venir', count: reservations.filter(r => new Date(r.date_debut) > new Date()).length },
              { value: 'past', label: 'Passées', count: reservations.filter(r => new Date(r.date_fin) < new Date()).length },
              { value: 'cancelled', label: 'Annulées', count: reservations.filter(r => r.statut === 'annulée').length }
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                  filter === item.value
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>

          {/* Bouton nouvelle réservation */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/reservation')}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-medium hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              ➕ Nouvelle réservation
            </button>
          </div>

          {/* Liste des réservations */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-light text-gray-900 mb-2">
                Aucune réservation
              </h3>
              <p className="text-gray-500 mb-8">
                {filter === 'all' 
                  ? "Vous n'avez pas encore de réservation"
                  : `Vous n'avez pas de réservation ${filter === 'upcoming' ? 'à venir' : filter === 'past' ? 'passée' : 'annulée'}`
                }
              </p>
              <button
                onClick={() => navigate('/reservation')}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg"
              >
                Faire une réservation
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReservations.map(reservation => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  statusBadge={getStatusBadge(reservation)}
                  formatDate={formatDate}
                  onCancel={loadReservations}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

// Composant carte de réservation
const ReservationCard = ({ reservation, statusBadge, formatDate, onCancel }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  
  const handleCancel = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }
    
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiService.cancelReservation(token, reservation.id);
      
      if (response.success) {
        alert(`✅ ${response.message}\n\nVotre place a été libérée et est maintenant disponible pour d'autres utilisateurs.`);
        onCancel(); // Recharger les réservations
      }
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-500">
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-medium text-gray-900">
                {reservation.parking_nom}
              </h3>
              {statusBadge}
            </div>
            <p className="text-gray-500 mb-2">
              📍 {reservation.parking_adresse || 'Adresse non disponible'}
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-3">
              <span>Réservation #{reservation.id}</span>
              {reservation.vehicule && <span>🚗 {reservation.vehicule}</span>}
              {reservation.immatriculation && <span>🔖 {reservation.immatriculation}</span>}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-light text-gray-900 mb-1">
              {reservation.montant}€
            </div>
            <div className="text-sm text-gray-500">Montant total</div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 p-6 bg-gray-50 rounded-2xl">
          <div>
            <div className="text-sm text-gray-500 mb-1">Début</div>
            <div className="text-gray-900 font-medium">
              {formatDate(reservation.date_debut)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Fin</div>
            <div className="text-gray-900 font-medium">
              {formatDate(reservation.date_fin)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            {showDetails ? 'Masquer les détails' : 'Voir les détails'}
          </button>
          {reservation.statut !== 'annulée' && new Date(reservation.date_debut) > new Date() && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Annulation...' : 'Annuler la réservation'}
            </button>
          )}
        </div>

        {/* Détails supplémentaires */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Durée</span>
              <span className="text-gray-900 font-medium">
                {Math.ceil((new Date(reservation.date_fin) - new Date(reservation.date_debut)) / (1000 * 60 * 60))} heures
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type de stationnement</span>
              <span className="text-gray-900 font-medium">Horaire</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date de réservation</span>
              <span className="text-gray-900 font-medium">
                {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesReservations;

