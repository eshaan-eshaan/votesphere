import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "./LanguageContext.jsx";
import { useTheme } from "./ThemeContext.jsx";

const Navbar = () => {
  const { language, t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: "/", label: t("navOverview"), icon: "🏠", end: true },
    {
      to: "/kiosk",
      label: language === "en" ? "Voting Portal" : "मतदान पोर्टल",
      icon: "🗳️",
      tooltip: "Secure voting screen where verified voters cast encrypted ballots."
    },
    {
      to: "/audit",
      label: t("navAudit"),
      icon: "🔍",
      tooltip: "Public page to verify ballot hashes and inspect the tamper-proof ledger."
    },
    { to: "/architecture", label: t("navArchitecture"), icon: "🏗️" },
    { to: "/admin-login", label: "Admin", icon: "🛡️" },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <motion.nav
        className="navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="navbar-inner">
          {/* Logo */}
          <NavLink to="/" className="nav-logo">
            <motion.div
              className="nav-logo-mark"
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
            />
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              VoteSphere
            </motion.span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="nav-links">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.tooltip}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                <motion.div
                  className="nav-link-content"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -2 }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.tooltip && <span className="nav-help-icon">?</span>}
                </motion.div>

                {/* Active indicator line */}
                {location.pathname === item.to && (
                  <motion.div
                    className="nav-active-indicator"
                    layoutId="activeIndicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </NavLink>
            ))}

            {/* Divider */}
            <div className="nav-divider" />

            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              className="nav-icon-btn"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </motion.button>

            {/* Language toggle */}
            <motion.button
              onClick={toggleLanguage}
              className="nav-icon-btn nav-lang-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {language === "en" ? "हिं" : "EN"}
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="nav-mobile-toggle"
            onClick={toggleMobileMenu}
            whileTap={{ scale: 0.9 }}
          >
            <div className={`hamburger ${isMobileMenuOpen ? "open" : ""}`}>
              <span />
              <span />
              <span />
            </div>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="nav-mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileMenu}
            />
            <motion.div
              className="nav-mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="nav-mobile-header">
                <div className="nav-logo">
                  <div className="nav-logo-mark" />
                  <span>VoteSphere</span>
                </div>
                <button className="nav-mobile-close" onClick={toggleMobileMenu}>
                  ✕
                </button>
              </div>

              <div className="nav-mobile-links">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={toggleMobileMenu}
                      className={({ isActive }) =>
                        isActive ? "nav-mobile-link nav-mobile-link-active" : "nav-mobile-link"
                      }
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              <div className="nav-mobile-footer">
                <button onClick={toggleTheme} className="nav-mobile-action">
                  {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
                <button onClick={toggleLanguage} className="nav-mobile-action">
                  {language === "en" ? "🇮🇳 हिंदी" : "🇬🇧 English"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
