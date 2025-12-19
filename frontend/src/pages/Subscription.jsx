import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";

const Subscription = () => {
  const navigate = useNavigate();
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Semainier par défaut
  const daysOfWeek = [
    { id: 1, label: "Lundi", active: false, start: "08:00", end: "18:00" },
    { id: 2, label: "Mardi", active: false, start: "08:00", end: "18:00" },
    { id: 3, label: "Mercredi", active: false, start: "08:00", end: "18:00" },
    { id: 4, label: "Jeudi", active: false, start: "08:00", end: "18:00" },
    { id: 5, label: "Vendredi", active: false, start: "08:00", end: "18:00" },
    { id: 6, label: "Samedi", active: false, start: "08:00", end: "18:00" },
    { id: 7, label: "Dimanche", active: false, start: "08:00", end: "18:00" },
  ];

  const [schedule, setSchedule] = useState(daysOfWeek);
  const [months, setMonths] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      const response = await apiService.searchParkings();
      if (response.success && Array.isArray(response.parkings)) {
        setParkings(response.parkings);
        if (response.parkings.length > 0) setSelectedParking(response.parkings[0].id);
      } else {
        setParkings([]);
      }
    } catch (err) {
      setError("Impossible de charger les parkings.");
      setParkings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (id) => {
    setSchedule(schedule.map(day => 
      day.id === id ? { ...day, active: !day.active } : day
    ));
  };

  const handleTimeChange = (id, field, value) => {
    setSchedule(schedule.map(day => 
      day.id === id ? { ...day, [field]: value } : day
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Formatage pour l'API
    // On ne garde que les jours actifs
    const weeklySlots = schedule
      .filter(day => day.active)
      .map(day => ({
        day_of_week: day.id,
        start_time: day.start,
        end_time: day.end
      }));

    if (weeklySlots.length === 0) {
      setError("Veuillez sélectionner au moins un jour.");
      return;
    }

    try {
      await apiService.createSubscription({
        parking_id: selectedParking,
        start_date: startDate,
        months: parseInt(months),
        weekly_slots: weeklySlots
      });
      setSuccess(true);
      setTimeout(() => navigate('/mes-reservations'), 2000);
    } catch (err) {
      setError(err.message || "Erreur lors de la création de l'abonnement");
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Créer un Abonnement</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Abonnement créé avec succès ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection Parking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choisir un parking</label>
            <select
              value={selectedParking}
              onChange={(e) => setSelectedParking(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {parkings.map(p => (
                <option key={p.id} value={p.id}>{p.nom} - {p.adresse}</option>
              ))}
            </select>
          </div>

          {/* Durée et Début */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durée (mois)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>

          {/* Semainier */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vos créneaux hebdomadaires</h3>
            <div className="space-y-3">
              {schedule.map((day) => (
                <div key={day.id} className={`flex items-center justify-between p-3 rounded-lg border ${day.active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={day.active}
                      onChange={() => handleDayToggle(day.id)}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                    />
                    <span className={`font-medium ${day.active ? 'text-indigo-900' : 'text-gray-500'}`}>{day.label}</span>
                  </div>
                  
                  {day.active && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={day.start}
                        onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={day.end}
                        onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Valider l'abonnement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Subscription;
