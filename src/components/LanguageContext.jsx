import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

// Only the strings the navbar actually uses.
const translations = {
  en: {
    navOverview: "Overview",
    navAudit: "Audit",
    navArchitecture: "Architecture",
  },
  hi: {
    navOverview: "अवलोकन",
    navAudit: "ऑडिट",
    navArchitecture: "आर्किटेक्चर",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const t = (key) => translations[language][key] || key;

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "hi" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
