import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-xl font-bold mb-4">À propos</h3>
            <p className="text-gray-300">
              ParkingPartagé permet de trouver, réserver et partager des places de parking en toute simplicité.
            </p>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="text-xl font-bold mb-4">Liens utiles</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="/" className="hover:text-white transition">
                  Accueil
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-white transition">
                  Connexion
                </a>
              </li>
              <li>
                <a href="/register" className="hover:text-white transition">
                  Inscription
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <p className="text-gray-300">
              Support: support@parkingpartage.fr
              <br />
              Tel: 01 23 45 67 89
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; 2025 ParkingPartagé - Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}

