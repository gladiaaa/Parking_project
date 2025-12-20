// src/components/Header.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "../services/apiService";
import { getAuthSnapshot, subscribeAuth, notifyAuthChanged } from "../services/authStore";

function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).trim().toLowerCase();
  // accepte "OWNER", "owner", "ROLE_OWNER", etc.
  if (r.includes("owner")) return "owner";
  return "user";
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuth] = useState(() => getAuthSnapshot());

  useEffect(() => {
    // On s'abonne au store d'auth (pour re-render dès login/logout)
    const unsub = subscribeAuth(() => setAuth(getAuthSnapshot()));
    return unsub;
  }, []);

  const isAuthenticated = !!auth?.isAuthenticated;
  const user = auth?.user ?? null;
  const role = normalizeRole(auth?.role ?? user?.role);

  const isHome = location.pathname === "/";

  const dashboardPath = useMemo(() => {
    if (!isAuthenticated) return null;
    return role === "owner" ? "/dashboard-owner" : "/dashboard-user";
  }, [isAuthenticated, role]);

  const handleAnchorNav = (hash) => (e) => {
    e.preventDefault();

    // Si on n'est pas sur la home, on navigue vers la home + hash
    if (!isHome) {
      navigate(`/${hash}`);
      return;
    }

    // Sinon scroll smooth
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    try {
      // best effort: demander au backend de clear les cookies
      await apiService.logout();
    } catch {
      // on s'en fout: côté UI on te déconnecte quand même
    } finally {
      // On garde juste user en local (pas de token, car cookies côté backend)
      localStorage.removeItem("user");
      notifyAuthChanged();
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 pt-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-primary font-bold text-xl">P</span>
          </div>
        </Link>

        {/* Navigation centrale */}
        <nav className="flex items-center bg-gray-900 rounded-full shadow-2xl px-2 py-2">
          <Link
            to="/"
            className="px-6 py-2.5 bg-white text-gray-900 rounded-full font-medium text-sm transition-all duration-300 hover:bg-gray-100"
          >
            Accueil
          </Link>

          <Link
            to="/reservation"
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300"
          >
            Réserver
          </Link>

          <Link
            to="/abonnement"
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300"
          >
            Abonnement
          </Link>

          <Link
            to="/maps"
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300"
          >
            Carte
          </Link>

          <a
            href="#services"
            onClick={handleAnchorNav("#services")}
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300 cursor-pointer"
          >
            Services
          </a>

          <a
            href="#tarifs"
            onClick={handleAnchorNav("#tarifs")}
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300 cursor-pointer"
          >
            Tarifs
          </a>
        </nav>

        {/* Actions à droite */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {/* OWNER */}
            {role === "owner" ? (
              <>
                <Link
                  to="/dashboard-owner"
                  className="text-gray-900 bg-white border border-gray-200 px-6 py-2.5 rounded-full font-light text-sm shadow-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Mes parkings
                </Link>

                <Link
                  to="/dashboard-owner"
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-light text-sm shadow-lg hover:bg-gray-800 transition-all duration-300"
                >
                  Mon compte
                </Link>
              </>
            ) : (
              /* USER */
              <>
                <Link
                  to="/mes-reservations"
                  className="text-gray-900 bg-white border border-gray-200 px-6 py-2.5 rounded-full font-light text-sm shadow-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Mes réservations
                </Link>

                <Link
                  to="/dashboard-user"
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-light text-sm shadow-lg hover:bg-gray-800 transition-all duration-300"
                >
                  Mon compte
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="bg-primary text-white px-6 py-2.5 rounded-full font-light text-sm shadow-lg hover:bg-primary-800 transition-all duration-300"
              type="button"
            >
              Déconnexion{user?.firstname ? ` (${user.firstname})` : ""}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-900 bg-white border border-gray-200 px-6 py-2.5 rounded-full font-light text-sm shadow-lg hover:bg-gray-50 transition-all duration-300"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-light text-sm shadow-2xl hover:bg-gray-800 transition-all duration-300"
            >
              Inscription
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
