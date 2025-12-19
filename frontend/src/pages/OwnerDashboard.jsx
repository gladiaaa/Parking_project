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
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [activeReservations, setActiveReservations] = useState(0);
  const [activeStationnements, setActiveStationnements] = useState(0);

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

    loadData();
  }, [navigate]);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");

    try {
      const parkingsResult = await apiService.getOwnerParkings(token);
      if (parkingsResult.success) {
        setParkings(parkingsResult.parkings || []);
      }

      const revenueResult = await apiService.getMonthlyRevenue(token);
      if (revenueResult.success) {
        setMonthlyRevenue(revenueResult.revenus_mensuels || 0);
      }

      const reservationsResult = await apiService.getActiveReservations(token);
      if (reservationsResult.success) {
        setActiveReservations(reservationsResult.reservations_en_cours || 0);
      }

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
        loadData();
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'ajout du parking");
    }
  };

  const handleUpdateParking = async (parkingId, updatedData) => {
    setError("");
    try {
      setParkings(
        parkings.map((p) => (p.id === parkingId ? { ...p, ...updatedData } : p))
      );
      setShowEditForm(null);
    } catch (err) {
      setError(err.message || "Erreur lors de la modification");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-zenpark text-white py-12">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-serif font-normal mb-2">
            Espace propriétaire
          </h1>
                <p className="text-white/90 text-lg">
                  Gérez vos parkings et suivez vos revenus
                </p>
              </div>
          <button
            onClick={() => setShowAddForm(true)}
                className="hidden md:block bg-white text-zenpark px-6 py-3 rounded-xl hover:bg-gray-100 transition font-medium"
          >
            + Ajouter un parking
          </button>
        </div>
          </div>
        </section>

        <div className="container mx-auto px-6 lg:px-12 py-12">
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
            {error}
          </div>
        )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">Revenus mensuels</h3>
              <p className="text-3xl font-bold text-zenpark">{monthlyRevenue.toFixed(2)} €</p>
          </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">Réservations en cours</h3>
              <p className="text-3xl font-bold text-zenpark">{activeReservations}</p>
          </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">Stationnements actifs</h3>
              <p className="text-3xl font-bold text-zenpark">{activeStationnements}</p>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {showAddForm && (
            <div className="bg-white rounded-2xl shadow p-8 mb-12">
              <h2 className="text-2xl font-serif font-normal mb-6 text-gray-900">
                Ajouter un parking
              </h2>
              
              <form onSubmit={handleAddParking} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nom du parking</label>
                <input
                  type="text"
                      placeholder="Ex: Parking Gare Lyon"
                  value={newParking.nom}
                      onChange={(e) => setNewParking({ ...newParking, nom: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Adresse</label>
                <input
                  type="text"
                      placeholder="123 Rue de la Gare"
                  value={newParking.adresse}
                      onChange={(e) => setNewParking({ ...newParking, adresse: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nombre de places</label>
                <input
                  type="number"
                      placeholder="50"
                  value={newParking.nombre_places}
                      onChange={(e) => setNewParking({ ...newParking, nombre_places: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                      min="1"
                />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tarif horaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                      placeholder="2.50"
                  value={newParking.tarif_horaire}
                      onChange={(e) => setNewParking({ ...newParking, tarif_horaire: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                      min="0"
                />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tarif journalier (€)</label>
                <input
                  type="number"
                  step="0.01"
                      placeholder="15.00"
                  value={newParking.tarif_journalier}
                      onChange={(e) => setNewParking({ ...newParking, tarif_journalier: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                      min="0"
                />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tarif mensuel (€)</label>
                <input
                  type="number"
                  step="0.01"
                      placeholder="120.00"
                  value={newParking.tarif_mensuel}
                      onChange={(e) => setNewParking({ ...newParking, tarif_mensuel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                      min="0"
                />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Heure d'ouverture</label>
                <input
                  type="time"
                  value={newParking.horaire_ouverture}
                      onChange={(e) => setNewParking({ ...newParking, horaire_ouverture: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Heure de fermeture</label>
                <input
                  type="time"
                  value={newParking.horaire_fermeture}
                      onChange={(e) => setNewParking({ ...newParking, horaire_fermeture: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                  required
                />
              </div>
                </div>
                
                <div className="flex gap-4">
                  <button type="submit" className="bg-zenpark text-white px-8 py-3 rounded-xl hover:bg-zenpark-700 transition font-medium">
                    Ajouter le parking
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                    className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 transition font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des parkings */}
        <section>
            <h2 className="text-3xl font-serif font-normal mb-6 text-gray-900">
              Mes parkings ({parkings.length})
          </h2>

          {loading ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : parkings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <p className="text-gray-600 mb-6">
                Vous n'avez pas encore de parking. Ajoutez-en un !
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                  className="bg-zenpark text-white px-8 py-3 rounded-xl hover:bg-zenpark-700 transition font-medium"
              >
                  Ajouter mon premier parking
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parkings.map((parking) => (
                  <div key={parking.id} className="bg-white rounded-2xl shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{parking.nom}</h3>
                    <p className="text-gray-600 text-sm mb-4">{parking.adresse}</p>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Places:</span>
                        <span className="font-medium">{parking.nombre_places}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tarif horaire:</span>
                        <span className="font-medium text-zenpark">{parking.tarif_horaire} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tarif journalier:</span>
                        <span className="font-medium text-zenpark">{parking.tarif_journalier} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Horaires:</span>
                        <span className="font-medium">{parking.horaire_ouverture} - {parking.horaire_fermeture}</span>
                      </div>
                  </div>

                    <button
                      onClick={() => setShowEditForm(showEditForm === parking.id ? null : parking.id)}
                      className="w-full bg-gray-100 text-gray-900 py-2 rounded-xl hover:bg-gray-200 transition font-medium"
                    >
                      {showEditForm === parking.id ? 'Annuler' : 'Modifier'}
                    </button>

                  {showEditForm === parking.id && (
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
                        className="mt-4 space-y-3 pt-4 border-t border-gray-100"
                      >
                        <input
                          type="number"
                          step="0.01"
                          name="tarif_horaire"
                          defaultValue={parking.tarif_horaire}
                          placeholder="Tarif horaire"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark"
                        />
                        <input
                          type="number"
                          step="0.01"
                          name="tarif_journalier"
                          defaultValue={parking.tarif_journalier}
                          placeholder="Tarif journalier"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark"
                        />
                        <input
                          type="number"
                          step="0.01"
                          name="tarif_mensuel"
                          defaultValue={parking.tarif_mensuel}
                          placeholder="Tarif mensuel"
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark"
                        />
                        <input
                          type="time"
                          name="horaire_ouverture"
                          defaultValue={parking.horaire_ouverture}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark"
                        />
                        <input
                          type="time"
                          name="horaire_fermeture"
                          defaultValue={parking.horaire_fermeture}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark"
                        />
                          <button
                            type="submit"
                          className="w-full bg-zenpark text-white py-2 rounded-xl hover:bg-zenpark-700 transition font-medium"
                          >
                            Enregistrer
                          </button>
                      </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
