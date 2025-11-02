import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(null);
  
  // Statistiques
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [activeReservations, setActiveReservations] = useState(0);
  const [activeStationnements, setActiveStationnements] = useState(0);

  // Formulaire pour ajouter un parking
  const [newParking, setNewParking] = useState({
    nom: "",
    adresse: "",
    nombre_places: "",
    tarif_horaire: "",
    tarif_journalier: "",
    tarif_mensuel: "",
    horaire_ouverture: "",
    horaire_fermeture: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Charger toutes les données
    loadData();
  }, [navigate]);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");

    try {
      // Récupérer les parkings du propriétaire
      const parkingsResult = await apiService.getOwnerParkings(token);
      if (parkingsResult.success) {
        setParkings(parkingsResult.parkings || []);
      }

      // Récupérer le chiffre d'affaires mensuel
      const revenueResult = await apiService.getMonthlyRevenue(token);
      if (revenueResult.success) {
        setMonthlyRevenue(revenueResult.revenus_mensuels || 0);
      }

      // Récupérer les réservations en cours
      const reservationsResult = await apiService.getActiveReservations(token);
      if (reservationsResult.success) {
        setActiveReservations(reservationsResult.reservations_en_cours || 0);
      }

      // Récupérer les stationnements actifs
      const stationnementsResult = await apiService.getActiveStationnements(token);
      if (stationnementsResult.success) {
        setActiveStationnements(stationnementsResult.stationnements_actifs || 0);
      }
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleAddParking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    setError("");

    try {
      const result = await apiService.addParking(token, newParking);
      
      if (result.success) {
        setParkings([...parkings, result.parking]);
        setNewParking({
          nom: "",
          adresse: "",
          nombre_places: "",
          tarif_horaire: "",
          tarif_journalier: "",
          tarif_mensuel: "",
          horaire_ouverture: "",
          horaire_fermeture: "",
        });
        setShowAddForm(false);
        // Recharger les données
        loadData();
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'ajout du parking");
    }
  };

  const handleUpdateParking = async (parkingId, updatedData) => {
    const token = localStorage.getItem("token");
    setError("");

    try {
      // Pour l'instant, simuler la mise à jour
      setParkings(
        parkings.map((p) => (p.id === parkingId ? { ...p, ...updatedData } : p))
      );
      setShowEditForm(null);
    } catch (err) {
      setError(err.message || "Erreur lors de la modification");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Espace propriétaire
          </h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#34A853] text-white px-6 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
          >
            + Ajouter un parking
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Section Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Chiffre d'affaires mensuel */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Chiffre d'affaires mensuel
            </h3>
            <p className="text-3xl font-bold text-[#34A853]">
              {monthlyRevenue.toFixed(2)} €
            </p>
          </div>

          {/* Réservations en cours */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Réservations en cours
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {activeReservations}
            </p>
          </div>

          {/* Stationnements actifs */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Stationnements actifs
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {activeStationnements}
            </p>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Ajouter un parking</h2>
            <form onSubmit={handleAddParking} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nom du parking"
                  value={newParking.nom}
                  onChange={(e) =>
                    setNewParking({ ...newParking, nom: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
                <input
                  type="text"
                  placeholder="Adresse"
                  value={newParking.adresse}
                  onChange={(e) =>
                    setNewParking({ ...newParking, adresse: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
                <input
                  type="number"
                  placeholder="Nombre de places"
                  value={newParking.nombre_places}
                  onChange={(e) =>
                    setNewParking({
                      ...newParking,
                      nombre_places: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Tarif horaire (€)"
                  value={newParking.tarif_horaire}
                  onChange={(e) =>
                    setNewParking({
                      ...newParking,
                      tarif_horaire: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Tarif journalier (€)"
                  value={newParking.tarif_journalier}
                  onChange={(e) =>
                    setNewParking({
                      ...newParking,
                      tarif_journalier: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Tarif mensuel (€)"
                  value={newParking.tarif_mensuel}
                  onChange={(e) =>
                    setNewParking({
                      ...newParking,
                      tarif_mensuel: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
                <input
                  type="time"
                  placeholder="Heure d'ouverture"
                  value={newParking.horaire_ouverture}
                  onChange={(e) =>
                    setNewParking({
                      ...newParking,
                      horaire_ouverture: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
                <input
                  type="time"
                  placeholder="Heure de fermeture"
                  value={newParking.horaire_fermeture}
                  onChange={(e) =>
                    setNewParking({
                      ...newParking,
                      horaire_fermeture: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#34A853]"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-[#34A853] text-white px-6 py-2 rounded-lg hover:bg-[#2d8f45] transition font-medium"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des parkings */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Mes parkings
          </h2>
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : parkings.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">
                Vous n'avez pas encore de parking. Ajoutez-en un !
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-[#34A853] text-white px-6 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
              >
                Ajouter un parking
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parkings.map((parking) => (
                <div
                  key={parking.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    {parking.nom}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">{parking.adresse}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm">
                      <span className="font-semibold">Places:</span>{" "}
                      {parking.nombre_places} ({parking.places_disponibles || parking.nombre_places} disponibles)
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Tarif horaire:</span>{" "}
                      {parking.tarif_horaire} €
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Tarif journalier:</span>{" "}
                      {parking.tarif_journalier} €
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Tarif mensuel:</span>{" "}
                      {parking.tarif_mensuel} €
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Horaires:</span>{" "}
                      {parking.horaire_ouverture} - {parking.horaire_fermeture}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        setShowEditForm(
                          showEditForm === parking.id ? null : parking.id
                        )
                      }
                      className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                    >
                      Modifier
                    </button>
                  </div>

                  {/* Formulaire d'édition */}
                  {showEditForm === parking.id && (
                    <div className="mt-4 pt-4 border-t">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const updatedData = {
                            tarif_horaire: formData.get("tarif_horaire"),
                            tarif_journalier: formData.get("tarif_journalier"),
                            tarif_mensuel: formData.get("tarif_mensuel"),
                            horaire_ouverture: formData.get("horaire_ouverture"),
                            horaire_fermeture: formData.get("horaire_fermeture"),
                          };
                          handleUpdateParking(parking.id, updatedData);
                        }}
                        className="space-y-2"
                      >
                        <input
                          type="number"
                          step="0.01"
                          name="tarif_horaire"
                          defaultValue={parking.tarif_horaire}
                          placeholder="Tarif horaire"
                          className="w-full px-3 py-1 border rounded-lg"
                        />
                        <input
                          type="number"
                          step="0.01"
                          name="tarif_journalier"
                          defaultValue={parking.tarif_journalier}
                          placeholder="Tarif journalier"
                          className="w-full px-3 py-1 border rounded-lg"
                        />
                        <input
                          type="number"
                          step="0.01"
                          name="tarif_mensuel"
                          defaultValue={parking.tarif_mensuel}
                          placeholder="Tarif mensuel"
                          className="w-full px-3 py-1 border rounded-lg"
                        />
                        <input
                          type="time"
                          name="horaire_ouverture"
                          defaultValue={parking.horaire_ouverture}
                          className="w-full px-3 py-1 border rounded-lg"
                        />
                        <input
                          type="time"
                          name="horaire_fermeture"
                          defaultValue={parking.horaire_fermeture}
                          className="w-full px-3 py-1 border rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-[#34A853] text-white py-1 rounded hover:bg-[#2d8f45]"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowEditForm(null)}
                            className="flex-1 bg-gray-300 text-gray-700 py-1 rounded hover:bg-gray-400"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
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
