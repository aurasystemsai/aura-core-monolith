import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Production Core API
export const CORE_API = "https://aura-core-monolith.onrender.com";
window.CORE_API = CORE_API;

const rootEl = document.getElementById("root");
if (!rootEl) {
 // Defensive: log a clear error if #root is missing
 console.error("[AURA] FATAL: #root element not found in index.html. React app cannot mount.");
 document.body.innerHTML = '<div style="color:#fff;background:#09090b;padding:48px;border-radius:18px;margin:64px auto;max-width:540px;text-align:center;font-weight:700;font-size:20px;box-shadow:0 8px 32px #0006;">FATAL: #root element not found. App cannot start.</div>';
} else {
 ReactDOM.createRoot(rootEl).render(
 <React.StrictMode>
 <App />
 </React.StrictMode>
 );
}
