import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";
import { notifyAuthChanged } from "../services/authStore";
import { LogIn, LogOut } from "lucide-react";

const MesReservations = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(true); // auth check
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("all"); // all, upcoming, past, cancelled
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      setBooting(true);

      try {
        // 1) Vérifie la session via cookie
        const me = await apiService.me();
        const user = me?.user ?? me;
        if (!user?.id) throw new Error("Not authenticated");

        // Optionnel: garder le user (Header etc.)
        localStorage.setItem("user", JSON.stringify(user));
        notifyAuthChanged();

        // 2) Charge les réservations
        await loadReservations();
      } catch (e) {
        // Session invalide / expirée
        localStorage.removeItem("user");
        notifyAuthChanged();
        navigate("/login", { replace: true });
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    setError("");

    try {
      // Cookie-based: pas de token localStorage
      const payload = await apiService.getMyReservations();

      // Selon ton backend, adapte si besoin:
      // - payload = { success: true, reservations: [...] }
      // - ou payload = { reservations: [...] }
      const list = payload?.reservations ?? payload?.data ?? payload ?? [];
      setReservations(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = e?.message || "Erreur lors du chargement des réservations";
      setError(msg);

      // Si 401 => on redirige login
      if (e?.status === 401 || /401|Session expirée/i.test(msg)) {
        localStorage.removeItem("user");
        notifyAuthChanged();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = useMemo(() => {
    const now = new Date();

    switch (filter) {
      case "upcoming":
        return reservations.filter((r) => new Date(r.date_debut) > now);
      case "past":
        return reservations.filter((r) => new Date(r.date_fin) < now);
      case "cancelled":
        return reservations.filter((r) => r.statut === "annulée");
      default:
        return reservations;
    }
  }, [filter, reservations]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (reservation) => {
    const now = new Date();
    const debut = new Date(reservation.date_debut);
    const fin = new Date(reservation.date_fin);

    if (reservation.statut === "annulée") {
      return (
        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
          Annulée
        </span>
      );
    }
    if (now < debut) {
      return (
        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          À venir
        </span>
      );
    }
    if (now >= debut && now <= fin) {
      return (
        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          En cours
        </span>
      );
    }
    return (
      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
        Terminée
      </span>
    );
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight">
              Mes réservations
            </h1>
            <p className="text-xl text-gray-500 font-light">
              Gérez toutes vos réservations en un seul endroit
            </p>
          </div>

          {(booting || loading) && (
            <div className="flex items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
          )}

          {!booting && !loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
              {error}
            </div>
          )}

          {!booting && !loading && !error && (
            <>
              {/* Filtres */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { value: "all", label: "Toutes", count: reservations.length },
                  {
                    value: "upcoming",
                    label: "À venir",
                    count: reservations.filter((r) => new Date(r.date_debut) > new Date()).length,
                  },
                  {
                    value: "past",
                    label: "Passées",
                    count: reservations.filter((r) => new Date(r.date_fin) < new Date()).length,
                  },
                  {
                    value: "cancelled",
                    label: "Annulées",
                    count: reservations.filter((r) => r.statut === "annulée").length,
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                      filter === item.value
                        ? "bg-gray-900 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>

              {/* Bouton nouvelle réservation */}
              <div className="mb-8">
                <button
                  onClick={() => navigate("/reservation")}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-medium hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ➕ Nouvelle réservation
                </button>
              </div>

              {/* Liste */}
              {filteredReservations.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-2xl font-light text-gray-900 mb-2">
                    Aucune réservation
                  </h3>
                  <p className="text-gray-500 mb-8">
                    {filter === "all"
                      ? "Vous n'avez pas encore de réservation"
                      : `Vous n'avez pas de réservation ${
                          filter === "upcoming"
                            ? "à venir"
                            : filter === "past"
                            ? "passée"
                            : "annulée"
                        }`}
                  </p>
                  <button
                    onClick={() => navigate("/reservation")}
                    className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg"
                  >
                    Faire une réservation
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      statusBadge={getStatusBadge(reservation)}
                      formatDate={formatDate}
                      onRefresh={loadReservations}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

// ==========================
// Card
// ==========================
const ReservationCard = ({ reservation, statusBadge, formatDate, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canEnter =
    reservation.statut === "confirmée" &&
    !reservation.date_entree &&
    !reservation.date_sortie;

  const canExit =
    reservation.statut === "confirmée" &&
    !!reservation.date_entree &&
    !reservation.date_sortie;

  const canInvoice = !!reservation.date_sortie && !!reservation.montant_final;

  const canCancel =
    typeof apiService.cancelReservation === "function" &&
    reservation.statut !== "annulée" &&
    !reservation.date_entree &&
    new Date(reservation.date_debut) > new Date();

  const handleEnter = async () => {
    setActionLoading(true);
    try {
      await apiService.enterReservation(reservation.id);
      onRefresh();
    } catch (e) {
      alert("❌ " + (e?.message || "Erreur entrée parking"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExit = async () => {
    if (!window.confirm("Confirmer la sortie du parking ? Cela arrêtera le compteur.")) return;
    setActionLoading(true);
    try {
      await apiService.exitReservation(reservation.id);
      onRefresh();
    } catch (e) {
      alert("❌ " + (e?.message || "Erreur sortie parking"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvoice = async () => {
    try {
      // Selon ton apiService: getInvoiceHtml(id) ou getInvoice(id)
      const html =
        typeof apiService.getInvoiceHtml === "function"
          ? await apiService.getInvoiceHtml(reservation.id)
          : await apiService.getInvoice(reservation.id);

      const win = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
    } catch (e) {
      alert("❌ Impossible de récupérer la facture : " + (e?.message || "Erreur"));
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;
    if (typeof apiService.cancelReservation !== "function") return;

    setCancelling(true);
    try {
      await apiService.cancelReservation(reservation.id);
      onRefresh();
    } catch (e) {
      alert("❌ " + (e?.message || "Erreur annulation"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-500">
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-medium text-gray-900">
                {reservation.parking_nom || "Parking"}
              </h3>
              {statusBadge}
            </div>
            <p className="text-gray-500 mb-2">
              📍 {reservation.parking_adresse || "Adresse non disponible"}
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-3">
              <span>Réservation #{reservation.id}</span>
              {reservation.vehicule && <span>🚗 {reservation.vehicule}</span>}
              {reservation.immatriculation && <span>🔖 {reservation.immatriculation}</span>}
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-light text-gray-900 mb-1">
              {(reservation.montant_final ?? reservation.montant) ?? 0}€
            </div>
            <div className="text-sm text-gray-500">
              {reservation.montant_final ? "Montant final" : "Montant estimé"}
            </div>

            {canInvoice && (
              <button
                onClick={handleInvoice}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-end gap-1 w-full"
              >
                📄 Facture
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6 p-6 bg-gray-50 rounded-2xl">
          <div>
            <div className="text-sm text-gray-500 mb-1">Début</div>
            <div className="text-gray-900 font-medium">{formatDate(reservation.date_debut)}</div>
            {reservation.date_entree && (
              <div className="text-xs text-green-600 mt-1">
                Entré à {formatDate(reservation.date_entree)}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Fin</div>
            <div className="text-gray-900 font-medium">{formatDate(reservation.date_fin)}</div>
            {reservation.date_sortie && (
              <div className="text-xs text-red-600 mt-1">
                Sorti à {formatDate(reservation.date_sortie)}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            {showDetails ? "Masquer" : "Détails"}
          </button>

          {canEnter && (
            <button
              onClick={handleEnter}
              disabled={actionLoading}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn size={18} /> {actionLoading ? "..." : "Entrer"}
            </button>
          )}

          {canExit && (
            <button
              onClick={handleExit}
              disabled={actionLoading}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogOut size={18} /> {actionLoading ? "..." : "Sortir"}
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? "..." : "Annuler"}
            </button>
          )}
        </div>

        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Durée prévue</span>
              <span className="text-gray-900 font-medium">
                {Math.ceil(
                  (new Date(reservation.date_fin) - new Date(reservation.date_debut)) /
                    (1000 * 60 * 60)
                )}{" "}
                heures
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type de stationnement</span>
              <span className="text-gray-900 font-medium">Horaire</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesReservations;
