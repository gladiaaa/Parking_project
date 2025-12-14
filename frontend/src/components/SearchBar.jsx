import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (location) {
      try {
        const response = await fetch(
          `http://localhost:8001/api/parkings?location=${encodeURIComponent(location)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}` || "",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Parkings trouvés:", data);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto scale-in">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 border border-gray-100">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Location Input */}
          <div 
            className={`flex-1 p-6 md:p-8 transition-all duration-300 ${
              focused === 'location' ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Destination
            </label>
        <input
          type="text"
              placeholder="Où souhaitez-vous vous garer ?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setFocused('location')}
              onBlur={() => setFocused(null)}
              className="w-full text-lg md:text-xl text-gray-900 font-light focus:outline-none placeholder-gray-300 bg-transparent"
            />
          </div>

          {/* Date Input */}
          <div 
            className={`flex-1 p-6 md:p-8 transition-all duration-300 ${
              focused === 'date' ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <label className="block text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Date & heure
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={() => setFocused('date')}
              onBlur={() => setFocused(null)}
              className="w-full text-lg md:text-xl text-gray-900 font-light focus:outline-none bg-transparent"
        />
          </div>

          {/* Search Button */}
          <div className="p-4 md:p-6 flex items-center justify-center">
        <button
          type="submit"
              className="w-full md:w-auto bg-zenpark text-white px-10 py-4 rounded-2xl hover:bg-zenpark-700 transition-all duration-300 font-light text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Rechercher</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'].map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setLocation(city)}
            className="px-5 py-2 bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-full hover:bg-white/30 transition-all duration-300 text-sm font-light"
          >
            {city}
        </button>
        ))}
      </div>
    </form>
  );
}
