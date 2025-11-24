import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";

export default function ParkingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parking, setParking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    date_debut: "",
    date_fin: "",
    type: "journalier", // horaire, journalier, mensuel
  });

  useEffect(() => {
    loadParkingDetails();
  }, [id]);

  const loadParkingDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiService.getParkingDetails(id);
      if (result.success) {
        setParking(result.parking);
      }
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des détails du parking");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setError("");

    try {
      const result = await apiService.reserveParking(token, id, reservationForm);
      
      if (result.success) {
        alert("Réservation confirmée avec succès !");
        navigate("/dashboard-user");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la réservation");
    }
  };

  const calculatePrice = () => {
    if (!parking || !reservationForm.date_debut || !reservationForm.date_fin) {
      return 0;
    }

    const start = new Date(reservationForm.date_debut);
    const end = new Date(reservationForm.date_fin);
    const diffHours = (end - start) / (1000 * 60 * 60);

    switch (reservationForm.type) {
      case "horaire":
        return (diffHours * parseFloat(parking.tarif_horaire)).toFixed(2);
      case "journalier":
        const days = Math.ceil(diffHours / 24);
        return (days * parseFloat(parking.tarif_journalier)).toFixed(2);
      case "mensuel":
        return parseFloat(parking.tarif_mensuel).toFixed(2);
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Chargement...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !parking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              to="/"
              className="text-[#34A853] hover:underline font-medium"
            >
              Retour à l'accueil
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {parking && (
          <>
            {/* En-tête du parking */}
            <div className="mb-8">
              <Link
                to="/"
                className="text-[#34A853] hover:underline font-medium mb-4 inline-block"
              >
                ← Retour à la liste
              </Link>
              <h1 className="text-4xl font-bold mb-4 text-gray-800">
                {parking.nom}
              </h1>
              <p className="text-lg text-gray-600">{parking.adresse}</p>
            </div>

            {/* Informations du parking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  Informations
                </h2>
                <div className="space-y-3">
                  <p>
                    <span className="font-semibold">Places disponibles:</span>{" "}
                    {parking.places_disponibles || parking.nombre_places} / {parking.nombre_places}
                  </p>
                  <p>
                    <span className="font-semibold">Horaires:</span>{" "}
                    {parking.horaire_ouverture} - {parking.horaire_fermeture}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  Tarifs
                </h2>
                <div className="space-y-3">
                  <p>
                    <span className="font-semibold">Horaire:</span>{" "}
                    {parking.tarif_horaire} €
                  </p>
                  <p>
                    <span className="font-semibold">Journalier:</span>{" "}
                    {parking.tarif_journalier} €
                  </p>
                  <p>
                    <span className="font-semibold">Mensuel:</span>{" "}
                    {parking.tarif_mensuel} €
                  </p>
                </div>
              </div>
            </div>

            {/* Formulaire de réservation */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Réserver ce parking
              </h2>
              
              {!showReservationForm ? (
                <button
                  onClick={() => setShowReservationForm(true)}
                  className="bg-[#34A853] text-white px-6 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
                >
                  Réserver
                </button>
              ) : (
                <form onSubmit={handleReserve} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Type de réservation
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="horaire"
                          checked={reservationForm.type === "horaire"}
                          onChange={(e) =>
                            setReservationForm({
                              ...reservationForm,
                              type: e.target.value,
                            })
                          }
                          className="mr-2"
                        />
                        <span>Horaire</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="journalier"
                          checked={reservationForm.type === "journalier"}
                          onChange={(e) =>
                            setReservationForm({
                              ...reservationForm,
                              type: e.target.value,
                            })
                          }
                          className="mr-2"
                        />
                        <span>Journalier</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="mensuel"
                          checked={reservationForm.type === "mensuel"}
                          onChange={(e) =>
                            setReservationForm({
                              ...reservationForm,
                              type: e.target.value,
                            })
                          }
                          className="mr-2"
                        />
                        <span>Mensuel</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Date et heure de début
                      </label>
                      <input
                        type="datetime-local"
                        value={reservationForm.date_debut}
                        onChange={(e) =>
                          setReservationForm({
                            ...reservationForm,
                            date_debut: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Date et heure de fin
                      </label>
                      <input
                        type="datetime-local"
                        value={reservationForm.date_fin}
                        onChange={(e) =>
                          setReservationForm({
                            ...reservationForm,
                            date_fin: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                        required
                      />
                    </div>
                  </div>

                  {reservationForm.date_debut && reservationForm.date_fin && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-gray-800">
                        Prix estimé: {calculatePrice()} €
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-[#34A853] text-white px-6 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
                    >
                      Confirmer la réservation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReservationForm(false)}
                      className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

