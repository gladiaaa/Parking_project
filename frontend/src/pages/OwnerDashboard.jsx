import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { notifyAuthChanged } from "../services/authStore";
import Layout from "../components/Layout";

const DAYS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mer" },
  { id: 4, label: "Jeu" },
  { id: 5, label: "Ven" },
  { id: 6, label: "Sam" },
  { id: 7, label: "Dim" },
];

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function pickOwnerParkings(res) {
  return res?.parkings ?? res?.data ?? (Array.isArray(res) ? res : []);
}

function formatOpeningDays(days) {
  if (!Array.isArray(days) || days.length === 0) return "—";
  const map = new Map(DAYS.map((d) => [d.id, d.label]));
  return days
    .map((d) => map.get(Number(d)) || "")
    .filter(Boolean)
    .join(", ");
}

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [parkings, setParkings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const parkingsCount = useMemo(() => parkings?.length ?? 0, [parkings]);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap() {
    setLoading(true);
    setError("");

    try {
      const meResult = await apiService.me();
      const user = meResult?.user ?? meResult;

      if (!user?.role) throw new Error("Réponse /me inattendue");

      localStorage.setItem("user", JSON.stringify(user));
      notifyAuthChanged();

      const role = normalizeRole(user.role);
      if (role !== "owner") {
        navigate("/dashboard-user", { replace: true });
        return;
      }

      setMe(user);
      await loadOwnerParkings();
    } catch {
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

  return (
    <Layout>
      {/* HERO */}
      <section className="relative bg-primary text-white py-12">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-serif font-normal mb-2">
                Espace propriétaire
              </h1>
              <p className="text-white/95 text-base font-light">
                {me?.firstname ? `Bonjour ${me.firstname}. ` : ""}
                Gérez vos parkings.
              </p>
            </div>

            {/* CTA desktop */}
            <button
              onClick={() => navigate("/owner/parkings/new")}
              className="hidden md:inline-flex bg-white text-primary px-6 py-3 rounded-full hover:bg-gray-100 transition font-normal"
              type="button"
            >
              + Ajouter un parking
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-12 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
            {error}
          </div>
        )}

        {/* CTA mobile */}
        <div className="md:hidden mb-8">
          <button
            onClick={() => navigate("/owner/parkings/new")}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-accent transition duration-300 text-base font-normal"
            type="button"
          >
            + Ajouter un parking
          </button>
        </div>

        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2 className="text-3xl font-serif font-normal text-gray-900">
              Mes parkings ({parkingsCount})
            </h2>

            <button
              onClick={loadOwnerParkings}
              className="hidden md:inline-flex bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300 shadow-md"
              type="button"
            >
              Rafraîchir
            </button>
          </div>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : parkingsCount === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-gray-600 mb-6">
                Aucun parking pour l’instant. Crée-en un, histoire de rentabiliser
                la civilisation.
              </p>
              <button
                onClick={() => navigate("/owner/parkings/new")}
                className="bg-primary text-white px-10 py-3.5 rounded-full hover:bg-accent transition-all duration-300 shadow-md hover:shadow-lg font-normal text-base"
                type="button"
              >
                Créer mon premier parking
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parkings.map((p) => (
                <div
                  key={p.id ?? `${p.latitude}-${p.longitude}`}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      Parking #{p.id ?? "—"}
                    </h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/10">
                      Owner
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Adresse</span>
                      <span className="font-medium text-right text-gray-900">
                        {p.address || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Capacité</span>
                      <span className="font-medium text-gray-900">
                        {p.capacity}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Tarif horaire</span>
                      <span className="font-medium text-primary">
                        {p.hourly_rate} €
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Jours</span>
                      <span className="font-medium text-gray-900">
                        {formatOpeningDays(p.opening_days)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Horaires</span>
                      <span className="font-medium text-gray-900">
                        {p.opening_time} - {p.closing_time}
                      </span>
                    </div>
                  </div>

                  {p.latitude && p.longitude && (
                    <p className="text-xs text-gray-400 mt-3">
                      GPS: {p.latitude}, {p.longitude}
                    </p>
                  )}
                  <button
                    onClick={() => navigate(`/owner/parkings/${p.id}`)}
                    className="mt-4 w-full bg-gray-900 text-white py-3 rounded-full hover:bg-gray-800 transition font-light shadow-md"
                  >
                    Gérer
                  </button>

                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
