import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";
import { notifyAuthChanged } from "../services/authStore";

function ymNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);

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

  const month = useMemo(() => ymNow(), []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        // 1) Vérifier session + rôle
        const meRes = await apiService.me();
        const user = meRes?.user ?? meRes;

        if (!user?.role) throw new Error("Réponse /me invalide (pas de role).");
        if (user.role !== "owner") {
          navigate("/dashboard-user", { replace: true });
          return;
        }

        if (!alive) return;
        setMe(user);

        // 2) Charger données owner
        const p = await apiService.getOwnerParkings(); // { ... } ou array selon ton backend
        const parkingsList = p?.parkings ?? p?.data ?? p ?? [];
        if (!alive) return;
        setParkings(Array.isArray(parkingsList) ? parkingsList : []);

        // 3) Stats (si tu as les routes). Sinon, tu peux supprimer cette section.
        // Ici: revenue par parking (doc: /owner/parkings/{id}/revenue?month=YYYY-MM)
        // On additionne les revenus de tous les parkings.
        const ids = (Array.isArray(parkingsList) ? parkingsList : [])
          .map((x) => x?.id)
          .filter(Boolean);

        let total = 0;

        for (const id of ids) {
          try {
            const r = await apiService.getOwnerMonthlyRevenue(id, month);
            const val = r?.revenus_mensuels ?? r?.revenue ?? r?.amount ?? 0;
            total += Number(val) || 0;
          } catch {
            // on ignore un parking qui fail, parce que la vie est déjà assez pénible
          }
        }

        if (!alive) return;
        setMonthlyRevenue(total);

        // Si tu as des endpoints “active reservations / stationnements”, branche-les ici.
        // Sinon laisse à 0.
        setActiveReservations(0);
        setActiveStationnements(0);
      } catch (e) {
        // 401 => pas connecté
        if (e?.status === 401) {
          localStorage.removeItem("user");
          notifyAuthChanged();
          navigate("/login", { replace: true });
          return;
        }
        setError(e?.message || "Erreur lors du chargement");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate, month]);

  const handleAddParking = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Doc: POST /api/owner/parkings
      await apiService.createOwnerParking({
        ...newParking,
        nombre_places: Number(newParking.nombre_places),
        tarif_horaire: Number(newParking.tarif_horaire),
        tarif_journalier: Number(newParking.tarif_journalier),
        tarif_mensuel: Number(newParking.tarif_mensuel),
      });

      setShowAddForm(false);
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

      // Reload simple: recharger la page owner (ou refactor en loadData)
      window.location.reload();
    } catch (e2) {
      setError(e2?.message || "Erreur lors de l'ajout du parking");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <section className="bg-zenpark text-white py-12">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-serif font-normal mb-2">
                  Espace propriétaire
                </h1>
                <p className="text-white/90 text-lg">
                  {me ? `Bonjour ${me.firstname || ""}` : "Chargement..."}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">Revenus mensuels</h3>
              <p className="text-3xl font-bold text-zenpark">
                {Number(monthlyRevenue || 0).toFixed(2)} €
              </p>
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

          {showAddForm && (
            <div className="bg-white rounded-2xl shadow p-8 mb-12">
              <h2 className="text-2xl font-serif font-normal mb-6 text-gray-900">
                Ajouter un parking
              </h2>

              <form onSubmit={handleAddParking} className="space-y-6">
                {/* garde ton form tel quel, juste bindings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input
                    value={newParking.nom}
                    onChange={(e) => setNewParking({ ...newParking, nom: e.target.value })}
                    placeholder="Nom"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                  <input
                    value={newParking.adresse}
                    onChange={(e) => setNewParking({ ...newParking, adresse: e.target.value })}
                    placeholder="Adresse"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    value={newParking.nombre_places}
                    onChange={(e) => setNewParking({ ...newParking, nombre_places: e.target.value })}
                    placeholder="Nombre de places"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newParking.tarif_horaire}
                    onChange={(e) => setNewParking({ ...newParking, tarif_horaire: e.target.value })}
                    placeholder="Tarif horaire"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newParking.tarif_journalier}
                    onChange={(e) => setNewParking({ ...newParking, tarif_journalier: e.target.value })}
                    placeholder="Tarif journalier"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newParking.tarif_mensuel}
                    onChange={(e) => setNewParking({ ...newParking, tarif_mensuel: e.target.value })}
                    placeholder="Tarif mensuel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                  <input
                    type="time"
                    value={newParking.horaire_ouverture}
                    onChange={(e) => setNewParking({ ...newParking, horaire_ouverture: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                  <input
                    type="time"
                    value={newParking.horaire_fermeture}
                    onChange={(e) => setNewParking({ ...newParking, horaire_fermeture: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-zenpark text-white px-8 py-3 rounded-xl hover:bg-zenpark-700 transition font-medium"
                  >
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
                  Vous n'avez pas encore de parking. Ajoutez-en un.
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
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {parking.nom}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{parking.adresse}</p>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Places:</span>
                        <span className="font-medium">{parking.nombre_places}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tarif horaire:</span>
                        <span className="font-medium text-zenpark">
                          {parking.tarif_horaire} €
                        </span>
                      </div>
                    </div>
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
