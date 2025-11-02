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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Charger les données
    loadData();
  }, [navigate]);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");

    try {
      // Récupérer les réservations
      const reservationsResult = await apiService.getReservations(token);
      if (reservationsResult.success) {
        setReservations(reservationsResult.reservations || []);
      }

      // Récupérer les stationnements actifs
      const stationnementsResult = await apiService.getStationnements(token);
      if (stationnementsResult.success) {
        setStationnements(stationnementsResult.stationnements || []);
      }
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Mon tableau de bord
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Actions rapides */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link
            to="/"
            className="bg-[#34A853] text-white px-6 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
          >
            Réserver une place
          </Link>
          <Link
            to="/dashboard-user#abonnements"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-medium"
          >
            Voir mes abonnements
          </Link>
        </div>

        {/* Section Réservations */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Mes réservations
          </h2>
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">
                Vous n'avez aucune réservation pour le moment.
              </p>
              <Link
                to="/"
                className="inline-block bg-[#34A853] text-white px-6 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
              >
                Réserver une place
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    {reservation.parking_nom || "Parking"}
                  </h3>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600 text-sm">
                      {reservation.date_debut && reservation.date_fin
                        ? `${new Date(reservation.date_debut).toLocaleDateString('fr-FR')} - ${new Date(reservation.date_fin).toLocaleDateString('fr-FR')}`
                        : "Date non spécifiée"}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Statut:</span>{" "}
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        reservation.statut === 'confirmée' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reservation.statut || "En attente"}
                      </span>
                    </p>
                    {reservation.montant && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Montant:</span>{" "}
                        {reservation.montant} €
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/parking/${reservation.parking_id}`}
                    className="block w-full text-center bg-[#34A853] text-white py-2 rounded-lg hover:bg-[#2d8f45] transition font-medium"
                  >
                    Voir les détails
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section Stationnements */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Mes stationnements actifs
          </h2>
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : stationnements.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                Vous n'avez aucun stationnement actif pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stationnements.map((stationnement) => (
                <div
                  key={stationnement.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    {stationnement.parking_nom || "Parking"}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm">
                      Stationnement en cours
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Début:</span>{" "}
                      {stationnement.date_debut
                        ? new Date(stationnement.date_debut).toLocaleString('fr-FR')
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section Abonnements */}
        <section id="abonnements">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Mes abonnements
          </h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              Vous n'avez aucun abonnement pour le moment.
            </p>
            <Link
              to="/"
              className="inline-block bg-[#34A853] text-white px-6 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
            >
              Voir les abonnements disponibles
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

