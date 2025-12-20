import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

/**
 * AddressAutocomplete
 * - Utilise https://api-adresse.data.gouv.fr/search/?q=
 * - Retourne { label, latitude, longitude }
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onPick,
  placeholder = "10 Rue de Rivoli, 75004 Paris",
  className = "",
  minChars = 3,
  limit = 6,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function fetchSuggestions(q) {
    const query = String(q || "").trim();
    if (query.length < minChars) {
      setSuggestions([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        query
      )}&limit=${limit}`;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error("Service d’adresse indisponible");
      const data = await res.json();

      const features = Array.isArray(data?.features) ? data.features : [];
      const list = features
        .map((f) => {
          const label = f?.properties?.label;
          const coords = f?.geometry?.coordinates; // [lng, lat]
          if (!label || !Array.isArray(coords) || coords.length < 2) return null;
          return {
            label,
            longitude: Number(coords[0]),
            latitude: Number(coords[1]),
          };
        })
        .filter(Boolean);

      setSuggestions(list);
    } catch (e) {
      if (String(e?.name) !== "AbortError") {
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleInput(next) {
    onChange(next);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(next), 250);
  }

  function pick(s) {
    onPick?.(s);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>

        <input
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => {
            setOpen(true);
            fetchSuggestions(value);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-gray-100 border-none rounded-xl font-medium text-gray-900 focus:ring-2 focus:ring-black transition-all"
          type="text"
        />
      </div>

      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-600">Recherche…</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-600">
              Aucune suggestion.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {suggestions.map((s) => (
                <li key={`${s.latitude}-${s.longitude}-${s.label}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // empêche blur avant click
                    onClick={() => pick(s)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="text-sm text-gray-900">{s.label}</div>
                    <div className="text-xs text-gray-500">
                      {s.latitude.toFixed(6)}, {s.longitude.toFixed(6)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
