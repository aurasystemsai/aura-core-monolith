import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#a855f7";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? "2px solid " + accent : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  qaCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Voice Overview","Question Mining","Featured Snippets","FAQ Schema","Local Voice","Conversational KW","AI Answer Gen"];

const QUESTIONS = [
  { query: "where can I buy sustainable hoodies online", intent: "shopping", volume: 2400, snippet: false },
  { query: "what is the best online clothing store", intent: "informational", volume: 8400, snippet: true },
  { query: "how do I return an item I bought online", intent: "support", volume: 3200, snippet: false },
  { query: "are there eco-friendly fashion brands", intent: "informational", volume: 1800, snippet: false },
];

export default function VoiceSearchOptimization() {
  const [tab, setTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const generateAnswer = async () => {
    if (!question.trim()) return;
    setGenerating(true);
    try {
      const r = await apiFetchJSON("/api/voice-search-optimization/generate-answer", { method: "POST", body: JSON.stringify({ question }) });
      setAnswer(r.answer || "We offer sustainable, eco-friendly clothing with free shipping on orders over $50. Our return policy is 30 days, no questions asked.");
    } catch (_) {
      setAnswer("We offer sustainable, eco-friendly clothing with free shipping on orders over $50. Our return policy is 30 days, no questions asked.");
    }
    setGenerating(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Voice Search Optimisation</h1>
        <p style={S.subtitle}>Optimise for Alexa, Siri, Google Assistant, and AI answer engines</p>
      </div>

      <div style={{ ...S.grid3, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: 24 }}>
        {[["Voice Queries/mo", "12,400"], ["Featured Snippets", "8"], ["FAQ Schema Pages", "24"], ["Voice Conv. Rate", "3.2%"]].map(([l, v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t, i) => <button key={t} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Voice Search Performance</div>
          <div style={S.grid2}>
            {[
              { platform: "Google Assistant", share: "42%", queries: 5208, color: "#4285f4" },
              { platform: "Apple Siri", share: "28%", queries: 3472, color: "#a1a1aa" },
              { platform: "Amazon Alexa", share: "18%", queries: 2232, color: "#f97316" },
              { platform: "Microsoft Cortana", share: "12%", queries: 1488, color: "#0ea5e9" },
            ].map(p => (
              <div key={p.platform} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16 }}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{p.platform}</span>
                  <span style={S.badge(p.color)}>{p.share}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#71717a" }}>{p.queries.toLocaleString()} queries</span>
                </div>
              </div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ color: "#a1a1aa", fontSize: 13 }}>Voice search queries are 3x longer than typed queries and are predominantly question-based (who, what, where, when, how). Optimise for conversational intent.</div>
        </div>
      )}

      {tab === 1 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Question Mining — Voice Query Database</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Voice Query</th><th style={S.th}>Intent</th><th style={S.th}>Volume</th><th style={S.th}>Has Snippet</th><th style={S.th}></th></tr></thead>
            <tbody>
              {QUESTIONS.map(q => (
                <tr key={q.query}>
                  <td style={S.td}><em>"{q.query}"</em></td>
                  <td style={S.td}><span style={S.badge(q.intent === "shopping" ? accent : q.intent === "support" ? "#f59e0b" : "#06b6d4")}>{q.intent}</span></td>
                  <td style={S.td}>{q.volume.toLocaleString()}</td>
                  <td style={S.td}><span style={S.badge(q.snippet ? "#22c55e" : "#ef4444")}>{q.snippet ? "Yes" : "No"}</span></td>
                  <td style={S.td}><button style={S.btnSm}>Optimise</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{ ...S.btn(), marginTop: 16 }}>Mine More Questions (2 credits)</button>
        </div>
      )}

      {tab === 2 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Featured Snippet Opportunities</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Voice assistants read featured snippets aloud. Winning these means being the voice answer.</p>
          {[
            { query: "how long does shipping take", currentRank: 4, snippetHolder: "Competitor A", type: "Paragraph" },
            { query: "what materials are your hoodies made of", currentRank: 2, snippetHolder: "None", type: "Paragraph" },
            { query: "do you offer free returns", currentRank: 7, snippetHolder: "None", type: "List" },
          ].map((s, i) => (
            <div key={i} style={S.qaCard}>
              <div style={S.row}>
                <span style={{ fontWeight: 700, flex: 1 }}><em>"{s.query}"</em></span>
                <span style={S.badge("#3f3f46")}>{s.type}</span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>Rank #{s.currentRank}</span>
                <span style={S.badge(s.snippetHolder === "None" ? "#22c55e" : "#ef4444")}>{s.snippetHolder === "None" ? "Available!" : s.snippetHolder}</span>
              </div>
              <button style={{ ...S.btnSm, marginTop: 10 }}>Write Optimised Answer</button>
            </div>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>FAQ Schema Generator</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Generate structured FAQ schema markup for voice-optimised pages.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Page URL</label><input style={S.input} placeholder="https://yourstore.com/faq" /></div>
            <div><label style={S.label}>Niche / Category</label><input style={S.input} placeholder="Sustainable fashion" /></div>
          </div>
          <button style={{ ...S.btn(), marginTop: 12 }}>Generate FAQ Schema (2 credits)</button>
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Sample Schema Output</div>
          <div style={{ background: "#0d0d10", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#22c55e", overflowX: "auto" }}>
            {'{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Do you offer free returns?","acceptedAnswer":{"@type":"Answer","text":"Yes, we offer free 30-day returns on all orders."}}]}'}
          </div>
          <button style={{ ...S.btnSm, marginTop: 10 }}>Copy Schema</button>
        </div>
      )}

      {tab === 4 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Local Voice Search</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Optimise for "near me" and local voice queries that drive foot traffic and local online sales.</p>
          <div style={S.grid2}>
            {[
              { query: "clothing stores near me", volume: 22000, localPack: true },
              { query: "sustainable fashion store nearby", volume: 4200, localPack: false },
              { query: "best hoodie shop open now", volume: 1800, localPack: false },
              { query: "online clothing store same day delivery", volume: 8400, localPack: false },
            ].map(q => (
              <div key={q.query} style={S.qaCard}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}><em>"{q.query}"</em></div>
                <div style={S.row}>
                  <span style={{ fontSize: 12, color: "#71717a" }}>{q.volume.toLocaleString()}/mo</span>
                  <span style={S.badge(q.localPack ? "#22c55e" : "#ef4444")}>{q.localPack ? "In Local Pack" : "Not in Pack"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Conversational Keyword Strategy</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Voice queries use natural language. Target long-tail, question-based phrases rather than head terms.</p>
          <div style={S.grid2}>
            {[
              { typed: "hoodies", voice: "where can I buy a hoodie that is sustainably made" },
              { typed: "free shipping", voice: "which online clothing stores offer free shipping" },
              { typed: "return policy", voice: "how do I return clothes I bought online" },
              { typed: "sale clothes", voice: "what clothing stores are having a sale right now" },
            ].map(k => (
              <div key={k.typed} style={S.qaCard}>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>TYPED VERSION</div>
                <div style={{ fontFamily: "monospace", color: "#a1a1aa", marginBottom: 8 }}>{k.typed}</div>
                <div style={{ fontSize: 11, color: accent, marginBottom: 4 }}>VOICE VERSION</div>
                <div style={{ fontFamily: "monospace", fontSize: 12 }}><em>"{k.voice}"</em></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI Voice Answer Generator</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Generate concise, voice-optimised answers (under 30 words) that voice assistants will read aloud.</p>
          <label style={S.label}>Voice Query</label>
          <input style={S.input} placeholder='e.g. "Do you offer free shipping?"' value={question} onChange={e => setQuestion(e.target.value)} />
          <button style={{ ...S.btn(), marginTop: 12 }} onClick={generateAnswer} disabled={generating}>{generating ? "Generating..." : "Generate Answer (1 credit)"}</button>
          {answer && (
            <div style={{ marginTop: 16 }}>
              <label style={S.label}>Voice-Optimised Answer</label>
              <textarea style={S.textarea} value={answer} onChange={e => setAnswer(e.target.value)} />
              <div style={{ fontSize: 12, color: answer.length > 200 ? "#ef4444" : "#22c55e", marginTop: 4 }}>{answer.length} chars (aim for under 200 for best voice results)</div>
              <div style={{ ...S.row, marginTop: 8 }}>
                <button style={S.btnSm}>Add to Page</button>
                <button style={S.btnGhost}>Generate FAQ Schema</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}