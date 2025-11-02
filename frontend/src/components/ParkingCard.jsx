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
    // TODO: Ouvrir un modal ou rediriger vers une page de réservation
    navigate(`/parking/${parking.id}/reserve`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden">
      {/* Image du parking */}
      <div className="h-48 bg-gray-200 overflow-hidden">
        {parking.image ? (
          <img
            src={parking.image}
            alt={parking.nom}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-500">Aucune image</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-5">
        <h3 className="text-xl font-bold mb-2">{parking.nom || "Parking"}</h3>
        <p className="text-gray-600 mb-3">
          {parking.adresse || "Adresse non disponible"}
        </p>

        {/* Informations */}
        <div className="space-y-2 mb-4">
          {parking.tarif_horaire && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Tarif horaire:</span>{" "}
              {parking.tarif_horaire} €
            </p>
          )}
          {parking.tarif_journalier && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Tarif journalier:</span>{" "}
              {parking.tarif_journalier} €
            </p>
          )}
          {parking.nombre_places && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Places disponibles:</span>{" "}
              {parking.nombre_places}
            </p>
          )}
        </div>

        {/* Bouton réserver */}
        <button
          onClick={handleReserve}
          className="w-full bg-[#34A853] text-white py-2 rounded-lg hover:bg-[#2d8f45] transition font-medium"
        >
          Réserver
        </button>
      </div>
    </div>
  );
}

