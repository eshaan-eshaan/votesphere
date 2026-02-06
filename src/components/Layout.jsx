import React from "react";
import Navbar from "./Navbar.jsx";

const Layout = ({ children }) => {
  return (
    <div className="app-root">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
