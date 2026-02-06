import React from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import { useTheme } from "./ThemeContext.jsx";

const Navbar = () => {
  const { language, t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const votingLabel = language === "en" ? "Voting Portal" : "मतदान पोर्टल";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-logo">
          <div className="nav-logo-mark" />
          <span>VoteSphere</span>
        </div>
        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            {t("navOverview")}
          </NavLink>

          {/* Voting page with tooltip */}
          <NavLink
            to="/kiosk"
            title="Secure voting screen where verified voters cast encrypted ballots."
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            <span>{votingLabel}</span>
            <span className="nav-help-icon">?</span>
          </NavLink>

          {/* Public audit with tooltip */}
          <NavLink
            to="/audit"
            title="Public page to verify ballot hashes and inspect the tamper-proof ledger."
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            <span>{t("navAudit")}</span>
            <span className="nav-help-icon">?</span>
          </NavLink>

          <NavLink
            to="/architecture"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            {t("navArchitecture")}
          </NavLink>

          <NavLink
            to="/admin-login"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Admin Login
          </NavLink>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-outline"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              padding: "4px 10px",
              fontSize: "0.9rem",
              borderRadius: "999px",
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="btn-outline"
            style={{
              padding: "4px 12px",
              fontSize: "0.8rem",
              borderRadius: "999px",
            }}
          >
            {language === "en" ? "हिं" : "EN"}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
