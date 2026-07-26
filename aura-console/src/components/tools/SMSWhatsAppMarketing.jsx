import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#25d366";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabs: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #27272a", paddingBottom: 0 },
  tab: (a) => ({ padding: "10px 18px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 600 : 400, fontSize: 14, borderBottom: a ? `2px solid ${accent}` : "2px solid transparent", marginBottom: -1 }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  phonePreview: { background: "#0d0d10", border: "1px solid #27272a", borderRadius: 20, padding: 20, maxWidth: 300, margin: "0 auto" },
  waBubble: { background: "#005c4b", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", marginBottom: 8, fontSize: 13 },
  smsBubble: { background: "#27272a", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", marginBottom: 8, fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const TABS = ["Campaigns","Message Builder","Flows","Compliance","Analytics","Opt-In Manager","Settings"];

export default function SMSWhatsAppMarketing() {
  const [tab, setTab] = useState(0);
  const [channel, setChannel] = useState("whatsapp");
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  const generate = async () => {
    setSending(true);
    try {
      const r = await apiFetchJSON("/api/sms-whatsapp-marketing/generate", { method: "POST", body: JSON.stringify({ channel, context: "promotional" }) });
      setMsgText(r.message || "Hey {{first_name}}! Your order is almost here. Track it: {{tracking_link}} — Reply STOP to opt out.");
    } catch (_) {
      setMsgText("Hey {{first_name}}! Your order is almost here. Track it: {{tracking_link}} — Reply STOP to opt out.");
    }
    setSending(false);
  };

  const charCount = msgText.length;
  const smsSegments = Math.ceil(charCount / 160) || 0;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>SMS & WhatsApp Marketing</h1>
        <p style={S.subtitle}>Conversational commerce — reach customers where they actually read</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Subscribers","28,400"],["Avg Open Rate","94%"],["Click Rate","18%"],["Revenue from SMS","$84,200"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Campaigns</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Campaign</th><th style={S.th}>Channel</th><th style={S.th}>Sent</th><th style={S.th}>Open Rate</th><th style={S.th}>Revenue</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[
                {name:"Flash Sale — 20% Off",ch:"SMS",sent:"14,200",open:"91%",rev:"$12,400"},
                {name:"Abandoned Cart Recovery",ch:"WhatsApp",sent:"3,840",open:"96%",rev:"$8,200"},
                {name:"New Arrivals — Summer",ch:"WhatsApp",sent:"22,100",open:"94%",rev:"$18,600"},
                {name:"Win-Back 60-Day",ch:"SMS",sent:"5,200",open:"88%",rev:"$4,800"},
              ].map(c=>(
                <tr key={c.name}>
                  <td style={S.td}>{c.name}</td>
                  <td style={S.td}><span style={S.badge(c.ch==="WhatsApp"?accent:"#06b6d4")}>{c.ch}</span></td>
                  <td style={S.td}>{c.sent}</td>
                  <td style={S.td}>{c.open}</td>
                  <td style={S.td}>{c.rev}</td>
                  <td style={S.td}><button style={S.btnSm}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button style={{...S.btn(), marginTop:16}}>+ New Campaign</button>
        </div>
      )}

      {tab===1 && (
        <div>
          <div style={S.card}>
            <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Message Builder</div>
            <div style={S.grid2}>
              <div>
                <div style={S.row}>
                  <button style={{...S.btnSm, background:channel==="whatsapp"?accent:"#27272a"}} onClick={()=>setChannel("whatsapp")}>WhatsApp</button>
                  <button style={{...S.btnSm, background:channel==="sms"?"#06b6d4":"#27272a"}} onClick={()=>setChannel("sms")}>SMS</button>
                </div>
                <div style={{marginTop:16}}>
                  <label style={S.label}>Message</label>
                  <textarea style={S.textarea} value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Type your message or generate with AI..."/>
                  <div style={{...S.row, justifyContent:"space-between", marginTop:4}}>
                    <span style={{fontSize:12, color:"#71717a"}}>{charCount} chars {channel==="sms" ? ("| " + smsSegments + " SMS segment" + (smsSegments!==1?"s":"")) : ""}</span>
                    <span style={{fontSize:12, color: charCount>160&&channel==="sms"?"#f59e0b":"#71717a"}}>Max: {channel==="sms"?"160 chars/segment":"4096 chars"}</span>
                  </div>
                </div>
                <div style={{...S.row, marginTop:12}}>
                  <button style={S.btn()} onClick={generate} disabled={sending}>{sending?"Generating...":"AI Generate (2 credits)"}</button>
                  <button style={S.btnGhost}>Insert Variable</button>
                </div>
              </div>
              <div>
                <label style={S.label}>Preview</label>
                <div style={S.phonePreview}>
                  <div style={{fontSize:11, color:"#71717a", marginBottom:12, textAlign:"center"}}>{channel==="whatsapp"?"WhatsApp":"SMS"} Preview</div>
                  <div style={channel==="whatsapp"?S.waBubble:S.smsBubble}>
                    {msgText || "Your message will appear here..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Automated Flows</div>
          <div style={S.grid2}>
            {[
              {name:"Welcome Series", trigger:"Subscriber joins", msgs:3, status:"active"},
              {name:"Abandoned Cart", trigger:"Cart abandoned 1h", msgs:2, status:"active"},
              {name:"Post-Purchase", trigger:"Order delivered", msgs:2, status:"active"},
              {name:"Win-Back 90d", trigger:"90 days inactive", msgs:3, status:"paused"},
              {name:"Birthday Message", trigger:"Customer birthday", msgs:1, status:"active"},
            ].map(f=>(
              <div key={f.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:16}}>
                <div style={S.row}>
                  <span style={{fontWeight:700}}>{f.name}</span>
                  <span style={S.badge(f.status==="active"?"#22c55e":"#f59e0b")}>{f.status}</span>
                </div>
                <div style={{fontSize:13, color:"#a1a1aa", marginTop:6}}>{f.trigger} | {f.msgs} messages</div>
                <div style={{...S.row, marginTop:10}}><button style={S.btnSm}>Edit</button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Compliance & Opt-Out Management</div>
          <div style={S.grid3}>
            {[["TCPA Compliant","Yes"],["GDPR Consent","Stored"],["Quiet Hours","9pm–8am"]].map(([l,v])=>(
              <div key={l} style={S.metricCard}><div style={{...S.metricNum, color:"#22c55e"}}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Compliance Settings</div>
          <div style={S.grid2}>
            <div><label style={S.label}>Opt-Out Keyword</label><input style={S.input} defaultValue="STOP"/></div>
            <div><label style={S.label}>Opt-Out Response</label><input style={S.input} defaultValue="You have been unsubscribed. Reply START to re-subscribe."/></div>
            <div><label style={S.label}>Quiet Hours Start</label><input style={S.input} type="time" defaultValue="21:00"/></div>
            <div><label style={S.label}>Quiet Hours End</label><input style={S.input} type="time" defaultValue="08:00"/></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Save Compliance Settings</button>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Analytics</div>
          <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr"}}>
            {[["Delivered","97.8%"],["Opens","94.2%"],["Clicks","18.4%"],["Conversions","6.8%"],["Opt-Outs","0.3%"],["Revenue/Msg","$0.28"]].map(([l,v])=>(
              <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Opt-In Manager</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Manage consent, import subscribers, and generate compliant opt-in widgets.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Opt-In Source</label><select style={S.select}><option>Shopify Checkout</option><option>Pop-Up Form</option><option>Landing Page</option><option>QR Code</option><option>Keyword SMS</option></select></div>
            <div><label style={S.label}>Double Opt-In</label><select style={S.select}><option>Enabled (Recommended)</option><option>Disabled</option></select></div>
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Opt-In Widget Code</div>
          <div style={{background:"#0d0d10", borderRadius:8, padding:16, fontFamily:"monospace", fontSize:12, color:"#22c55e", overflowX:"auto"}}>
            {"<!-- AURA SMS Opt-In Widget -->"}<br/>
            {'<div id="aura-sms-optin" data-keyword="JOIN" data-shortcode="55555"></div>'}<br/>
            {'<script src="https://cdn.aura.app/sms-widget.js"></script>'}
          </div>
          <button style={{...S.btnSm, marginTop:12}}>Copy Code</button>
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Settings</div>
          <div style={S.grid2}>
            <div><label style={S.label}>SMS Provider</label><select style={S.select}><option>Twilio</option><option>Vonage</option><option>Plivo</option><option>MessageBird</option></select></div>
            <div><label style={S.label}>WhatsApp Business Account</label><input style={S.input} placeholder="Connect via Meta Business Manager"/></div>
            <div><label style={S.label}>Sender Name / Number</label><input style={S.input} placeholder="+1 (555) 000-0000 or Brand Name"/></div>
            <div><label style={S.label}>Timezone</label><select style={S.select}><option>Store Timezone (Auto)</option><option>Customer Timezone (Recommended)</option><option>UTC</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:16}}>Save Settings</button>
        </div>
      )}
    </div>
  );
}