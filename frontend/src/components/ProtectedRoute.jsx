import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiService } from "../services/apiService";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    (async () => {
      try {
        await apiService.me(); // valide le cookie
        setState({ loading: false, ok: true });
      } catch {
        setState({ loading: false, ok: false });
      }
    })();
  }, []);

  if (state.loading) return null; // ou spinner
  if (!state.ok) return <Navigate to="/login" replace />;

  return children;
}
