﻿
import React, { useState, useEffect, useRef } from "react";

export default function ToolScaffold({ toolId, toolName, fields }) {
  // Removed CSRF token logic (not needed)
  const safeFields = Array.isArray(fields) ? fields : [];
  const [form, setForm] = useState(() =>Object.fromEntries(safeFields.map(f => [f.name, f.defaultValue || ""])));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [validation, setValidation] = useState({});
  const formRef = useRef();

  // ...existing code...

  // Accessibility: focus first input on mount
  useEffect(() => {
    if (formRef.current) {
      const first = formRef.current.querySelector("input,textarea,select");
      if (first) first.focus();
    }
  }, [showHelp]);

  // Field validation
  const validate = () => {
    const v = {};
    safeFields.forEach(f => {
      if (f.required && !form[f.name]) v[f.name] = "Required";
      if (f.type === "email" && form[f.name] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form[f.name])) v[f.name] = "Invalid email";
      // Add more validation as needed
    });
    setValidation(v);
    return Object.keys(v).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    setForm({ ...form, [name]: type === "file" ? files[0] : value });
    setValidation(v => ({ ...v, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let body, headers;
      if (safeFields.some(f => f.type === "file")) {
        body = new FormData();
        safeFields.forEach(f => body.append(f.name, form[f.name]));
        headers = {};
      } else {
        body = JSON.stringify(form);
        headers = { "Content-Type": "application/json" };
      }
      const res = await fetch(`/api/run/${toolId}`, {
        method: "POST",
        headers,
        body
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setLoading(true);
    try {
      await fetch(`/api/run/${toolId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
      alert("Thank you for your feedback!");
    } catch {
      alert("Failed to send feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="tool-generic"
      style={{
        background: darkMode ? "#1f2433" : "#fff",
        color: darkMode ? "#a3e635" : "#0a0b0f",
        borderRadius: 16,
        boxShadow: "0 2px 16px #0001",
        padding: 32,
        
        
        fontFamily: 'Inter, sans-serif',
        transition: "background 0.3s, color 0.3s"
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{toolName}</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#0a0b0f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <button onClick={() => setShowHelp(h => !h)} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>{showHelp ? "Hide" : "Show"} Help</button>
      {showHelp && (
        <div style={{ background: darkMode ? "#0a0b0f" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>How to use {toolName}</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: darkMode ? "#a3e635" : "#4b5780", fontSize: 15 }}>
            <li>Fill out all required fields and click Run Tool.</li>
            <li>Advanced fields: file upload, select, date, textarea, etc. are supported.</li>
            <li>Results and errors will appear below the form.</li>
            <li>Send feedback to help us improve this tool.</li>
          </ul>
        </div>
      )}
      <form ref={formRef} onSubmit={handleSubmit} style={{}} aria-label={`Form for ${toolName}` }>
        {safeFields.map(f => (
          <div key={f.name} style={{ marginBottom: 16 }}>
            <label htmlFor={f.name} style={{ fontWeight: 600 }}>{f.label || f.name}{f.required ? '*' : ''}</label>
            {f.type === 'textarea' ? (
              <textarea id={f.name} name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={{ width: "100%", borderRadius: 8, padding: 8, fontSize: 15, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
            ) : f.type === 'select' && Array.isArray(f.options) ? (
              <select id={f.name} name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={{ width: "100%", borderRadius: 8, padding: 8, fontSize: 15, border: darkMode ? "1px solid #555" : "1px solid #ccc" }}>
                <option value="">Select...</option>
                {f.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : f.type === 'date' ? (
              <input id={f.name} name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={{ width: "100%", borderRadius: 8, padding: 8, fontSize: 15, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} type="date" />
            ) : f.type === 'file' ? (
              <input id={f.name} name={f.name} onChange={handleChange} required={f.required} style={{ width: "100%", borderRadius: 8, padding: 8, fontSize: 15, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} type="file" />
            ) : (
              <input id={f.name} name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={{ width: "100%", borderRadius: 8, padding: 8, fontSize: 15, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} type={f.type || 'text'} />
            )}
            {validation[f.name] && <div style={{ color: "#ef4444", fontSize: 13 }}>{validation[f.name]}</div>}
          </div>
        ))}
        <button type="submit" disabled={loading} style={{ marginTop: 12, background: "#4f46e5", color: "#0a0b0f", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 12px #22d3ee55" }}>
          {loading ? "Running..." : "Run Tool"}
        </button>
      </form>
      {error && <div style={{ color: "#c00", marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Result</h3>
          <pre style={{ background: darkMode ? "#0a0b0f" : "#222", color: darkMode ? "#a3e635" : "#4f46e5", padding: 12, borderRadius: 6, overflowX: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      <div style={{ marginTop: 32, background: darkMode ? "#0a0b0f" : "#f8fafc", borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Share feedback or suggestions..."
            style={{ flex: 1, fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #333" : "1px solid #ccc", background: darkMode ? "#0a0b0f" : "#fff", color: darkMode ? "#a3e635" : "#0a0b0f" }}
            aria-label="Feedback input"
          />
          <button onClick={handleFeedback} disabled={loading || !feedback} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Send</button>
        </div>
      </div>
    </div>
  );
}

