import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiService } from "../services/apiService";

export default function ProtectedRoute({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    apiService
      .getCurrentUser()
      .then((user) => {
        if (user) setAllowed(true);
        else setAllowed(false);
      })
      .catch(() => setAllowed(false));
  }, []);

  if (allowed === null) return <div>Chargement...</div>;
  if (!allowed) return <Navigate to="/login" />;

  return children;
}
