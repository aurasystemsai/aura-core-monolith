import React, { useEffect, useMemo, useState } from "react";
import "./FixQueue.css";

function normaliseCoreUrl(coreUrl) {
  return String(coreUrl || "").replace(/\/+$/, "");
}

export default function FixQueue({ coreUrl, projectId }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");

  const baseUrl = useMemo(
    () => normaliseCoreUrl(coreUrl),
    [coreUrl]
  );

  const endpoint = useMemo(() => {
    const q = statusFilter ? `?status=${statusFilter}` : "";
    return `${baseUrl}/projects/${projectId}/fix-queue${q}`;
  }, [baseUrl, projectId, statusFilter]);

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, [endpoint]);

  const updateStatus = async (id, status) => {
    await fetch(`${baseUrl}/projects/${projectId}/fix-queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="fq-wrap">
      <h2>Fix Queue</h2>
      <p className="fq-sub">
        This is your execution list. Fix these issues and mark them complete.
      </p>

      <div className="fq-toolbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="fixed">Fixed</option>
          <option value="ignored">Ignored</option>
        </select>

        <button onClick={load}>Refresh</button>
      </div>

      <table className="fq-table">
        <thead>
          <tr>
            <th>URL</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {status === "loading" ? (
            <tr>
              <td colSpan={4}>Loading…</td>
            </tr>
          ) : !items.length ? (
            <tr>
              <td colSpan={4}>No queued fixes.</td>
            </tr>
          ) : (
            items.map((row) => (
              <tr key={row.id}>
                <td>
                  <a href={row.url} target="_blank" rel="noreferrer">
                    {row.url}
                  </a>
                </td>
                <td>{row.issue}</td>
                <td>{row.status}</td>
                <td>
                  <button onClick={() => updateStatus(row.id, "fixed")}>
                    Fixed
                  </button>
                  <button onClick={() => updateStatus(row.id, "ignored")}>
                    Ignore
                  </button>
                  <button onClick={() => updateStatus(row.id, "open")}>
                    Reopen
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
