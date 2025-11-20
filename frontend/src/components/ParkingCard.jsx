import React from "react";
import { useNavigate } from "react-router-dom";

export default function ParkingCard({ parking }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleReserve = () => {
    if (!token) {
      navigate("/login");
      return;
    }
    navigate(`/parking/${parking.id}/reserve`);
  };

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
      {/* Image du parking */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {parking.image ? (
          <img
            src={parking.image}
            alt={parking.nom}
            className="w-full h-full object-cover hover:scale-110 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zenpark-100 to-zenpark-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-zenpark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </div>
        )}
        
        {/* Badge disponibilité */}
        {parking.nombre_places && (
          <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow">
            <span className="text-sm font-semibold text-zenpark">
              {parking.nombre_places} places
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          {parking.nom || "Parking"}
        </h3>
        
        <div className="flex items-start mb-4">
          <svg className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 text-sm">
            {parking.adresse || "Adresse non disponible"}
          </p>
        </div>

        {/* Informations tarifaires */}
        <div className="space-y-2 mb-5">
          {parking.tarif_horaire && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Horaire</span>
              <span className="font-semibold text-zenpark">{parking.tarif_horaire} €</span>
            </div>
          )}
          {parking.tarif_journalier && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Journalier</span>
              <span className="font-semibold text-zenpark">{parking.tarif_journalier} €</span>
            </div>
          )}
          {parking.tarif_mensuel && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Mensuel</span>
              <span className="font-semibold text-zenpark">{parking.tarif_mensuel} €</span>
            </div>
          )}
        </div>

        {/* Bouton réserver */}
        <button
          onClick={handleReserve}
          className="w-full bg-zenpark text-white py-3 rounded-xl hover:bg-zenpark-700 transition font-medium"
        >
          Réserver
        </button>
      </div>
    </div>
  );
}
