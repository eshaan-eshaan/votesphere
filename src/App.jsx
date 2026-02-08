import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import Landing from "./pages/Landing.jsx";
import KioskDemo from "./pages/KioskDemo.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import Audit from "./pages/Audit.jsx";
import Architecture from "./pages/Architecture.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";

const App = () => {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/kiosk" element={<KioskDemo />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/architecture" element={<Architecture />} />

          {/* Admin auth flow */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Protected admin dashboard */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
};

export default App;
