import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Reservation from "./pages/Reservation.jsx";
import MesReservations from "./pages/MesReservations.jsx";
import Maps from "./pages/Maps.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import ParkingDetails from "./pages/ParkingDetails.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/maps" element={<Maps />} />
        
        {/* Routes protégées */}
        <Route
          path="/mes-reservations"
          element={
            <ProtectedRoute>
              <MesReservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-user"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-owner"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Route publique pour les détails de parking */}
        <Route path="/parking/:id" element={<ParkingDetails />} />
        
        {/* Redirection pour les routes obsolètes */}
        <Route path="/dashboard" element={<Navigate to="/dashboard-user" replace />} />
        <Route path="/owner" element={<Navigate to="/dashboard-owner" replace />} />
        
        {/* Route 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
