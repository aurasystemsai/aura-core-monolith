import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/inbox-assistant";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "reply",     label: "Reply Generator" },
  { id: "tickets",   label: "Ticket Tracker" },
  { id: "templates", label: "Templates" },
  { id: "history",   label: "Reply History" },
  { id: "tips",      label: "Writing Tips" },
];

const TONES     = ["Professional", "Friendly", "Empathetic", "Firm", "Apologetic", "Concise"];
const CHANNELS  = ["Email", "Live Chat", "SMS", "Social DM", "App Message"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES  = ["Open", "In Progress", "Waiting on Customer", "Resolved", "Closed"];

const EXAMPLE_MESSAGES = [
  { label: "Shipping complaint",    msg: "Hi, I ordered 2 weeks ago and my package still hasn't arrived. This is completely unacceptable — where is my order?!" },
  { label: "Refund request",        msg: "I received my order but the product doesn't match the website description at all. I want a full refund immediately." },
  { label: "Positive review offer", msg: "Just received my order and I absolutely love it! Is there anything I can do to support your brand?" },
  { label: "Discount request",      msg: "I really want to buy your product but £89 is a bit steep for me. Do you offer any student discounts or first-order codes?" },
  { label: "Wrong item sent",       msg: "You sent me the completely wrong item. I ordered a size M blue jacket and received a size XL red hoodie. This is unacceptable." },
];

export default function InboxAssistant() {
  const [tab, setTab] = useState("reply");

  // Reply Generator
  const [message, setMessage] = useState("");
  const [tone, setTone]       = useState("Professional");
  const [channel, setChannel] = useState("Email");
  const [context, setContext] = useState("");
  const [orderNum, setOrderNum] = useState("");
  const [reply, setReply]     = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Tickets
  const [tickets, setTickets]       = useState([]);
  const [tLoading, setTLoading]     = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatus, setTicketStatus] = useState("All");
  const [newTicket, setNewTicket] = useState({ customer: "", subject: "", channel: "Email", priority: "Medium", status: "Open", note: "" });
  const setTkt = (k, v) => setNewTicket(p => ({ ...p, [k]: v }));

  // Templates
  const [templates, setTemplates]     = useState([]);
  const [tplLoading, setTplLoading]   = useState(false);
  const [tplSearch, setTplSearch]     = useState("");
  const [newTpl, setNewTpl] = useState({ name: "", category: "General", body: "" });
  const setTp = (k, v) => setNewTpl(p => ({ ...p, [k]: v }));

  const [error, setError] = useState("");

  const fetchTickets = useCallback(async () => {
    setTLoading(true);
    try { const r = await apiFetchJSON(`${API}/tickets`); if (r.ok) setTickets(r.tickets || []); } catch {}
    setTLoading(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTplLoading(true);
    try { const r = await apiFetchJSON(`${API}/templates`); if (r.ok) setTemplates(r.templates || []); } catch {}
    setTplLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); fetchTemplates(); }, [fetchTickets, fetchTemplates]);

  const generate = async () => {
    if (!message.trim()) return;
    setReplyLoading(true); setError(""); setReply("");
    const prompt = `Generate a ${tone.toLowerCase()} customer support reply for a Shopify store.\n\nChannel: ${channel}${orderNum ? `\nOrder number: ${orderNum}` : ""}${context ? `\nStore context: ${context}` : ""}\n\nCustomer message:\n"${message}"\n\nWrite only the reply, no preamble.`;
    try {
      const r = await apiFetchJSON(`${API}/ai/reply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, channels: [channel.toLowerCase()] }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setReply(r.reply || "");
      setAnalytics(r.analytics || null);
      setHistory(p => [{ message, tone, channel, reply: r.reply, ts: new Date().toISOString() }, ...p].slice(0, 20));
    } catch (e) { setError(e.message); }
    setReplyLoading(false);
  };

  const createTicket = async () => {
    if (!newTicket.customer.trim() || !newTicket.subject.trim()) { setError("Customer and subject required"); return; }
    setError("");
    try {
      const r = await apiFetchJSON(`${API}/tickets`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTicket, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      });
      if (r.ok) { fetchTickets(); setNewTicket({ customer: "", subject: "", channel: "Email", priority: "Medium", status: "Open", note: "" }); }
    } catch (e) { setError(e.message); }
  };

  const updateTicketStatus = async (id, status) => {
    try { await apiFetchJSON(`${API}/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, updatedAt: new Date().toISOString() }) }); } catch {}
    setTickets(p => p.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTicket = async (id) => {
    try { await apiFetchJSON(`${API}/tickets/${id}`, { method: "DELETE" }); } catch {}
    setTickets(p => p.filter(t => t.id !== id));
  };

  const saveTemplate = async () => {
    if (!newTpl.name.trim() || !newTpl.body.trim()) { setError("Name and body required"); return; }
    setError("");
    try {
      await apiFetchJSON(`${API}/templates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTpl, createdAt: new Date().toISOString() }),
      });
      fetchTemplates();
      setNewTpl({ name: "", category: "General", body: "" });
    } catch (e) { setError(e.message); }
  };

  const deleteTemplate = async (id) => {
    try { await apiFetchJSON(`${API}/templates/${id}`, { method: "DELETE" }); } catch {}
    setTemplates(p => p.filter(t => t.id !== id));
  };

  const priColor = (p) => p === "Urgent" ? "#f87171" : p === "High" ? "#fb923c" : p === "Medium" ? "#fbbf24" : "#a1a1aa";
  const priBg    = (p) => p === "Urgent" ? "#3f1315" : p === "High" ? "#431407" : p === "Medium" ? "#3d2a0a" : "#27272a";

  const filteredTickets = tickets.filter(t =>
    (ticketStatus === "All" || t.status === ticketStatus) &&
    (!ticketSearch.trim() || [t.customer, t.subject].join(" ").toLowerCase().includes(ticketSearch.toLowerCase()))
  );

  const filteredTemplates = templates.filter(t => !tplSearch.trim() || [t.name, t.category, t.body].join(" ").toLowerCase().includes(tplSearch.toLowerCase()));

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Inbox Assistant</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered customer support — generate professional replies, track open tickets, manage response templates, and maintain consistency across every support channel.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Open Tickets",    val: tickets.filter(t => t.status === "Open").length,       color: "#f87171" },
          { label: "In Progress",     val: tickets.filter(t => t.status === "In Progress").length, color: "#fbbf24" },
          { label: "Saved Templates", val: templates.length,                                       color: "#4f46e5" },
          { label: "Replies Today",   val: history.filter(h => new Date(h.ts).toDateString() === new Date().toDateString()).length, color: "#4ade80" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── REPLY GENERATOR ── */}
      {tab === "reply" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>CHANNEL</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {CHANNELS.map(ch => <button key={ch} style={{ ...S.btn(ch === channel ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setChannel(ch)}>{ch}</button>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>TONE</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TONES.map(t => <button key={t} style={{ ...S.btn(t === tone ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setTone(t)}>{t}</button>)}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <input style={{ ...S.input, minWidth: 0 }} value={context} onChange={e => setContext(e.target.value)} placeholder="Brand context (e.g. 'Premium skincare, 30-day returns')" />
              <input style={{ ...S.input, minWidth: 0 }} value={orderNum} onChange={e => setOrderNum(e.target.value)} placeholder="Order # (optional)" />
            </div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Paste the customer's message here…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generate} disabled={replyLoading || !message.trim()}>{replyLoading ? "Generating…" : "Generate Reply"}</button>
              {reply && <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setMessage(""); setReply(""); }}>Clear</button>}
            </div>
          </div>
          {replyLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {reply && !replyLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Generated Reply — {tone} · {channel}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(reply)}>Copy</button>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={() => { setNewTpl(p => ({ ...p, body: reply, name: `${tone} ${channel} reply` })); setTab("templates"); }}>Save as Template</button>
                </div>
              </div>
              <pre style={S.pre}>{reply}</pre>
            </div>
          )}
          {!reply && !replyLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Example Messages</div>
              {EXAMPLE_MESSAGES.map(({ label, msg }) => (
                <div key={label} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setMessage(msg)}>Load</button>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: "#818cf8" }}>{label}</div><div style={{ fontSize: 12, color: "#71717a" }}>{msg.slice(0, 80)}…</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TICKET TRACKER ── */}
      {tab === "tickets" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Open New Ticket</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Customer Name/Email *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newTicket.customer} onChange={e => setTkt("customer", e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Channel</label>
                <select style={{ ...S.select, width: "100%" }} value={newTicket.channel} onChange={e => setTkt("channel", e.target.value)}>{CHANNELS.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Priority</label>
                <select style={{ ...S.select, width: "100%" }} value={newTicket.priority} onChange={e => setTkt("priority", e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Initial Status</label>
                <select style={{ ...S.select, width: "100%" }} value={newTicket.status} onChange={e => setTkt("status", e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Subject *</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newTicket.subject} onChange={e => setTkt("subject", e.target.value)} placeholder="e.g. Order #1234 not received after 14 days" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Internal Note (optional)</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newTicket.note} onChange={e => setTkt("note", e.target.value)} placeholder="e.g. Already contacted shipping, awaiting update" />
            </div>
            <button style={S.btn("primary")} onClick={createTicket}>Open Ticket</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <input style={{ ...S.input, flex: 2, minWidth: 200 }} value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} placeholder="Search tickets…" />
            <select style={S.select} value={ticketStatus} onChange={e => setTicketStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {tLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : filteredTickets.length === 0 ? <EmptyState icon="🎫" title="No tickets found" description="Open your first ticket above or adjust your filters." />
            : filteredTickets.map((t, i) => (
              <div key={t.id || i} style={{ ...S.card, borderLeft: `3px solid ${priColor(t.priority)}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{t.customer}</div>
                      <span style={{ background: priBg(t.priority), color: priColor(t.priority), padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{t.priority}</span>
                      <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{t.channel}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", marginBottom: 4 }}>{t.subject}</div>
                    {t.note && <div style={{ fontSize: 12, color: "#71717a" }}>Note: {t.note}</div>}
                    <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>Opened: {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <select style={{ ...S.select, fontSize: 11, padding: "4px 8px" }} value={t.status} onChange={e => updateTicketStatus(t.id, e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => { setMessage(`Customer: ${t.customer}\nSubject: ${t.subject}`); setTab("reply"); }}>Reply</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteTicket(t.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === "templates" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Save New Template</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Template Name *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newTpl.name} onChange={e => setTp("name", e.target.value)} placeholder="e.g. Order Delay Apology" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Category</label>
                <select style={{ ...S.select, width: "100%" }} value={newTpl.category} onChange={e => setTp("category", e.target.value)}>
                  {["General","Shipping","Returns","Complaints","Upsell","Review Request","Discount"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <textarea style={{ ...S.ta, minHeight: 90, marginBottom: 10 }} value={newTpl.body} onChange={e => setTp("body", e.target.value)} placeholder="Response template body… Use [Name], [OrderNumber], [ProductName] as dynamic placeholders." />
            <button style={S.btn("primary")} onClick={saveTemplate}>Save Template</button>
          </div>

          <input style={{ ...S.input, width: "100%", boxSizing: "border-box", marginBottom: 12 }} value={tplSearch} onChange={e => setTplSearch(e.target.value)} placeholder="Search templates…" />

          {tplLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : filteredTemplates.length === 0 ? <EmptyState icon="📝" title="No templates yet" description="Save reply templates above to build your library." />
            : filteredTemplates.map((tpl, i) => (
              <div key={tpl.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#e4e4e7" }}>{tpl.name}</div>
                      {tpl.category && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{tpl.category}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{tpl.body?.slice(0, 150)}{(tpl.body?.length || 0) > 150 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10 }}>
                    <button style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 8px" }} onClick={() => { setReply(tpl.body); setTab("reply"); }}>Use</button>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => navigator.clipboard?.writeText(tpl.body || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteTemplate(tpl.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{history.length} replies this session</div>
            {history.length > 0 && <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setHistory([])}>Clear</button>}
          </div>
          {history.length === 0 ? <EmptyState icon="📬" title="No reply history yet" description="Generate replies to build a history here." />
            : history.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#1e1b4b", color: "#818cf8", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{h.tone}</span>
                  <span style={{ background: "#27272a", color: "#a1a1aa", borderRadius: 5, padding: "2px 8px", fontSize: 11 }}>{h.channel}</span>
                  <span style={{ fontSize: 11, color: "#52525b", marginLeft: "auto" }}>{new Date(h.ts).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Customer: {h.message?.slice(0, 100)}{(h.message?.length || 0) > 100 ? "…" : ""}</div>
                <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{h.reply?.slice(0, 200)}{(h.reply?.length || 0) > 200 ? "…" : ""}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(h.reply || "")}>Copy</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setMessage(h.message); setTone(h.tone); setChannel(h.channel); setTab("reply"); }}>Re-use</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── TIPS ── */}
      {tab === "tips" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Writing Great Customer Replies</div>
            {[
              { t: "Start with the customer's name",    d: "'Hi Sarah' beats 'Dear Customer' every time. Personalisation increases CSAT by up to 15%." },
              { t: "Acknowledge before solving",        d: "Before jumping to solutions: 'I completely understand how frustrating this must be' builds immediate rapport." },
              { t: "Use active language",               d: "Replace 'This will be investigated' with 'I'll investigate this now and get back to you within 2 hours.'" },
              { t: "Avoid negative phrases",            d: "Remove 'unfortunately', 'I can't', 'not possible'. Every sentence should move toward a solution." },
              { t: "Set specific expectations",         d: "Don't say 'soon'. Say 'by Thursday 5pm'. Vague timelines erode trust." },
              { t: "End with an open door",             d: "Close with 'Please don't hesitate to reach out — I'm here to help.' Reduces follow-up anxiety." },
              { t: "Match the channel tone",            d: "Email can be longer. Chat and SMS should be shorter and warmer. Social DMs should match platform voice." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5" }}>💬</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Tone by Situation</div>
            {[
              { situation: "Order not received (< 14 days)",  tone: "Empathetic + Proactive",   note: "Acknowledge anxiety, check status, provide tracking, set update timeline" },
              { situation: "Refund request (valid reason)",    tone: "Apologetic + Efficient",   note: "Approve quickly, no barriers, confirm timeline clearly" },
              { situation: "Refund outside policy",           tone: "Firm but empathetic",       note: "Acknowledge, explain policy clearly, offer store credit alternative" },
              { situation: "Positive feedback",               tone: "Warm + Enthusiastic",       note: "Thank genuinely, ask for review, offer loyalty reward" },
              { situation: "Aggressive/angry customer",       tone: "Professional + Calm",       note: "Never match aggression. Acknowledge, de-escalate, solve." },
              { situation: "Discount request",                tone: "Friendly + Value-focused",  note: "Redirect to value, offer loyalty programme, avoid arbitrary discounts" },
            ].map(r => (
              <div key={r.situation} style={{ ...S.row, flexDirection: "column" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{r.situation}</div>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>Tone: {r.tone}</div>
                <div style={{ fontSize: 12, color: "#71717a" }}>{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
