import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [stationnements, setStationnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

useEffect(() => {
  (async () => {
    try {
      // Vérifie session via cookie
      const meRes = await apiService.me();
      const user = meRes?.user || meRes;
      localStorage.setItem("user", JSON.stringify(user));
      await loadData();
    } catch {
      navigate("/login");
    }
  })();
}, [navigate]);

const loadData = async () => {
  setLoading(true);
  setError("");

  try {
    const reservationsResult = await apiService.getMyReservations();
    const allReservations = reservationsResult?.reservations || reservationsResult?.data || [];
    setReservations(allReservations);

    const active = allReservations.filter((r) => r.date_entree && !r.date_sortie);
    setStationnements(active);
  } catch (err) {
    setError(err.message || "Erreur lors du chargement des données");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-zenpark text-white py-12">
          <div className="container mx-auto px-6 lg:px-12">
            <h1 className="text-4xl font-serif font-normal mb-2">
              Bonjour {user?.firstname || 'Utilisateur'}
        </h1>
            <p className="text-white/90 text-lg">
              Bienvenue sur votre espace personnel
            </p>
          </div>
        </section>

        <div className="container mx-auto px-6 lg:px-12 py-12">
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
            {error}
          </div>
        )}

          {/* Quick Actions */}
          <div className="mb-12">
          <Link
            to="/"
              className="inline-block bg-zenpark text-white px-8 py-4 rounded-xl hover:bg-zenpark-700 transition font-medium"
          >
              Nouvelle réservation
          </Link>
        </div>

        {/* Section Réservations */}
        <section className="mb-12">
            <h2 className="text-3xl font-serif font-normal mb-6 text-gray-900">
            Mes réservations
          </h2>

          {loading ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : reservations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <p className="text-gray-600 mb-6">
                Vous n'avez aucune réservation pour le moment.
              </p>
              <Link
                to="/"
                  className="inline-block bg-zenpark text-white px-8 py-3 rounded-xl hover:bg-zenpark-700 transition font-medium"
              >
                Réserver une place
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                    className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
                >
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {reservation.parking_nom || "Parking"}
                  </h3>
                    
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600 text-sm">
                      {reservation.date_debut && reservation.date_fin
                        ? `${new Date(reservation.date_debut).toLocaleDateString('fr-FR')} - ${new Date(reservation.date_fin).toLocaleDateString('fr-FR')}`
                        : "Date non spécifiée"}
                    </p>
                    <p className="text-gray-700">
                        <span className="font-medium">Statut:</span>{" "}
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        reservation.statut === 'confirmée' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reservation.statut || "En attente"}
                      </span>
                    </p>
                    {reservation.montant && (
                        <p className="text-lg font-semibold text-zenpark">
                        {reservation.montant} €
                      </p>
                    )}
                  </div>
                    
                  <Link
                    to={`/parking/${reservation.parking_id}`}
                      className="block w-full text-center bg-gray-100 text-gray-900 py-2 rounded-xl hover:bg-gray-200 transition font-medium"
                  >
                    Voir les détails
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

          {/* Section Stationnements actifs */}
          {stationnements.length > 0 && (
        <section className="mb-12">
              <h2 className="text-3xl font-serif font-normal mb-6 text-gray-900">
                Stationnements actifs
          </h2>
              
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stationnements.map((stationnement) => (
                <div
                  key={stationnement.id}
                    className="bg-white rounded-2xl shadow p-6"
                >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                    {stationnement.parking_nom || "Parking"}
                  </h3>
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm">
                      Début: {stationnement.date_debut
                        ? new Date(stationnement.date_debut).toLocaleString('fr-FR')
                        : "N/A"}
                    </p>
                </div>
              ))}
            </div>
            </section>
          )}
          </div>
      </main>
      <Footer />
    </div>
  );
}
