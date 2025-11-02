import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    // Rediriger vers la page de résultats ou rechercher via l'API
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
          // TODO: Afficher les résultats (peut-être créer une page de résultats)
          console.log("Parkings trouvés:", data);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Où cherchez-vous un parking ?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
        />
        <button
          type="submit"
          className="bg-[#34A853] text-white px-8 py-3 rounded-lg hover:bg-[#2d8f45] transition font-medium"
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}

