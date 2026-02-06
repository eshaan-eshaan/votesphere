import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LanguageProvider } from "./components/LanguageContext.jsx";
import { ThemeProvider } from "./components/ThemeContext.jsx";

// CSS imports – only files that exist in src/styles
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/animations.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
