import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-600 border-t border-gray-100">
      <div className="container mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full"></div>
              <span className="text-xl font-light text-gray-900">parkingpartagé</span>
            </div>
            <p className="text-gray-500 leading-relaxed max-w-md font-light">
              La solution simple et moderne pour trouver et réserver votre place de parking partout en France.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-gray-900 font-light mb-4 text-lg">Liens</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors font-light">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-500 hover:text-gray-900 transition-colors font-light">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-500 hover:text-gray-900 transition-colors font-light">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 font-light mb-4 text-lg">Contact</h3>
            <ul className="space-y-3 text-gray-500 font-light">
              <li>support@parkingpartage.fr</li>
              <li>01 23 45 67 89</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm font-light">
            © 2025 ParkingPartagé. Tous droits réservés.
          </p>
          <div className="flex space-x-8 text-sm">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors font-light">
              Confidentialité
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors font-light">
              Conditions
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors font-light">
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
