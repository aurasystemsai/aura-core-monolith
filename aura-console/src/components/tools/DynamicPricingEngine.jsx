
import React, { useEffect, useState, useRef } from "react";

export default function DynamicPricingEngine() {
  const [activeTab, setActiveTab] = useState(0);
  const [input, setInput] = useState("");
  const [bulkUpload, setBulkUpload] = useState(null);
  const [response, setResponse] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [collaborators, setCollaborators] = useState("");
  const [notification, setNotification] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [newRule, setNewRule] = useState({ name: "", scope: "global", actions: [{ type: "set-price", value: 0 }] });
  const [signalsSummary, setSignalsSummary] = useState(null);
  const [priceForm, setPriceForm] = useState({ basePrice: "", cost: "", currency: "USD", rounding: "ending-99", guardrails: { floor: "", ceiling: "", map: "", minMargin: "" } });
  const [experiments, setExperiments] = useState([]);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [newExperiment, setNewExperiment] = useState({ name: "", description: "", allocationStrategy: "random", variants: [{ id: "control", name: "Control", weight: 1 }], scope: "global" });
  const fileInputRef = useRef();

  useEffect(() => {
    loadRules();
    loadSummaries();
    loadExperiments();
  }, []);

  const loadRules = async () => {
    try {
      const res = await fetch("/api/dynamic-pricing-engine/rules");
      const data = await res.json();
      if (data.ok) setRules(data.rules || []);
    } catch (err) {
      setNotification("Failed to load rules");
    }
  };

  const loadSummaries = async () => {
    try {
      const [signalsRes, analyticsRes] = await Promise.all([
        fetch("/api/dynamic-pricing-engine/signals/summary"),
        fetch("/api/dynamic-pricing-engine/analytics/summary")
      ]);
      const signalsData = await signalsRes.json();
      const analyticsData = await analyticsRes.json();
      if (signalsData.ok) setSignalsSummary(signalsData.summary || null);
      if (analyticsData.ok) setAnalyticsSummary(analyticsData.summary || null);
    } catch (err) {
      setNotification("Failed to load summaries");
    }
  };

  const loadExperiments = async () => {
    try {
      const res = await fetch("/api/dynamic-pricing-engine/experiments");
      const data = await res.json();
      if (data.ok) setExperiments(data.experiments || []);
    } catch (err) {
      setNotification("Failed to load experiments");
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setAnalytics(null);
    setNotification("");
    try {
      let body, headers;
      if (bulkUpload) {
        body = new FormData();
        body.append("file", bulkUpload);
        if (input) body.append("product", input);
        headers = {};
      } else {
        body = JSON.stringify({ product: input });
        headers = { "Content-Type": "application/json" };
      }
      const res = await fetch("/api/dynamic-pricing-engine/ai/price", {
        method: "POST",
        headers,
        body
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.price || "No price generated");
      setAnalytics(data.analytics || null);
      setNotification("Pricing complete.");
      setHistory(prev => [{
        product: input,
        bulkUpload: bulkUpload ? bulkUpload.name : null,
        price: data.price || "No price generated",
        analytics: data.analytics || null
      }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const body = {
        basePrice: Number(priceForm.basePrice),
        cost: priceForm.cost ? Number(priceForm.cost) : undefined,
        currency: priceForm.currency,
        rounding: priceForm.rounding,
        guardrails: {
          floor: priceForm.guardrails.floor ? Number(priceForm.guardrails.floor) : undefined,
          ceiling: priceForm.guardrails.ceiling ? Number(priceForm.guardrails.ceiling) : undefined,
          map: priceForm.guardrails.map ? Number(priceForm.guardrails.map) : undefined,
          minMargin: priceForm.guardrails.minMargin ? Number(priceForm.guardrails.minMargin) : undefined
        }
      };
      const res = await fetch("/api/dynamic-pricing-engine/pricing/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Evaluation failed");
      setResponse(data.price || "No price generated");
      setAnalytics(data.diagnostics || null);
      setHistory(prev => [{ product: `base:${priceForm.basePrice}`, price: data.price, analytics: data.diagnostics }, ...prev].slice(0, 10));
      loadSummaries();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    setNotification("");
    try {
      const res = await fetch("/api/dynamic-pricing-engine/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule)
      });
      const data = await res.json();
      if (!data.ok) throw new Error((data.errors && data.errors[0]) || data.error || "Rule create failed");
      setNewRule({ name: "", scope: "global", actions: [{ type: "set-price", value: 0 }] });
      loadRules();
      setNotification("Rule created");
    } catch (err) {
      setNotification(err.message);
    }
  };

  const handlePublishRule = async (id) => {
    try {
      const res = await fetch(`/api/dynamic-pricing-engine/rules/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Publish failed");
      loadRules();
      setNotification("Rule published");
    } catch (err) {
      setNotification(err.message);
    }
  };

  const handleIngestSignals = async () => {
    try {
      const res = await fetch("/api/dynamic-pricing-engine/signals/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ type: "demand", value: 1.1 }, { type: "inventory", value: 120 }] })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Ingest failed");
      setSignalsSummary(data.summary || null);
      setNotification("Signals ingested");
    } catch (err) {
      setNotification(err.message);
    }
  };

  const handleExport = () => {
    if (!response) return;
    const blob = new Blob([response], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dynamic-pricing.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setNotification("Sending feedback...");
    try {
      await fetch("/api/dynamic-pricing-engine/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setNotification("Feedback sent. Thank you!");
      setFeedback("");
    } catch {
      setNotification("Failed to send feedback");
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'rules', name: 'Rules' },
    { id: 'simulator', name: 'Pricing Simulator' },
    { id: 'experiments', name: 'Experiments' },
    { id: 'signals', name: 'Signals' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'settings', name: 'Settings' }
  ];

  // Tab components
  const OverviewTab = () => (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Total Rules</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{rules.length}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Published</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{rules.filter(r => r.status === 'published').length}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Signals</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{signalsSummary?.total ?? 0}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Analytics Events</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{analyticsSummary?.total ?? 0}</div>
        </div>
      </div>
      
      <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Price Lookup</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
          <input 
            value={priceForm.basePrice} 
            onChange={e => setPriceForm({ ...priceForm, basePrice: e.target.value })} 
            placeholder="Enter base price..." 
            style={{ padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 16 }} 
          />
          <button onClick={handleEvaluate} disabled={!priceForm.basePrice} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, cursor: priceForm.basePrice ? "pointer" : "not-allowed" }}>
            Evaluate
          </button>
        </div>
        {response && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: "#ecfdf5", border: "1px solid #10b981" }}>
            <div style={{ fontSize: 14, color: "#065f46", marginBottom: 4 }}>Recommended Price</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#047857" }}>{priceForm.currency} {response}</div>
          </div>
        )}
      </div>

      <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h3>
        {history.length === 0 ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: 20 }}>No recent activity</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.slice(0, 5).map((h, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 8, background: darkMode ? "#0f172a" : "#fff", border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: 600 }}>{h.product}</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>Price: {h.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const RulesTab = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Pricing Rules</h3>
        <button onClick={() => setSelectedRule({ isNew: true })} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>
          Create Rule
        </button>
      </div>

      {selectedRule && (
        <div style={{ marginBottom: 24, padding: 24, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "2px solid #3b82f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedRule.isNew ? 'New Rule' : 'Edit Rule'}</h4>
            <button onClick={() => setSelectedRule(null)} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="Rule name" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <select value={newRule.scope} onChange={e => setNewRule({ ...newRule, scope: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="global">Global</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
              <option value="segment">Segment</option>
            </select>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: "block" }}>Action Type</label>
              <select value={newRule.actions[0]?.type} onChange={e => setNewRule({ ...newRule, actions: [{ ...newRule.actions[0], type: e.target.value }] })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <option value="set-price">Set Price</option>
                <option value="discount-percent">Discount %</option>
                <option value="discount-amount">Discount Amount</option>
                <option value="surcharge-percent">Surcharge %</option>
                <option value="surcharge-amount">Surcharge Amount</option>
              </select>
            </div>
            <input type="number" value={newRule.actions[0]?.value || 0} onChange={e => setNewRule({ ...newRule, actions: [{ ...newRule.actions[0], value: Number(e.target.value) }] })} placeholder="Value" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <button onClick={handleCreateRule} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontWeight: 600, cursor: "pointer" }}>
              {selectedRule.isNew ? 'Create' : 'Update'} Rule
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {rules.map(r => (
          <div key={r.id} style={{ padding: 16, borderRadius: 12, background: darkMode ? "#1f2937" : "#fff", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{r.name || `Rule ${r.id}`}</div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Scope: {r.scope} • Priority: {r.priority || 0} • Status: <span style={{ padding: "2px 8px", borderRadius: 4, background: r.status === 'published' ? '#dcfce7' : '#fef3c7', color: r.status === 'published' ? '#166534' : '#92400e', fontWeight: 600 }}>{r.status}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setSelectedRule(r); setNewRule(r); }} style={{ background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
              <button onClick={() => handlePublishRule(r.id)} disabled={r.status === 'published'} style={{ background: r.status === 'published' ? '#d1d5db' : '#22c55e', color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: r.status === 'published' ? 'not-allowed' : 'pointer' }}>
                {r.status === 'published' ? 'Published' : 'Publish'}
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            No rules created yet. Create your first pricing rule to get started.
          </div>
        )}
      </div>
    </div>
  );

  const SimulatorTab = () => (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Pricing Simulator</h3>
      <div style={{ padding: 24, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: "block" }}>Base Price</label>
            <input value={priceForm.basePrice} onChange={e => setPriceForm({ ...priceForm, basePrice: e.target.value })} placeholder="100.00" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: "block" }}>Cost (optional)</label>
            <input value={priceForm.cost} onChange={e => setPriceForm({ ...priceForm, cost: e.target.value })} placeholder="50.00" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: "block" }}>Currency</label>
            <select value={priceForm.currency} onChange={e => setPriceForm({ ...priceForm, currency: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: "block" }}>Rounding</label>
            <select value={priceForm.rounding} onChange={e => setPriceForm({ ...priceForm, rounding: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <option value="ending-99">.99 Ending</option>
              <option value="ending-95">.95 Ending</option>
              <option value="step">Step</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Guardrails</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <input value={priceForm.guardrails.floor} onChange={e => setPriceForm({ ...priceForm, guardrails: { ...priceForm.guardrails, floor: e.target.value } })} placeholder="Floor price" style={{ padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <input value={priceForm.guardrails.ceiling} onChange={e => setPriceForm({ ...priceForm, guardrails: { ...priceForm.guardrails, ceiling: e.target.value } })} placeholder="Ceiling price" style={{ padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <input value={priceForm.guardrails.map} onChange={e => setPriceForm({ ...priceForm, guardrails: { ...priceForm.guardrails, map: e.target.value } })} placeholder="MAP" style={{ padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <input value={priceForm.guardrails.minMargin} onChange={e => setPriceForm({ ...priceForm, guardrails: { ...priceForm.guardrails, minMargin: e.target.value } })} placeholder="Min margin (0.2)" style={{ padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          </div>
        </div>

        <button onClick={handleEvaluate} disabled={loading || !priceForm.basePrice} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px", fontWeight: 700, fontSize: 16, cursor: (loading || !priceForm.basePrice) ? "not-allowed" : "pointer" }}>
          {loading ? 'Evaluating...' : 'Run Simulation'}
        </button>

        {analytics && (
          <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: darkMode ? "#0f172a" : "#fff", border: "1px solid #e5e7eb" }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Diagnostics</h4>
            <div style={{ fontSize: 14, color: "#64748b", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
              {JSON.stringify(analytics, null, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const SignalsTab = () => (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Signals Management</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Total Signals</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{signalsSummary?.total ?? 0}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Last Received</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {signalsSummary?.lastReceivedAt ? new Date(signalsSummary.lastReceivedAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>

      <div style={{ padding: 24, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Signal Types</h4>
        {signalsSummary?.counts ? (
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(signalsSummary.counts).map(([type, count]) => (
              <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderRadius: 8, background: darkMode ? "#0f172a" : "#fff" }}>
                <span style={{ fontWeight: 600 }}>{type}</span>
                <span style={{ color: "#64748b" }}>{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#64748b" }}>No signals ingested yet</div>
        )}
      </div>

      <button onClick={handleIngestSignals} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>
        Ingest Sample Signals
      </button>
    </div>
  );

  const AnalyticsTab = () => (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Analytics Dashboard</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>Total Events</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{analyticsSummary?.total ?? 0}</div>
        </div>
      </div>

      <div style={{ padding: 24, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Event Breakdown</h4>
        {analyticsSummary?.counts ? (
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(analyticsSummary.counts).map(([type, count]) => (
              <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderRadius: 8, background: darkMode ? "#0f172a" : "#fff" }}>
                <span style={{ fontWeight: 600 }}>{type}</span>
                <span style={{ color: "#64748b" }}>{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#64748b" }}>No analytics events recorded yet</div>
        )}
      </div>
    </div>
  );

  const ExperimentsTab = () => (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>A/B Testing & Experiments</h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Active Experiments */}
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Active Experiments</h4>
          {experiments.filter(e => e.status === 'running').length > 0 ? (
            experiments.filter(e => e.status === 'running').map(exp => (
              <div key={exp.id} style={{ padding: 12, marginBottom: 12, borderRadius: 8, background: darkMode ? "#374151" : "#fff", border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{exp.name}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{exp.description}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setSelectedExperiment(exp)} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>
                    View Results
                  </button>
                  <button onClick={async () => {
                    await fetch(`/api/dynamic-pricing-engine/experiments/${exp.id}/pause`, { method: 'POST' });
                    loadExperiments();
                  }} style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>
                    Pause
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#64748b", fontSize: 14 }}>No active experiments</div>
          )}
        </div>

        {/* Create New Experiment */}
        <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create Experiment</h4>
          <input 
            value={newExperiment.name} 
            onChange={e => setNewExperiment({ ...newExperiment, name: e.target.value })} 
            placeholder="Experiment name" 
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 12, fontSize: 14 }} 
          />
          <textarea 
            value={newExperiment.description} 
            onChange={e => setNewExperiment({ ...newExperiment, description: e.target.value })} 
            placeholder="Description" 
            rows={2}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 12, fontSize: 14 }} 
          />
          <select 
            value={newExperiment.allocationStrategy} 
            onChange={e => setNewExperiment({ ...newExperiment, allocationStrategy: e.target.value })} 
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 12, fontSize: 14 }}>
            <option value="random">Random Allocation</option>
            <option value="round-robin">Round Robin</option>
            <option value="bandit">Multi-Armed Bandit (Thompson Sampling)</option>
          </select>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Variants:</div>
            {newExperiment.variants.map((variant, index) => (
              <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input 
                  value={variant.name} 
                  onChange={e => {
                    const updated = [...newExperiment.variants];
                    updated[index].name = e.target.value;
                    setNewExperiment({ ...newExperiment, variants: updated });
                  }}
                  placeholder="Variant name" 
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13 }} 
                />
                <input 
                  type="number"
                  value={variant.weight} 
                  onChange={e => {
                    const updated = [...newExperiment.variants];
                    updated[index].weight = Number(e.target.value);
                    setNewExperiment({ ...newExperiment, variants: updated });
                  }}
                  placeholder="Weight" 
                  style={{ width: 80, padding: 8, borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13 }} 
                />
              </div>
            ))}
            <button 
              onClick={() => setNewExperiment({ 
                ...newExperiment, 
                variants: [...newExperiment.variants, { id: `v${newExperiment.variants.length}`, name: `Variant ${newExperiment.variants.length}`, weight: 1 }] 
              })}
              style={{ background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>
              + Add Variant
            </button>
          </div>
          <button onClick={async () => {
            const res = await fetch('/api/dynamic-pricing-engine/experiments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newExperiment)
            });
            const data = await res.json();
            if (data.ok) {
              setNotification('Experiment created successfully');
              loadExperiments();
              setNewExperiment({ name: "", description: "", allocationStrategy: "random", variants: [{ id: "control", name: "Control", weight: 1 }], scope: "global" });
              setTimeout(() => setNotification(""), 3000);
            }
          }} style={{ width: "100%", background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Create Experiment
          </button>
        </div>
      </div>

      {/* Experiment Results */}
      {selectedExperiment && (
        <div style={{ padding: 24, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedExperiment.name} - Results</h4>
            <button onClick={() => setSelectedExperiment(null)} style={{ background: "#64748b", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>
              Close
            </button>
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
            Status: <span style={{ fontWeight: 600, color: selectedExperiment.status === 'running' ? '#22c55e' : '#f59e0b' }}>{selectedExperiment.status}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {selectedExperiment.variants && selectedExperiment.variants.map(variant => (
              <div key={variant.id} style={{ padding: 16, borderRadius: 8, background: darkMode ? "#374151" : "#fff", border: "1px solid #e5e7eb" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{variant.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Assignments:  0</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Conversions: 0</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Conv. Rate: 0%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Experiments List */}
      <div style={{ padding: 20, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>All Experiments</h4>
        {experiments.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Strategy</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Variants</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 8px" }}>{exp.name}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: 4, 
                        fontSize: 12, 
                        fontWeight: 600,
                        background: exp.status === 'running' ? '#dcfce7' : exp.status === 'draft' ? '#f3f4f6' : '#fef3c7',
                        color: exp.status === 'running' ? '#166534' : exp.status === 'draft' ? '#374151' : '#92400e'
                      }}>
                        {exp.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px" }}>{exp.allocationStrategy}</td>
                    <td style={{ padding: "12px 8px" }}>{exp.variants?.length || 0}</td>
                    <td style={{ padding: "12px 8px" }}>
                      {exp.status === 'draft' && (
                        <button onClick={async () => {
                          await fetch(`/api/dynamic-pricing-engine/experiments/${exp.id}/start`, { method: 'POST' });
                          loadExperiments();
                        }} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", marginRight: 6 }}>
                          Start
                        </button>
                      )}
                      <button onClick={() => setSelectedExperiment(exp)} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: "#64748b" }}>No experiments yet. Create one to get started!</div>
        )}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div>
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Settings</h3>
      <div style={{ padding: 24, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Dark Mode</h4>
        <button onClick={() => setDarkMode(d => !d)} style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>
          {darkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      <div style={{ padding: 24, borderRadius: 12, background: darkMode ? "#1f2937" : "#f8fafc", border: "1px solid #e5e7eb" }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Feedback</h4>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={4}
          placeholder="Share your feedback or suggestions..."
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 12, fontSize: 14 }}
        />
        <button onClick={handleFeedback} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>
          Send Feedback
        </button>
      </div>
    </div>
  );

  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Dynamic Pricing Engine</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Create and manage pricing rules with different scopes and priorities</li>
        <li>Simulate pricing with guardrails, rounding strategies, and cost margins</li>
        <li>Ingest and monitor demand, inventory, and competitor signals</li>
        <li>Track analytics and pricing events in real-time</li>
        <li>Enterprise-grade compliance, RBAC, and audit logging</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  return (
    <div style={{
      maxWidth: 1400,
      margin: "40px auto",
      background: darkMode ? "#18181b" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#a3e635" : "#23263a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, marginBottom: 8 }}>Dynamic Pricing Engine</h2>
        <div style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
          <span role="img" aria-label="money">💸</span> Enterprise pricing optimization with AI, guardrails, and real-time signals
        </div>
      </div>

      {showOnboarding && onboardingContent}

      {notification && (
        <div style={{ padding: 12, borderRadius: 8, background: "#dbeafe", color: "#1e40af", marginBottom: 16, fontWeight: 600 }}>
          {notification}
        </div>
      )}

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "#991b1b", marginBottom: 16, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, borderBottom: "2px solid #e5e7eb", marginBottom: 24, overflowX: "auto" }}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(index)}
            style={{
              padding: "12px 24px",
              background: activeTab === index ? (darkMode ? "#3b82f6" : "#3b82f6") : "transparent",
              color: activeTab === index ? "#fff" : (darkMode ? "#a3e635" : "#64748b"),
              border: "none",
              borderRadius: "8px 8px 0 0",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 0 && <OverviewTab />}
      {activeTab === 1 && <RulesTab />}
      {activeTab === 2 && <SimulatorTab />}
      {activeTab === 3 && <ExperimentsTab />}
      {activeTab === 4 && <SignalsTab />}
      {activeTab === 5 && <AnalyticsTab />}
      {activeTab === 6 && <SettingsTab />}
    </div>
  );
}
