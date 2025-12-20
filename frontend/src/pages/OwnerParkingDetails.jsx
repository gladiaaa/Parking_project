import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiService } from "../services/apiService";
import { notifyAuthChanged } from "../services/authStore";

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
  return String(role || "").trim().toLowerCase();
}

function formatOpeningDays(days) {
  if (!Array.isArray(days) || days.length === 0) return "—";
  const map = new Map(DAYS.map((d) => [d.id, d.label]));
  return days
    .map((d) => map.get(Number(d)) || "")
    .filter(Boolean)
    .join(", ");
}

function ym(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthRange(month /* YYYY-MM */) {
  // from = YYYY-MM-01 00:00:00
  // to   = nextMonth-01 00:00:00
  const [y, m] = String(month).split("-").map((x) => Number(x));
  const from = new Date(y, (m || 1) - 1, 1, 0, 0, 0);
  const to = new Date(y, (m || 1), 1, 0, 0, 0);

  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  return { from: fmt(from), to: fmt(to) };
}

function pickList(res) {
  // ultra tolérant aux formats
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.reservations)) return res.reservations;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

function fmtMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export default function OwnerParkingDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const parkingId = useMemo(() => Number(id), [id]);

  const [me, setMe] = useState(null);
  const [parking, setParking] = useState(null);

  const [activeStationnements, setActiveStationnements] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(null);

  const [reservations, setReservations] = useState([]);
  const [resLoading, setResLoading] = useState(false);

  const [month, setMonth] = useState(() => ym());

  const [loading, setLoading] = useState(true);
  const [occLoading, setOccLoading] = useState(false);
  const [revLoading, setRevLoading] = useState(false);
  const [error, setError] = useState("");

  const capacity = Number(parking?.capacity ?? 0) || 0;
  const occupied = Array.isArray(activeStationnements)
    ? activeStationnements.length
    : 0;
  const available = Math.max(0, capacity - occupied);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkingId]);

  useEffect(() => {
    if (!parkingId) return;
    reloadMonthlyRevenue();
    reloadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, parkingId]);

  async function bootstrap() {
    setLoading(true);
    setError("");

    try {
      const meResult = await apiService.me();
      const user = meResult?.user ?? meResult;

      if (!user?.role) throw new Error("Réponse /me inattendue");

      localStorage.setItem("user", JSON.stringify(user));
      notifyAuthChanged();

      if (normalizeRole(user.role) !== "owner") {
        navigate("/dashboard-user", { replace: true });
        return;
      }

      setMe(user);

      // IMPORTANT:
      // ici, pour avoir le parking, on utilise la liste /owner/parkings (propre),
      // pas le revenue (qui ne renverra jamais une liste de parkings).
      const pRes = await apiService.getOwnerParkings();
      const pList = pickList(pRes);
      const found = pList.find((p) => Number(p.id) === parkingId);

      if (!found) {
        setParking(null);
        setError("Parking introuvable (ou pas à toi).");
        return;
      }

      setParking(found);

      await reloadOccupancy(parkingId);
      await reloadMonthlyRevenue();
      await reloadReservations();
    } catch (e) {
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function reloadOccupancy(id) {
    setOccLoading(true);
    try {
      const res = await apiService.getOwnerActiveStationnements(id);
      const list = pickList(res);
      setActiveStationnements(Array.isArray(list) ? list : []);
    } catch {
      setActiveStationnements([]);
    } finally {
      setOccLoading(false);
    }
  }

  async function reloadMonthlyRevenue() {
    setRevLoading(true);
    try {
      const res = await apiService.getOwnerMonthlyRevenue(parkingId, month);
      setMonthlyRevenue(res?.data ?? res ?? null);
    } catch {
      setMonthlyRevenue(null);
    } finally {
      setRevLoading(false);
    }
  }

  async function reloadReservations() {
    setResLoading(true);
    try {
      const { from, to } = getMonthRange(month);
      const res = await apiService.getOwnerParkingReservations(parkingId, {
        from,
        to,
      });
      setReservations(pickList(res));
    } catch {
      setReservations([]);
    } finally {
      setResLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Layout>
        <main className="flex-1">
          {/* HERO */}
          <section className="relative bg-primary text-white py-12">
            <div className="container mx-auto px-6 lg:px-12">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-serif font-normal mb-2">
                    Détails parking
                  </h1>
                  <p className="text-white/95 text-base font-light">
                    {me?.firstname ? `Bonjour ${me.firstname}. ` : ""}
                    On va voir si ce parking travaille ou s’il fait juste semblant.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/dashboard-owner")}
                  className="hidden md:inline-flex bg-white text-primary px-6 py-3 rounded-full hover:bg-gray-100 transition font-normal"
                  type="button"
                >
                  ← Retour
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

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : !parking ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-gray-600">Parking introuvable.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Infos parking */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-2xl font-serif font-normal text-gray-900">
                      Parking #{parking?.id}
                    </h2>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/10">
                      Owner
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Adresse</span>
                      <span className="font-medium text-right text-gray-900">
                        {parking?.address || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Capacité</span>
                      <span className="font-medium text-gray-900">
                        {capacity}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Tarif horaire</span>
                      <span className="font-medium text-primary">
                        {parking?.hourly_rate ?? "—"} €
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Jours</span>
                      <span className="font-medium text-gray-900">
                        {formatOpeningDays(parking?.opening_days)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Horaires</span>
                      <span className="font-medium text-gray-900">
                        {parking?.opening_time} - {parking?.closing_time}
                      </span>
                    </div>

                    {parking?.latitude && parking?.longitude && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex justify-between">
                          <span className="text-gray-500">GPS</span>
                          <span className="font-medium text-gray-900">
                            {parking.latitude}, {parking.longitude}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Occupation actuelle */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Occupation actuelle
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                      <div className="text-xs text-gray-500">Places</div>
                      <div className="text-2xl font-light text-gray-900">
                        {capacity}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                      <div className="text-xs text-gray-500">Occupées</div>
                      <div className="text-2xl font-light text-gray-900">
                        {occupied}
                      </div>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
                      <div className="text-xs text-gray-500">Libres</div>
                      <div className="text-2xl font-light text-primary">
                        {available}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => reloadOccupancy(parkingId)}
                    className="mt-4 w-full bg-gray-900 text-white py-3 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300 shadow-md"
                    type="button"
                  >
                    {occLoading ? "Calcul..." : "Rafraîchir"}
                  </button>
                </div>

                {/* Facture mensuelle */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 lg:col-span-3">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Facture mensuelle (CA)
                      </h3>
                      <p className="text-sm text-gray-500 font-light">
                        Total généré sur le mois sélectionné.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 text-sm"
                      />
                      <button
                        onClick={reloadMonthlyRevenue}
                        className="bg-primary text-white px-6 py-3 rounded-full hover:bg-accent transition-all duration-300 shadow-md font-normal"
                        type="button"
                      >
                        {revLoading ? "..." : "Actualiser"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    {revLoading ? (
                      <p className="text-gray-600">Calcul…</p>
                    ) : monthlyRevenue ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Mois</div>
                          <div className="text-lg font-medium text-gray-900">
                            {monthlyRevenue?.month ?? month}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Montant</div>
                          <div className="text-3xl font-light text-gray-900">
                            {fmtMoney(
                              monthlyRevenue?.amount ??
                                monthlyRevenue?.total ??
                                monthlyRevenue?.revenue ??
                                0
                            )}{" "}
                            €
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        Aucun montant trouvé pour ce mois.
                      </p>
                    )}
                  </div>
                </div>

                {/* Détails des réservations */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 lg:col-span-3">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Réservations du mois
                      </h3>
                      <p className="text-sm text-gray-500 font-light">
                        Détail des créneaux, statut, montant et client.
                      </p>
                    </div>

                    <button
                      onClick={reloadReservations}
                      className="bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 shadow-md font-light"
                      type="button"
                    >
                      {resLoading ? "..." : "Rafraîchir"}
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600">
                          <th className="px-4 py-3 font-medium">ID</th>
                          <th className="px-4 py-3 font-medium">Client</th>
                          <th className="px-4 py-3 font-medium">Véhicule</th>
                          <th className="px-4 py-3 font-medium">Immat</th>
                          <th className="px-4 py-3 font-medium">Début</th>
                          <th className="px-4 py-3 font-medium">Fin</th>
                          <th className="px-4 py-3 font-medium">Statut</th>
                          <th className="px-4 py-3 font-medium text-right">
                            Montant
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white">
                        {resLoading ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-6 text-center text-gray-600"
                            >
                              Chargement…
                            </td>
                          </tr>
                        ) : reservations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-6 text-center text-gray-600"
                            >
                              Aucune réservation sur ce mois.
                            </td>
                          </tr>
                        ) : (
                          reservations.map((r) => (
                            <tr
                              key={r.id}
                              className="border-t border-gray-100 text-gray-800"
                            >
                              <td className="px-4 py-3 font-medium">
                                #{r.id}
                              </td>
                              <td className="px-4 py-3">
                                {/* selon ton backend ça peut être user_id / user */}
                                {r.user?.firstname
                                  ? `${r.user.firstname} ${r.user.lastname || ""}`.trim()
                                  : r.user_id ?? r.userId ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {r.vehicle_type ?? r.vehicleType ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {r.immatriculation ?? r.plate ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {r.start_at ?? r.startAt ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                {r.end_at ?? r.endAt ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border border-gray-200 bg-gray-50">
                                  {r.statut ?? r.status ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {fmtMoney(r.amount)} €
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </Layout>
    </div>
  );
}
