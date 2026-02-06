import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";

import Landing from "./pages/Landing.jsx";
import KioskDemo from "./pages/KioskDemo.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

// correct imports
import Audit from "./pages/Audit.jsx";
import Architecture from "./pages/Architecture.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";

const App = () => {
  return (
    <Layout>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/kiosk" element={<KioskDemo />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/architecture" element={<Architecture />} />

        {/* Admin-only flow */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default App;
