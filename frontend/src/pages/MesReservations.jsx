// src/pages/MesReservations.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiService } from "../services/apiService";
import { notifyAuthChanged } from "../services/authStore";
import { LogIn, LogOut, FileText, XCircle } from "lucide-react";

/**
 * Helpers
 */
function safeDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMoney(v) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function formatDateFR(dateString) {
  const d = safeDate(dateString);
  if (!d) return "Date invalide";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeReservation(raw) {
  if (!raw) return null;

  const start =
    raw.start_at ?? raw.date_debut ?? raw.startAt ?? raw.debut ?? raw.start ?? null;

  const end =
    raw.end_at ?? raw.date_fin ?? raw.endAt ?? raw.fin ?? raw.end ?? null;

  const enteredAt = raw.entered_at ?? raw.date_entree ?? raw.enteredAt ?? null;
  const exitedAt = raw.exited_at ?? raw.date_sortie ?? raw.exitedAt ?? null;

  const statusRaw = raw.status ?? raw.statut ?? "confirmée";
  const status = String(statusRaw).toLowerCase();

  const amountFinal = raw.total_amount ?? raw.montant_final ?? raw.final_amount ?? null;
  const amountEstimated = raw.amount ?? raw.montant ?? raw.estimated_amount ?? null;

  return {
    id: Number(raw.id),
    parkingId: Number(raw.parking_id ?? raw.parkingId ?? raw.parking?.id ?? 0),

    parkingName: raw.parking_nom ?? raw.parkingName ?? raw.parking?.name ?? "Parking",
    parkingAddress:
      raw.parking_adresse ??
      raw.parkingAddress ??
      raw.parking?.address ??
      "Adresse non disponible",

    vehicleType: raw.vehicle_type ?? raw.vehicule ?? raw.vehicleType ?? null,
    plate: raw.immatriculation ?? raw.plate ?? raw.plate_number ?? null,

    startAt: start,
    endAt: end,
    enteredAt,
    exitedAt,

    status,
    amountFinal,
    amountEstimated,
  };
}

function deriveStatus(res) {
  const now = new Date();
  const start = safeDate(res.startAt);
  const end = safeDate(res.endAt);

  if (["annulée", "annulee", "cancelled"].includes(res.status)) return "cancelled";
  if (start && now < start) return "upcoming";
  if (start && end && now >= start && now <= end) return "active";
  if (end && now > end) return "ended";
  return "unknown";
}

function StatusBadge({ kind }) {
  const map = {
    cancelled: { label: "Annulée", cls: "bg-red-100 text-red-700" },
    upcoming: { label: "À venir", cls: "bg-blue-100 text-blue-700" },
    active: { label: "En cours", cls: "bg-green-100 text-green-700" },
    ended: { label: "Terminée", cls: "bg-gray-100 text-gray-700" },
    unknown: { label: "Inconnue", cls: "bg-yellow-100 text-yellow-700" },
  };
  const x = map[kind] ?? map.unknown;
  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${x.cls}`}>
      {x.label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );
}

export default function MesReservations() {
  const navigate = useNavigate();

  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);

  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("all"); // all | upcoming | ended | cancelled
  const [error, setError] = useState("");

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await apiService.getMyReservations();
      const list = payload?.reservations ?? payload?.data ?? payload ?? [];
      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeReservation)
        .filter(Boolean);

      setReservations(normalized);
    } catch (e) {
      const msg = e?.message || "Erreur lors du chargement des réservations";
      setError(msg);

      if (e?.status === 401 || /401|Session expirée/i.test(msg)) {
        localStorage.removeItem("user");
        notifyAuthChanged();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const ensureAuthAndLoad = useCallback(async () => {
    setError("");
    setBooting(true);

    try {
      const me = await apiService.me();
      const user = me?.user ?? me;
      if (!user?.id) throw new Error("Not authenticated");

      localStorage.setItem("user", JSON.stringify(user));
      notifyAuthChanged();

      await loadReservations();
    } catch {
      localStorage.removeItem("user");
      notifyAuthChanged();
      navigate("/login", { replace: true });
    } finally {
      setBooting(false);
    }
  }, [loadReservations, navigate]);

  useEffect(() => {
    ensureAuthAndLoad();
  }, [ensureAuthAndLoad]);

  const computed = useMemo(() => {
    const withMeta = reservations.map((r) => ({ ...r, _kind: deriveStatus(r) }));

    const counts = {
      all: withMeta.length,
      upcoming: withMeta.filter((r) => r._kind === "upcoming").length,
      ended: withMeta.filter((r) => r._kind === "ended").length,
      cancelled: withMeta.filter((r) => r._kind === "cancelled").length,
    };

    const filtered =
      filter === "upcoming"
        ? withMeta.filter((r) => r._kind === "upcoming")
        : filter === "ended"
        ? withMeta.filter((r) => r._kind === "ended")
        : filter === "cancelled"
        ? withMeta.filter((r) => r._kind === "cancelled")
        : withMeta;

    // Tri logique
    const order = { upcoming: 1, active: 2, ended: 3, cancelled: 4, unknown: 5 };
    filtered.sort((a, b) => {
      const oa = order[a._kind] ?? 99;
      const ob = order[b._kind] ?? 99;
      if (oa !== ob) return oa - ob;
      const ta = safeDate(a.startAt)?.getTime?.() ?? 0;
      const tb = safeDate(b.startAt)?.getTime?.() ?? 0;
      return tb - ta;
    });

    return { filtered, counts };
  }, [reservations, filter]);

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

          {(booting || loading) && <Spinner />}

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
                  { value: "all", label: "Toutes", count: computed.counts.all },
                  { value: "upcoming", label: "À venir", count: computed.counts.upcoming },
                  { value: "ended", label: "Passées", count: computed.counts.ended },
                  { value: "cancelled", label: "Annulées", count: computed.counts.cancelled },
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

              {/* Nouvelle réservation */}
              <div className="mb-8">
                <button
                  onClick={() => navigate("/reservation")}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-medium hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  ➕ Nouvelle réservation
                </button>
              </div>

              {/* Liste */}
              {computed.filtered.length === 0 ? (
                <EmptyState filter={filter} onGo={() => navigate("/reservation")} />
              ) : (
                <div className="space-y-6">
                  {computed.filtered.map((r) => (
                    <ReservationCard key={r.id} reservation={r} onRefresh={loadReservations} />
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
}

function EmptyState({ filter, onGo }) {
  const text =
    filter === "all"
      ? "Vous n'avez pas encore de réservation"
      : filter === "upcoming"
      ? "Vous n'avez pas de réservation à venir"
      : filter === "ended"
      ? "Vous n'avez pas de réservation passée"
      : "Vous n'avez pas de réservation annulée";

  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📅</div>
      <h3 className="text-2xl font-light text-gray-900 mb-2">Aucune réservation</h3>
      <p className="text-gray-500 mb-8">{text}</p>
      <button
        onClick={onGo}
        className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-medium hover:bg-gray-800 transition-all shadow-lg"
      >
        Faire une réservation
      </button>
    </div>
  );
}

function ReservationCard({ reservation, onRefresh }) {
  const [showDetails, setShowDetails] = useState(false);
  const [busyActionId, setBusyActionId] = useState(null);
  const [localError, setLocalError] = useState("");

  const kind = deriveStatus(reservation);

  // ✅ règles simples et fiables
  const isCancelled = ["annulée", "annulee", "cancelled"].includes(reservation.status);
  const canEnter = !isCancelled && !reservation.enteredAt && !reservation.exitedAt;
  const canExit = !isCancelled && !!reservation.enteredAt && !reservation.exitedAt;

  const canInvoice = !!reservation.exitedAt && reservation.amountFinal != null;

  const canCancel =
    typeof apiService.cancelReservation === "function" &&
    kind === "upcoming" &&
    !reservation.enteredAt &&
    !isCancelled;

  const amount = reservation.amountFinal ?? reservation.amountEstimated ?? 0;
  const amountLabel = reservation.amountFinal != null ? "Montant final" : "Montant estimé";

  const durationHours = useMemo(() => {
    const s = safeDate(reservation.startAt);
    const e = safeDate(reservation.endAt);
    if (!s || !e) return null;
    const diff = e.getTime() - s.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60));
  }, [reservation.startAt, reservation.endAt]);

  const run = async (actionName, fn) => {
    setLocalError("");
    setBusyActionId(actionName);
    try {
      await fn();
      await onRefresh();
    } catch (e) {
      setLocalError(e?.message || "Action impossible");
    } finally {
      setBusyActionId(null);
    }
  };

  const handleEnter = () =>
    run("enter", async () => {
      await apiService.enterReservation(reservation.id);
    });

  const handleExit = () =>
    run("exit", async () => {
      const ok = window.confirm("Confirmer la sortie du parking ? Cela arrêtera le compteur.");
      if (!ok) return;
      await apiService.exitReservation(reservation.id);
    });

  const handleCancel = () =>
    run("cancel", async () => {
      const ok = window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?");
      if (!ok) return;
      await apiService.cancelReservation(reservation.id);
    });

  const handleInvoice = async () => {
    setLocalError("");
    try {
      const html =
        typeof apiService.getInvoiceHtml === "function"
          ? await apiService.getInvoiceHtml(reservation.id)
          : await apiService.getInvoice(reservation.id);

      const win = window.open("", "_blank");
      if (!win) throw new Error("Popup bloquée (autorise les popups pour voir la facture).");
      win.document.write(html);
      win.document.close();
    } catch (e) {
      setLocalError(e?.message || "Impossible de récupérer la facture");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-500">
      <div className="p-8">
        {localError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-start gap-2">
            <XCircle size={18} className="mt-0.5" />
            <span>{localError}</span>
          </div>
        )}

        <div className="flex items-start justify-between mb-6 gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className="text-2xl font-medium text-gray-900 truncate">
                {reservation.parkingName}
              </h3>
              <StatusBadge kind={kind} />
            </div>

            <p className="text-gray-500 mb-2 truncate">📍 {reservation.parkingAddress}</p>

            <p className="text-gray-400 text-sm flex items-center gap-3 flex-wrap">
              <span>Réservation #{reservation.id}</span>
              {reservation.vehicleType && <span>🚗 {reservation.vehicleType}</span>}
              {reservation.plate && <span>🔖 {reservation.plate}</span>}
              {reservation.parkingId ? <span>🅿️ Parking #{reservation.parkingId}</span> : null}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-3xl font-light text-gray-900 mb-1">
              {formatMoney(amount)}€
            </div>
            <div className="text-sm text-gray-500">{amountLabel}</div>

            {canInvoice && (
              <button
                onClick={handleInvoice}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-end gap-2 w-full"
              >
                <FileText size={16} /> Facture
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6 p-6 bg-gray-50 rounded-2xl">
          <div>
            <div className="text-sm text-gray-500 mb-1">Début</div>
            <div className="text-gray-900 font-medium">{formatDateFR(reservation.startAt)}</div>
            {reservation.enteredAt && (
              <div className="text-xs text-green-600 mt-1">
                Entré à {formatDateFR(reservation.enteredAt)}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Fin</div>
            <div className="text-gray-900 font-medium">{formatDateFR(reservation.endAt)}</div>
            {reservation.exitedAt && (
              <div className="text-xs text-red-600 mt-1">
                Sorti à {formatDateFR(reservation.exitedAt)}
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
              disabled={busyActionId != null}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn size={18} />
              {busyActionId === "enter" ? "..." : "Entrer"}
            </button>
          )}

          {canExit && (
            <button
              onClick={handleExit}
              disabled={busyActionId != null}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogOut size={18} />
              {busyActionId === "exit" ? "..." : "Sortir"}
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={busyActionId != null}
              className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busyActionId === "cancel" ? "..." : "Annuler"}
            </button>
          )}
        </div>

        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Durée prévue</span>
              <span className="text-gray-900 font-medium">
                {durationHours == null ? "—" : `${durationHours} heure(s)`}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Type de stationnement</span>
              <span className="text-gray-900 font-medium">
                {reservation.vehicleType ?? "—"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
