import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";

export default function SiteAuditHealth() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const fileInputRef = useRef();

  // Fetch history
  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/api/site-audit-health/history");
      const data = await res.json();
      if (data.ok) setHistory(data.history || []);
    } catch {}
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/site-audit-health/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  // AI Audit
  const handleAudit = async () => {
    setLoading(true);
    setError("");
    setResponse("");
      try {
        const res = await apiFetch("/api/site-audit-health/ai/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: input })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setResponse(data.auditReport || "No report generated");
        // Save to history
        await apiFetch("/api/site-audit-health/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: input, report: data.auditReport })
        });
        fetchHistory();
        } catch (err) {
          setError(err.message);
              } finally {
                setLoading(false);
              }
            }
      
        // Add your component's JSX here
        return (
          <div>
            {/* Component UI goes here */}
          </div>
        );
      }