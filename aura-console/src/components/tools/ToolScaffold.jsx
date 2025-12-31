import React, { useState } from "react";

export default function ToolScaffold({ toolId, toolName, fields }) {
  const safeFields = Array.isArray(fields) ? fields : [];
  const [form, setForm] = useState(() => Object.fromEntries(safeFields.map(f => [f.name, f.defaultValue || ""])));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/run/${toolId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
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

  return (
    <div className="tool-generic">
      <h2>{toolName}</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
        {(safeFields).map(f => (
          <div key={f.name}>
            <label>{f.label || f.name}{f.required ? '*' : ''}</label>
            {f.type === 'textarea' ? (
              <textarea name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={{ width: "100%" }} />
            ) : (
              <input name={f.name} value={form[f.name]} onChange={handleChange} required={f.required} style={{ width: "100%" }} type={f.type || 'text'} />
            )}
          </div>
        ))}
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Running..." : "Run Tool"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Result</h3>
          <pre style={{ background: "#222", color: "#7fffd4", padding: 12, borderRadius: 6, overflowX: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
