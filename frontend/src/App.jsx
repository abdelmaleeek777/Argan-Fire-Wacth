import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/public/LandingPage";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import PendingPage from "./pages/public/PendingPage";
import RejectedPage from "./pages/public/RejectedPage";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CooperativesPage from "./pages/admin/CooperativesPage";
import PendingApprovalsPage from "./pages/admin/PendingApprovalsPage";
import CooperativeDetailPage from "./pages/admin/CooperativeDetailPage";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSensors from "./pages/admin/AdminSensors";
import AdminMap from "./pages/admin/AdminMap";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminLogs from "./pages/admin/AdminLogs";

// Cooperative
import CoopLayout from "./components/cooperative/CoopLayout";
import CoopDashboard from "./pages/cooperative/CoopDashboard";
import CoopAlerts from "./pages/cooperative/CoopAlerts";
import CoopMap from "./pages/cooperative/CoopMap";
import MesZones from "./pages/cooperative/MesZones";
import CoopSensors from "./pages/cooperative/CoopSensors";

// Pompier (Firefighter)
import FirefighterLayout from "./components/pompier/FirefighterLayout";
import FirefighterDashboard from "./pages/pompier/FirefighterDashboard";
import PompierNotifications from "./pages/pompier/PompierNotifications";
import FirefighterIncidents from "./pages/pompier/FirefighterIncidents";

import "./App.css";

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <main>
                <LandingPage />
              </main>
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <main>
                <Login />
              </main>
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <main>
                <Register />
              </main>
            </>
          }
        />
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/rejected" element={<RejectedPage />} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="cooperatives" element={<CooperativesPage />} />
          <Route path="cooperatives/:id" element={<CooperativeDetailPage />} />
          <Route path="pending" element={<PendingApprovalsPage />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="sensors" element={<AdminSensors />} />
          <Route path="map" element={<AdminMap />} />
          <Route path="alerts" element={<AdminAlerts />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        {/* Coop Routes */}
        <Route 
          path="/coop" 
          element={
            <ProtectedRoute allowedRoles={["UTILISATEUR_COOP", "COOP", "COOPERATIVE"]}>
              <CoopLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/coop/dashboard" replace />} />
          <Route path="dashboard" element={<CoopDashboard />} />
          <Route path="alerts" element={<CoopAlerts />} />
          <Route path="zones" element={<MesZones />} />
          <Route path="sensors" element={<CoopSensors />} />
          <Route path="map" element={<CoopMap />} />
        </Route>

<Route 
          path="/pompier" 
          element={
            <ProtectedRoute allowedRoles={["POMPIER", "FIREFIGHTER", "CHEF_EQUIPE"]}>
              <FirefighterLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/pompier/dashboard" replace />} />
          <Route path="dashboard" element={<FirefighterDashboard />} />
          <Route path="notifications" element={<PompierNotifications />} />
          <Route path="incidents" element={<FirefighterIncidents />} />
        </Route>

      </Routes>
    </div>
  );
}

export default App;
