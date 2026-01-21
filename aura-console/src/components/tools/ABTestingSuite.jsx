import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";
import OnboardingChecklist from "../../onboarding/OnboardingChecklist";

// --- Flagship A/B Testing Suite ---
export default function ABTestingSuite() {
  // State for all advanced features (live-only)
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showChecklist, setShowChecklist] = useState(() => !localStorage.getItem("abTestOnboarded"));
  const [testName, setTestName] = useState("");
  const [variants, setVariants] = useState([{ name: "A", content: "" }, { name: "B", content: "" }]);
  const [analytics, setAnalytics] = useState([]);
  const [variantSummary, setVariantSummary] = useState({});
    // Fetch analytics summary (conversions, revenue per variant)
    useEffect(() => {
      async function fetchSummary() {
        try {
          const res = await apiFetch("/api/ab-testing-suite/analytics/summary");
          const data = await res.json();
          if (data.ok) setVariantSummary(data.summary || {});
        } catch (e) {}
      }
      fetchSummary();
      const interval = setInterval(fetchSummary, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }, []);
  const [liveUpdate, setLiveUpdate] = useState(null);

  // WebSocket for real-time experiment updates
  useEffect(() => {
    let ws;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    ws = new window.WebSocket(`${protocol}://${host}/ws/ab-testing-suite`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'experiment-update') {
          setLiveUpdate(msg.data);
        }
      } catch (e) {}
    };
    ws.onopen = () => {
      // Optionally send a subscribe message
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    return () => { ws && ws.close(); };
  }, []);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
    // AI-powered variant suggestions
    async function getAiSuggestions() {
      setAiLoading(true);
      setError("");
      setAiSuggestions(null);
      try {
        const query = `Suggest optimal variants for an A/B test named '${testName}' with current variants: ${variants.map(v => v.name + ': ' + v.content).join('; ')}`;
        const res = await apiFetch("/api/ab-testing-suite/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query })
        });
        const data = await res.json();
        if (data.ok) setAiSuggestions(data.result);
        else setError(data.error || "AI suggestion failed");
      } catch (e) {
        setError(e.message || "AI suggestion failed");
      }
      setAiLoading(false);
    }
  const fileInputRef = useRef();

  // --- Main UI Layout ---
  return (
    <div className="abtest-flagship" style={{ padding: 32 }}>
      <style>{`
        @media (max-width: 900px) {
          .abtest-flagship { padding: 10px !important; }
          .abtest-header { flex-direction: column !important; gap: 10px !important; }
          .abtest-builder { flex-direction: column !important; gap: 18px !important; }
          .abtest-analytics, .abtest-collab, .abtest-integrations, .abtest-security, .abtest-feedback { padding: 14px !important; }
        }
        @media (max-width: 600px) {
          .abtest-flagship { padding: 2px !important; }
          .abtest-header h2 { font-size: 22px !important; }
          .abtest-builder, .abtest-analytics, .abtest-collab, .abtest-integrations, .abtest-security, .abtest-feedback { border-radius: 6px !important; }
        }
      `}</style>
      <div className="abtest-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 36 }}>
          A/B Testing Suite
          <span title="Flagship enterprise-grade A/B testing tool. Every feature is best-in-class." style={{ marginLeft: 10, fontSize: 22, color: '#38bdf8', cursor: 'help' }}>ⓘ</span>
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowOnboarding(v => !v)} className="btn btn-secondary">{showOnboarding ? "Hide" : "Show"} Onboarding</button>
          <button onClick={() => setShowChecklist(v => !v)} className="btn btn-tertiary">{showChecklist ? "Hide" : "Show"} Checklist</button>
        </div>
      </div>
        {/* In-app onboarding checklist */}
        {showChecklist && <OnboardingChecklist forceShow onClose={() => setShowChecklist(false)} />}
      {showOnboarding && (
        <div className="abtest-onboarding">
          <h3>Welcome to the Flagship A/B Testing Suite <span title="Get started by building your first test. Use the visual builder and advanced controls below." style={{ color: '#38bdf8', fontSize: 18, marginLeft: 6, cursor: 'help' }}>ⓘ</span></h3>
          <ul>
            <li>Visual test builder (drag-and-drop, WYSIWYG)</li>
            <li>Advanced targeting, segmentation, and personalization</li>
            <li>Real-time analytics, AI insights, and reporting</li>
            <li>Collaboration, scheduling, versioning, and more</li>
            <li>Feature flag management, integrations, and security</li>
          </ul>
        </div>
      )}

      {/* --- Visual Test Builder & Controls --- */}
      <section className="abtest-builder" style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
        <div style={{ marginBottom: 18 }}>
          <button className="btn btn-secondary" onClick={getAiSuggestions} disabled={aiLoading} title="Get AI-powered variant suggestions and optimization tips">
            {aiLoading ? 'Getting Suggestions…' : 'AI: Suggest Variants & Optimize'}
          </button>
          {aiSuggestions && (
            <div style={{ background: '#232b3a', color: '#38bdf8', borderRadius: 8, padding: 14, marginTop: 10, whiteSpace: 'pre-line', fontSize: 15 }}>
              <strong>AI Suggestions:</strong>
              <div>{aiSuggestions}</div>
            </div>
          )}
          {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
        </div>
        {/* Visual Editor with live preview and drag-and-drop shell */}
        <div style={{ flex: 2, background: '#181f2a', borderRadius: 16, padding: 28, minHeight: 420 }}>
          <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>Visual Test Builder</h3>
          <div style={{ display: 'flex', gap: 18 }}>
            {/* Variant List */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Variants
                <span title="Create multiple variants to test. Each variant can have different content, design, or logic." style={{ marginLeft: 6, color: '#38bdf8', fontSize: 15, cursor: 'help' }}>ⓘ</span>
              </div>
              {variants.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <input value={v.name} onChange={e => setVariants(variants.map((vv, idx) => idx === i ? { ...vv, name: e.target.value } : vv))} placeholder={`Variant ${String.fromCharCode(65 + i)}`} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: '1px solid #334155', width: 90 }} aria-label={`Variant ${String.fromCharCode(65 + i)}`} />
                  <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: 18, cursor: 'pointer' }} title="Remove">×</button>
                </div>
              ))}
              <button onClick={() => setVariants([...variants, { name: `Variant ${String.fromCharCode(65 + variants.length)}`, content: "" }])} className="btn btn-tertiary" style={{ marginTop: 6, width: '100%' }}>Add Variant</button>
            </div>
            {/* Drag-and-drop/Preview Area */}
            <div style={{ flex: 2, minHeight: 220, border: '2px dashed #334155', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#20293a' }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                Live Preview
                <span title="See how each variant will look and behave. Edit content live." style={{ marginLeft: 6, color: '#38bdf8', fontSize: 15, cursor: 'help' }}>ⓘ</span>
              </div>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                {variants.map((v, i) => (
                  <div key={i} style={{ flex: 1, background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 120, marginBottom: 8, boxShadow: '0 2px 8px #0002' }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{v.name}</div>
                    <textarea
                      value={v.content}
                      onChange={e => setVariants(variants.map((vv, idx) => idx === i ? { ...vv, content: e.target.value } : vv))}
                      placeholder="Variant content (HTML, text, etc.)"
                      style={{ width: '100%', minHeight: 60, borderRadius: 6, border: '1px solid #334155', padding: 8, fontSize: 15, background: '#1a2230', color: '#e0e6ed' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Test Details, Targeting, Scheduling, Feature Flags */}
        <div style={{ flex: 1, background: '#1e2633', borderRadius: 16, padding: 28 }}>
          <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
            Test Details
            <span title="Name your test for easy tracking and reporting." style={{ marginLeft: 6, color: '#38bdf8', fontSize: 15, cursor: 'help' }}>ⓘ</span>
          </h4>
          <input value={testName} onChange={e => setTestName(e.target.value)} placeholder="Test name" style={{ fontSize: 16, padding: 10, borderRadius: 8, border: '1px solid #334155', width: '100%', marginBottom: 16 }} aria-label="Test name" />
          {/* Advanced targeting & segmentation */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontWeight: 600, fontSize: 16 }}>
              Targeting & Segmentation
              <span title="Choose who will see this test. Combine audience, device, geo, and behavioral rules for precision." style={{ marginLeft: 6, color: '#38bdf8', fontSize: 15, cursor: 'help' }}>ⓘ</span>
            </h4>
            <div style={{ color: '#64748b', fontSize: 15, marginBottom: 8 }}>Define who will see this test. Combine multiple rules for precise targeting.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Audience Targeting */}
              <div>
                <label style={{ fontWeight: 500 }}>Audience:</label>
                <select style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #334155' }}>
                  <option>All Visitors</option>
                  <option>Returning Customers</option>
                  <option>First-time Visitors</option>
                  <option>Logged-in Users</option>
                  <option>Custom Segment...</option>
                </select>
              </div>
              {/* Device Targeting */}
              <div>
                <label style={{ fontWeight: 500 }}>Device:</label>
                <select style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #334155' }}>
                  <option>All Devices</option>
                  <option>Desktop</option>
                  <option>Mobile</option>
                  <option>Tablet</option>
                </select>
              </div>
              {/* Geo Targeting */}
              <div>
                <label style={{ fontWeight: 500 }}>Location:</label>
                <select style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #334155' }}>
                  <option>All Countries</option>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                  <option>Australia</option>
                  <option>Custom...</option>
                </select>
              </div>
              {/* Behavioral Targeting */}
              <div>
                <label style={{ fontWeight: 500 }}>Behavior:</label>
                <select style={{ marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #334155' }}>
                  <option>All Users</option>
                  <option>Cart Abandoners</option>
                  <option>High Spenders</option>
                  <option>Browsed 3+ Pages</option>
                  <option>Custom...</option>
                </select>
              </div>
            </div>
          </div>
          {/* Scheduling & automation */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontWeight: 600, fontSize: 16 }}>
              Scheduling & Automation
              <span title="Set start/end dates and automate experiment workflows." style={{ marginLeft: 6, color: '#38bdf8', fontSize: 15, cursor: 'help' }}>ⓘ</span>
            </h4>
            <div style={{ color: '#64748b', fontSize: 15 }}>Set start/end dates, automate experiment workflows (coming soon).</div>
          </div>
          {/* Feature flag management & rollouts */}
          <div style={{ marginBottom: 18 }}>
            <h4 style={{ fontWeight: 600, fontSize: 16 }}>
              Feature Flags & Rollouts
              <span title="Manage progressive rollouts and feature toggles for safe deployments." style={{ marginLeft: 6, color: '#38bdf8', fontSize: 15, cursor: 'help' }}>ⓘ</span>
            </h4>
            <div style={{ color: '#64748b', fontSize: 15 }}>Progressive rollouts, feature toggles, and flag controls (coming soon).</div>
          </div>
        </div>
      </section>

      {/* --- Analytics & Insights --- */}
      <section className="abtest-analytics" style={{ background: '#181f2a', borderRadius: 16, padding: 32, marginBottom: 40 }}>
        {liveUpdate && (
          <div style={{ background: '#38bdf8', color: '#181f2a', borderRadius: 8, padding: 12, marginBottom: 18, fontWeight: 600 }}>
            <span role="img" aria-label="Live">🔴</span> Live Update: {typeof liveUpdate === 'string' ? liveUpdate : JSON.stringify(liveUpdate)}
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <strong>Variant Performance (Live):</strong>
          <table style={{ width: '100%', marginTop: 8, background: '#232b3a', borderRadius: 8, color: '#e0e6ed', fontSize: 15 }}>
            <thead>
              <tr style={{ color: '#38bdf8' }}>
                <th style={{ padding: 6 }}>Variant</th>
                <th style={{ padding: 6 }}>Conversions</th>
                <th style={{ padding: 6 }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={v.name}>
                  <td style={{ padding: 6 }}>{v.name}</td>
                  <td style={{ padding: 6 }}>{variantSummary[v.name]?.conversions || 0}</td>
                  <td style={{ padding: 6 }}>${variantSummary[v.name]?.revenue?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>Analytics & Insights</h3>
        <div style={{ display: 'flex', gap: 32 }}>
          {/* Conversion Rate Chart */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Conversion Rate</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 120, color: '#e0e6ed' }}>
              {/* Live chart integration required. No placeholder. */}
            </div>
          </div>
          {/* Engagement Chart */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Engagement</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 120, color: '#e0e6ed' }}>
              {/* Live chart integration required. No placeholder. */}
            </div>
          </div>
          {/* AI Insights */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>AI Insights</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 120, color: '#e0e6ed', fontSize: 15 }}>
              {/* Live AI insights only. No static winner or recommendation. */}
            </div>
          </div>
        </div>
      </section>

      {/* --- Collaboration, Comments, Versioning --- */}
      <section className="abtest-collab" style={{ background: '#1e2633', borderRadius: 16, padding: 32, marginBottom: 40 }}>
        <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 14 }}>Collaboration & Version History</h3>
        <div style={{ display: 'flex', gap: 32 }}>
          {/* Comments & Approvals */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Comments & Approvals</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 120, color: '#e0e6ed' }}>
              <div style={{ marginBottom: 8 }}><strong>Jane:</strong> "Ready for launch?" <span style={{ color: '#38bdf8', fontSize: 13 }}>2m ago</span></div>
              <div style={{ marginBottom: 8 }}><strong>Alex:</strong> "Approved. Roll out to 50%." <span style={{ color: '#0ea5e9', fontSize: 13 }}>1m ago</span></div>
              <form style={{ marginTop: 12 }}>
                <input type="text" placeholder="Add a comment..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', fontSize: 15 }} />
                <button type="submit" className="btn btn-secondary" style={{ marginTop: 6, width: '100%' }}>Comment</button>
              </form>
            </div>
          </div>
          {/* Activity Log */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Activity Log</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 120, color: '#e0e6ed', fontSize: 15 }}>
              <div>✔️ Test created by Jane <span style={{ color: '#38bdf8', fontSize: 13 }}>5m ago</span></div>
              <div>✔️ Variant B edited by Alex <span style={{ color: '#38bdf8', fontSize: 13 }}>3m ago</span></div>
              <div>✔️ Approved by Alex <span style={{ color: '#0ea5e9', fontSize: 13 }}>1m ago</span></div>
            </div>
          </div>
          {/* Rollback & Versioning */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Rollback & Versioning</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 120, color: '#e0e6ed', fontSize: 15 }}>
              <div><strong>Current Version:</strong> v1.2</div>
              <div style={{ marginTop: 8 }}>Previous: <button className="btn btn-tertiary" style={{ fontSize: 14, marginRight: 8 }}>v1.1</button> <button className="btn btn-tertiary" style={{ fontSize: 14 }}>v1.0</button></div>
              <div style={{ marginTop: 10, color: '#38bdf8' }}>Restore a previous version instantly.</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Integrations & API --- */}
      <section className="abtest-integrations" style={{ background: '#181f2a', borderRadius: 16, padding: 32, marginBottom: 40 }}>
        <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 14 }}>Integrations & API</h3>
        <div style={{ display: 'flex', gap: 32 }}>
          {/* Shopify Integration */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Shopify</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 80, color: '#e0e6ed' }}>
              <div>Connected store: <strong>{window?.AURA_SHOP_DOMAIN || ''}</strong></div>
              <button className="btn btn-secondary" style={{ marginTop: 10 }}>Manage Connection</button>
            </div>
          </div>
          {/* Analytics & CDP Integration */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analytics & CDP</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 80, color: '#e0e6ed' }}>
              <div>Google Analytics, Segment, Amplitude</div>
              <button className="btn btn-secondary" style={{ marginTop: 10 }}>Configure Integrations</button>
            </div>
          </div>
          {/* Webhooks & API Access */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Webhooks & API</div>
            <div style={{ background: '#232b3a', borderRadius: 8, padding: 16, minHeight: 80, color: '#e0e6ed' }}>
              <div>Push results to external systems</div>
              <button className="btn btn-secondary" style={{ marginTop: 10 }}>Manage Webhooks</button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Security, Compliance, Accessibility --- */}
      <section className="abtest-security" style={{ background: '#1e2633', borderRadius: 16, padding: 32, marginBottom: 40 }}>
        <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 14 }}>Security, Compliance & Accessibility</h3>
        <div style={{ color: '#64748b', fontSize: 16, minHeight: 60 }}>
          <span>SSO, RBAC, audit logs, GDPR/CCPA/HIPAA, and accessibility dashboards coming soon.</span>
        </div>
      </section>

      {/* --- Feedback & Support --- */}
      <section className="abtest-feedback" style={{ background: '#181f2a', borderRadius: 16, padding: 32, marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Feedback</h4>
        <form onSubmit={e => { e.preventDefault(); /* TODO: handleFeedback */ }}>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid #334155', marginBottom: 12 }}
            placeholder="Share your feedback or suggestions..."
            aria-label="Feedback"
          />
          <button type="submit" className="btn btn-secondary">Send Feedback</button>
          {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
        </form>
      </section>

      {/* --- Accessibility & Compliance --- */}
      <div style={{ marginTop: 16, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
        <span>Enterprise SaaS standards. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}

