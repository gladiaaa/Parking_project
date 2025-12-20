import React from "react";
import { useNavigate } from "react-router-dom";

const DAY_LABELS = { 1:"Lun",2:"Mar",3:"Mer",4:"Jeu",5:"Ven",6:"Sam",7:"Dim" };

function formatOpeningDays(days) {
  if (!Array.isArray(days) || days.length === 0) return null;
  return days.map((d) => DAY_LABELS[d]).filter(Boolean).join(", ");
}

export default function ParkingCard({ parking }) {
  const navigate = useNavigate();

  const address = parking.address || parking.adresse || "Adresse non disponible";
  const capacity = parking.capacity ?? parking.nombre_places;
  const hourlyRate = parking.hourly_rate ?? parking.tarif_horaire;

  const daysLabel = formatOpeningDays(parking.opening_days);
  const openingTime = parking.opening_time;
  const closingTime = parking.closing_time;

  const handleReserve = () => {
    // Auth via cookies: pas de localStorage token ici
    navigate(`/parking/${parking.id}/reserve`);
  };

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {parking.image ? (
          <img
            src={parking.image}
            alt={parking.nom || "Parking"}
            className="w-full h-full object-cover hover:scale-110 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zenpark-100 to-zenpark-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-zenpark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </div>
        )}

        {capacity != null && (
          <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-full shadow">
            <span className="text-sm font-semibold text-zenpark">
              {capacity} places
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          {parking.nom || "Parking"}
        </h3>

        <div className="flex items-start mb-3">
          <svg className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 text-sm">{address}</p>
        </div>

        {(daysLabel || (openingTime && closingTime)) && (
          <div className="text-sm text-gray-600 mb-4">
            {daysLabel ? `Ouvert: ${daysLabel}` : ""}
            {openingTime && closingTime ? ` · ${openingTime}–${closingTime}` : ""}
          </div>
        )}

        <div className="space-y-2 mb-5">
          {hourlyRate != null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Horaire</span>
              <span className="font-semibold text-zenpark">{hourlyRate} €</span>
            </div>
          )}
        </div>

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
