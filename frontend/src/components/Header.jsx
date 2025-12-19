import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "../services/apiService";
import { getAuthSnapshot, subscribeAuth, notifyAuthChanged } from "../services/authStore";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuth] = useState(() => getAuthSnapshot());

  useEffect(() => {
    // s'abonner au store
    const unsub = subscribeAuth(() => setAuth(getAuthSnapshot()));
    return unsub;
  }, []);

  const { isAuthenticated, user, role } = auth;

  const dashboardPath = useMemo(() => {
    if (!isAuthenticated) return null;
    return role === "owner" ? "/dashboard-owner" : "/dashboard-user";
  }, [isAuthenticated, role]);

  const isHome = location.pathname === "/";

  const handleLogout = async () => {
    try {
      // best effort: on demande au backend de clear les cookies
      await apiService.logout();
    } catch {
      // si ça fail, on s'en remet quand même: côté UI tu es déconnecté
    } finally {
      localStorage.removeItem("user");
      notifyAuthChanged();
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="fixed top-6 left-0 right-0 z-50 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-primary font-bold text-xl">P</span>
          </div>
        </Link>

        {/* Nav centrale */}
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

          {/* Ces ancres n'ont de sens que sur la home */}
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              if (!isHome) return navigate("/#services");
              document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300 cursor-pointer"
          >
            Services
          </a>

          <a
            href="#tarifs"
            onClick={(e) => {
              e.preventDefault();
              if (!isHome) return navigate("/#tarifs");
              document.querySelector("#tarifs")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300 cursor-pointer"
          >
            Tarifs
          </a>
        </nav>

        {/* Actions à droite */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {role === "owner" ? (
              <Link
                to="/dashboard-owner"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-light text-sm shadow-lg hover:bg-gray-800 transition-all duration-300"
              >
                Dashboard
              </Link>
            ) : (
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
