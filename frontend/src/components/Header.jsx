import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role || null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="bg-[#34A853] text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          ParkingPartagé
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6">
          <Link to="/" className="hover:text-gray-200 transition">
            Accueil
          </Link>
          
          {token ? (
            <>
              {userRole === 'owner' ? (
                <Link to="/dashboard-owner" className="hover:text-gray-200 transition">
                  Espace propriétaire
                </Link>
              ) : (
                <Link to="/dashboard-user" className="hover:text-gray-200 transition">
                  Mon compte
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-white text-[#34A853] px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-gray-200 transition"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="bg-white text-[#34A853] px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                S'inscrire
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

