import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ----------------------
// GLOBAL CONFIG
// ----------------------

// Production Core API
export const CORE_API = "https://aura-core-monolith.onrender.com";

// Attach globally (optional)
window.CORE_API = CORE_API;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
