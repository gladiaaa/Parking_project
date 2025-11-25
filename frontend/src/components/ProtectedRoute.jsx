import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.toLowerCase().trim();

  if (role && userRole !== role.toLowerCase().trim()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
