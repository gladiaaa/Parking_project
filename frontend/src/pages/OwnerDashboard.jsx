import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";
import { notifyAuthChanged } from "../services/authStore";

const initialParkingForm = {
  latitude: "",
  longitude: "",
  capacity: "",
  hourly_rate: "",
  opening_time: "08:00:00",
  closing_time: "22:00:00",
};

function toNumber(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function normalizeRole(role) {
  // Backend parfois "OWNER" / "owner"
  return String(role || "").toLowerCase();
}

function pickOwnerParkings(res) {
  // selon les variantes possibles:
  // - { success:true, parkings:[...] }
  // - { parkings:[...] }
  // - { data:[...] }
  // - direct [...]
  return (
    res?.parkings ??
    res?.data ??
    (Array.isArray(res) ? res : [])
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [parkings, setParkings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newParking, setNewParking] = useState(initialParkingForm);

  const parkingsCount = useMemo(() => parkings?.length ?? 0, [parkings]);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap() {
    setLoading(true);
    setError("");

    try {
      // 1) session via cookie
      const meResult = await apiService.me();
      const user = meResult?.user ?? meResult;

      if (!user?.role) throw new Error("Réponse /me inattendue");

      // keep in LS for UI (Header)
      localStorage.setItem("user", JSON.stringify(user));
      notifyAuthChanged();

      const role = normalizeRole(user.role);
      if (role !== "owner") {
        // si user normal, on l’envoie où il faut
        navigate("/dashboard-user", { replace: true });
        return;
      }

      setMe(user);

      // 2) load parkings
      await loadOwnerParkings();
    } catch (e) {
      // pas loggé / cookie expiré
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function loadOwnerParkings() {
    const res = await apiService.getOwnerParkings();
    const list = pickOwnerParkings(res);
    setParkings(Array.isArray(list) ? list : []);
  }

  function updateNewParkingField(name, value) {
    setNewParking((p) => ({ ...p, [name]: value }));
  }

  async function handleAddParking(e) {
    e.preventDefault();
    setError("");

    const payload = {
      latitude: toNumber(newParking.latitude),
      longitude: toNumber(newParking.longitude),
      capacity: toNumber(newParking.capacity),
      hourly_rate: toNumber(newParking.hourly_rate),
      opening_time: newParking.opening_time,
      closing_time: newParking.closing_time,
    };

    // validations basiques
    if (payload.latitude === null || payload.longitude === null) {
      setError("Latitude et longitude sont obligatoires (nombres valides).");
      return;
    }
    if (payload.capacity === null || payload.capacity <= 0) {
      setError("La capacité doit être > 0.");
      return;
    }
    if (payload.hourly_rate === null || payload.hourly_rate < 0) {
      setError("Le tarif horaire doit être un nombre valide (>= 0).");
      return;
    }
    if (!payload.opening_time || !payload.closing_time) {
      setError("Les horaires d'ouverture et fermeture sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createOwnerParking(payload);

      setShowAddForm(false);
      setNewParking(initialParkingForm);

      await loadOwnerParkings();
    } catch (e2) {
      setError(e2?.message || "Erreur lors de la création du parking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="bg-zenpark text-white py-12">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-serif font-normal mb-2">
                  Espace propriétaire
                </h1>
                <p className="text-white/90 text-lg">
                  {me?.firstname ? `Bonjour ${me.firstname}. ` : ""}
                  Gérez vos parkings.
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(true)}
                className="hidden md:inline-flex bg-white text-zenpark px-6 py-3 rounded-xl hover:bg-gray-100 transition font-medium"
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

          {/* CTA mobile */}
          <div className="md:hidden mb-8">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-zenpark text-white px-6 py-3 rounded-xl hover:bg-zenpark-700 transition font-medium"
            >
              + Ajouter un parking
            </button>
          </div>

          {/* FORM ADD */}
          {showAddForm && (
            <div className="bg-white rounded-2xl shadow p-8 mb-12">
              <h2 className="text-2xl font-serif font-normal mb-6 text-gray-900">
                Ajouter un parking
              </h2>

              <form onSubmit={handleAddParking} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={newParking.latitude}
                      onChange={(e) => updateNewParkingField("latitude", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                      placeholder="48.8566"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={newParking.longitude}
                      onChange={(e) => updateNewParkingField("longitude", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                      placeholder="2.3522"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Capacité (places)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newParking.capacity}
                      onChange={(e) => updateNewParkingField("capacity", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                      placeholder="10"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Tarif horaire (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newParking.hourly_rate}
                      onChange={(e) => updateNewParkingField("hourly_rate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                      placeholder="2.50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Heure d'ouverture
                    </label>
                    <input
                      type="time"
                      value={newParking.opening_time}
                      onChange={(e) => updateNewParkingField("opening_time", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Heure de fermeture
                    </label>
                    <input
                      type="time"
                      value={newParking.closing_time}
                      onChange={(e) => updateNewParkingField("closing_time", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zenpark focus:border-zenpark transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-zenpark text-white px-8 py-3 rounded-xl hover:bg-zenpark-700 transition font-medium disabled:opacity-50"
                  >
                    {submitting ? "Création..." : "Ajouter le parking"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewParking(initialParkingForm);
                      setError("");
                    }}
                    className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 transition font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST */}
          <section>
            <h2 className="text-3xl font-serif font-normal mb-6 text-gray-900">
              Mes parkings ({parkingsCount})
            </h2>

            {loading ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : parkingsCount === 0 ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center">
                <p className="text-gray-600 mb-6">
                  Aucun parking pour l’instant. Crée-en un, ça rendra l’univers légèrement moins inutile.
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
                {parkings.map((p) => (
                  <div key={p.id ?? `${p.latitude}-${p.longitude}`} className="bg-white rounded-2xl shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Parking #{p.id ?? "—"}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latitude</span>
                        <span className="font-medium">{p.latitude}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Longitude</span>
                        <span className="font-medium">{p.longitude}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacité</span>
                        <span className="font-medium">{p.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tarif horaire</span>
                        <span className="font-medium text-zenpark">
                          {p.hourly_rate} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Horaires</span>
                        <span className="font-medium">
                          {p.opening_time} - {p.closing_time}
                        </span>
                      </div>
                    </div>

                    {/* bouton futur si tu fais une page de gestion */}
                    {/* <div className="mt-5">
                      <button
                        onClick={() => navigate(`/owner/parkings/${p.id}`)}
                        className="w-full bg-gray-100 text-gray-900 py-2 rounded-xl hover:bg-gray-200 transition font-medium"
                      >
                        Gérer ce parking
                      </button>
                    </div> */}
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
