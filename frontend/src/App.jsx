import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/public/LandingPage";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CooperativesPage from "./pages/admin/CooperativesPage";
import PendingApprovalsPage from "./pages/admin/PendingApprovalsPage";
import CooperativeDetailPage from "./pages/admin/CooperativeDetailPage";
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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="cooperatives" element={<CooperativesPage />} />
          <Route path="cooperatives/:id" element={<CooperativeDetailPage />} />
          <Route path="pending" element={<PendingApprovalsPage />} />
          <Route path="users" element={<div>Users Management (TBD)</div>} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
