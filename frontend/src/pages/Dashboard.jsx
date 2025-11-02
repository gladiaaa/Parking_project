import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Dashboard() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Récupérer les réservations
    fetch("http://localhost:8001/api/reservations", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setReservations(data.reservations || data || []);
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des réservations:", err);
        setError("Erreur lors du chargement des données");
      });

    // Récupérer les abonnements
    fetch("http://localhost:8001/api/abonnements", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setAbonnements(data.abonnements || data || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des abonnements:", err);
        setLoading(false);
      });
  }, [navigate]);

  const handleEnterParking = (reservationId) => {
    // Simuler l'entrée dans un parking
    const token = localStorage.getItem("token");
    fetch(`http://localhost:8001/api/reservations/${reservationId}/enter`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Vous êtes entré dans le parking !");
        // Recharger les données
        window.location.reload();
      })
      .catch((err) => {
        alert("Erreur lors de l'entrée dans le parking");
      });
  };

  const handleExitParking = (reservationId) => {
    // Simuler la sortie d'un parking
    const token = localStorage.getItem("token");
    fetch(`http://localhost:8001/api/reservations/${reservationId}/exit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Vous êtes sorti du parking !");
        // Recharger les données
        window.location.reload();
      })
      .catch((err) => {
        alert("Erreur lors de la sortie du parking");
      });
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

          {/* Réservations */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Mes réservations
            </h2>
            {loading ? (
              <p className="text-gray-500">Chargement...</p>
            ) : reservations.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  Vous n'avez aucune réservation pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {reservation.parking_nom || "Parking"}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {reservation.date_debut && reservation.date_fin
                        ? `${new Date(reservation.date_debut).toLocaleDateString()} - ${new Date(reservation.date_fin).toLocaleDateString()}`
                        : "Date non spécifiée"}
                    </p>
                    <p className="text-gray-700 mb-4">
                      <span className="font-semibold">Statut:</span>{" "}
                      {reservation.statut || "En attente"}
                    </p>
                    <div className="flex gap-2">
                      {reservation.statut === "confirmée" && (
                        <>
                          <button
                            onClick={() => handleEnterParking(reservation.id)}
                            className="flex-1 bg-[#34A853] text-white py-2 rounded-lg hover:bg-[#2d8f45] transition font-medium"
                          >
                            Entrer
                          </button>
                          <button
                            onClick={() => handleExitParking(reservation.id)}
                            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition font-medium"
                          >
                            Sortir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Abonnements */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Mes abonnements
            </h2>
            {loading ? (
              <p className="text-gray-500">Chargement...</p>
            ) : abonnements.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  Vous n'avez aucun abonnement pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {abonnements.map((abonnement) => (
                  <div
                    key={abonnement.id}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {abonnement.parking_nom || "Parking"}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Abonnement mensuel
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Prix:</span>{" "}
                      {abonnement.prix_mensuel || "N/A"} €/mois
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
      </main>
      <Footer />
    </div>
  );
}
  