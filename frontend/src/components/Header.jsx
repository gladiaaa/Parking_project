import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";

export default function Header() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role?.toLowerCase()?.trim() || null;

  const isLoggedIn = !!user;

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (e) {
      console.error("Erreur lors de la déconnexion :", e);
    }
    localStorage.removeItem("user");
    navigate("/");
  };



  return (
    <header className="fixed top-6 left-0 right-0 z-50 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo à gauche */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-primary font-bold text-xl">P</span>
          </div>
        </Link>

        {/* Navigation centrale - Arrondie et séparée */}
        <nav className="flex items-center bg-gray-900 rounded-full shadow-2xl px-2 py-2">
          <Link
            to="/"
            className="px-6 py-2.5 bg-white text-gray-900 rounded-full font-medium text-sm transition-all duration-300 hover:bg-gray-100"
          >
            Accueil
          </Link>
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300 cursor-pointer"
          >
            Services
          </a>
          <a
            href="#tarifs"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#tarifs')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300 cursor-pointer"
          >
            Tarifs
          </a>
          <a
            href="#villes"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#villes')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-2.5 text-white font-light text-sm transition-all duration-300 hover:text-gray-300 cursor-pointer"
          >
            Villes
          </a>
        </nav>

        {/* Boutons Connexion/Inscription ou Dashboard */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            {userRole === "owner" ? (
              <Link
                to="/dashboard-owner"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm shadow-lg hover:bg-gray-800 transition-all duration-300"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/dashboard-user"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm shadow-lg hover:bg-gray-800 transition-all duration-300"
              >
                Mon compte
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-white text-gray-900 px-5 py-2.5 rounded-full text-sm shadow-lg hover:bg-gray-100 transition-all duration-300"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="bg-white text-gray-900 px-5 py-2.5 rounded-full text-sm shadow-lg hover:bg-gray-100 transition-all duration-300"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="bg-primary text-white px-5 py-2.5 rounded-full text-sm shadow-lg hover:bg-primary/90 transition-all duration-300"
            >
              S'inscrire
            </Link>
          </div>
        )}

      </div>
    </header>
  );
}
