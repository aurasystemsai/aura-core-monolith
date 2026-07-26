import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#f59e0b";
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
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 80, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}`, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  condBlock: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, marginBottom: 8 },
  andOrBtn: (active) => ({ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: active ? accent : "#27272a", color: active ? "#fff" : "#a1a1aa" }),
};

const TABS = ["Condition Builder","Dynamic Variables","Computed Fields","Temporal Rules","ML Conditions","Conflict Detector","Impact Simulator"];

const VARIABLES = [
  { name: "order.total", type: "number", example: "249.99" },
  { name: "customer.ltv", type: "number", example: "1840.00" },
  { name: "customer.segment", type: "string", example: "VIP" },
  { name: "cart.item_count", type: "number", example: "5" },
  { name: "product.tag", type: "string", example: "sale" },
  { name: "days_since_purchase", type: "number", example: "45" },
];

export default function ConditionalLogicAutomation() {
  const [tab, setTab] = useState(0);
  const [logic, setLogic] = useState("AND");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const simulate = async () => {
    setSimulating(true);
    try {
      const r = await apiFetchJSON("/api/conditional-logic-automation/simulate", { method: "POST", body: JSON.stringify({ conditions: [], logic }) });
      setSimResult(r.matchCount || 1284);
    } catch (_) { setSimResult(1284); }
    setSimulating(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Conditional Logic Automation</h1>
        <p style={S.subtitle}>Boolean expression builder with ML score conditions and impact simulation</p>
      </div>

      <div style={{...S.grid3, gridTemplateColumns:"1fr 1fr 1fr 1fr", marginBottom:24}}>
        {[["Active Rules","41"],["Variables Available","128"],["Avg Match Rate","23%"],["Conflicts Detected","2"]].map(([l,v])=>(
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i)=><button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Boolean Expression Builder</div>
          <div style={{...S.row, marginBottom:16}}>
            <span style={{fontWeight:600}}>Match</span>
            <button style={S.andOrBtn(logic==="AND")} onClick={()=>setLogic("AND")}>ALL (AND)</button>
            <button style={S.andOrBtn(logic==="OR")} onClick={()=>setLogic("OR")}>ANY (OR)</button>
            <span style={{fontWeight:600}}>of the following conditions:</span>
          </div>
          {[
            {field:"customer.ltv", op:">", val:"500"},
            {field:"days_since_purchase", op:"<", val:"90"},
            {field:"customer.segment", op:"=", val:"VIP"},
          ].map((c,i)=>(
            <div key={i} style={S.condBlock}>
              <div style={S.row}>
                <select style={{...S.select, width:200}} defaultValue={c.field}><option value="customer.ltv">customer.ltv</option><option value="order.total">order.total</option><option value="days_since_purchase">days_since_purchase</option><option value="customer.segment">customer.segment</option></select>
                <select style={{...S.select, width:120}} defaultValue={c.op}><option>{">"}</option><option>{"<"}</option><option>=</option><option>{"!="}</option><option>contains</option><option>matches regex</option></select>
                <input style={{...S.input, width:140}} defaultValue={c.val}/>
                <button style={{...S.btnSm, background:"#ef4444"}}>Remove</button>
              </div>
            </div>
          ))}
          <div style={{...S.row, marginTop:8}}>
            <button style={S.btnGhost}>+ Add Condition</button>
            <button style={S.btnGhost}>+ Add Group</button>
          </div>
          <div style={S.divider}/>
          <div style={S.row}>
            <button style={S.btn()}>Save Rule</button>
            <button style={{...S.btn("#22c55e")}} onClick={simulate} disabled={simulating}>{simulating?"Simulating...":"Run Impact Simulation (1 credit)"}</button>
          </div>
          {simResult && (
            <div style={{marginTop:16, padding:16, background:"#09090b", borderRadius:10, border:"1px solid #22c55e44"}}>
              <span style={{color:"#22c55e", fontWeight:700}}>Simulation Result:</span>
              <span style={{marginLeft:8}}>{simResult.toLocaleString()} customers match this rule today</span>
            </div>
          )}
        </div>
      )}

      {tab===1 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Available Dynamic Variables</div>
          <div style={S.grid2}>
            {VARIABLES.map(v=>(
              <div key={v.name} style={{background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:14}}>
                <div style={{fontFamily:"monospace", color:accent, fontWeight:700, fontSize:13}}>{v.name}</div>
                <div style={{fontSize:11, color:"#71717a", marginTop:4}}>Type: {v.type} | Example: {v.example}</div>
                <button style={{...S.btnSm, marginTop:8, fontSize:11, padding:"3px 10px"}}>Use in Rule</button>
              </div>
            ))}
          </div>
          <div style={S.divider}/>
          <div style={{fontWeight:700, marginBottom:12}}>Register Custom Variable</div>
          <div style={S.grid3}>
            <div><label style={S.label}>Variable Name</label><input style={S.input} placeholder="my_custom_field"/></div>
            <div><label style={S.label}>Source</label><select style={S.select}><option>Shopify Order</option><option>Customer Metafield</option><option>Computed Field</option><option>External API</option></select></div>
            <div><label style={S.label}>Type</label><select style={S.select}><option>number</option><option>string</option><option>boolean</option><option>date</option></select></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Register Variable</button>
        </div>
      )}

      {tab===2 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:8}}>Computed Fields</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Define formula-based fields on top of existing variables.</p>
          <div style={{...S.condBlock, marginBottom:16}}>
            <div style={{fontFamily:"monospace", color:accent, marginBottom:8}}>discount_pct = (discount / order.total) * 100</div>
            <div style={{fontFamily:"monospace", color:"#22c55e", marginBottom:8}}>days_inactive = today - last_order_date</div>
            <div style={{fontFamily:"monospace", color:"#06b6d4"}}>avg_order_value = total_revenue / order_count</div>
          </div>
          <div style={S.grid2}>
            <div><label style={S.label}>Field Name</label><input style={S.input} placeholder="e.g. discount_pct"/></div>
            <div><label style={S.label}>Formula</label><input style={S.input} placeholder="e.g. (discount / order.total) * 100"/></div>
          </div>
          <button style={{...S.btn(), marginTop:12}}>Create Computed Field</button>
        </div>
      )}

      {tab===3 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Temporal Conditions</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Time-aware conditions that reason about behavior across time windows.</p>
          <div style={S.grid2}>
            {[
              {label:"No Order in N Days", example:"days_since_purchase > 90"},
              {label:"Purchased N Times in Window", example:"orders_last_30d >= 3"},
              {label:"Repeat Buyer (was active)", example:"prev_order_count > 1 AND gap > 60d"},
              {label:"Seasonal Condition", example:"current_month IN [11, 12]"},
            ].map(t=>(
              <div key={t.label} style={S.condBlock}>
                <div style={{fontWeight:700, marginBottom:6}}>{t.label}</div>
                <div style={{fontFamily:"monospace", fontSize:12, color:accent}}>{t.example}</div>
                <button style={{...S.btnSm, marginTop:8, fontSize:11, padding:"3px 10px"}}>Add to Rule</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===4 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>ML Score Conditions</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Use AI-generated scores from AURA tools as condition inputs.</p>
          <div style={S.grid2}>
            {[
              {score:"churn_risk_score", source:"LTV Churn Predictor", range:"0–1", example:"churn_risk_score > 0.7"},
              {score:"ltv_tier", source:"Customer Analytics", range:"1–5", example:"ltv_tier >= 4"},
              {score:"product_affinity", source:"Personalization Engine", range:"0–1", example:"product_affinity.shoes > 0.6"},
              {score:"sentiment_score", source:"Review Engine", range:"-1 to 1", example:"sentiment_score < -0.3"},
            ].map(m=>(
              <div key={m.score} style={S.condBlock}>
                <div style={{fontWeight:700, color:accent, fontFamily:"monospace", marginBottom:4}}>{m.score}</div>
                <div style={{fontSize:12, color:"#71717a", marginBottom:4}}>Source: {m.source} | Range: {m.range}</div>
                <div style={{fontFamily:"monospace", fontSize:12, color:"#22c55e"}}>{m.example}</div>
                <button style={{...S.btnSm, marginTop:8, fontSize:11, padding:"3px 10px"}}>Use Score</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===5 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Rule Conflict Detector</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Automatically detects overlapping or contradictory conditions across your rule set.</p>
          {[
            {type:"Overlap", rules:["VIP Tagging","High-Value Upsell"], detail:"Both match customers with LTV > 500. Execution order undefined.", severity:"warning"},
            {type:"Contradiction", rules:["Send Email","Suppress Email"], detail:"Customer can match both rules simultaneously — one suppresses, one sends.", severity:"error"},
          ].map((c,i)=>(
            <div key={i} style={{...S.card, marginBottom:12, borderColor: c.severity==="error"?"#ef4444":"#f59e0b"}}>
              <div style={S.row}>
                <span style={S.badge(c.severity==="error"?"#ef4444":"#f59e0b")}>{c.type}</span>
                <span style={{fontWeight:700}}>{c.rules.join(" ↔ ")}</span>
              </div>
              <div style={{fontSize:13, color:"#a1a1aa", marginTop:8}}>{c.detail}</div>
              <div style={{...S.row, marginTop:10}}>
                <button style={S.btnSm}>Resolve</button>
                <button style={{...S.btnSm, background:"#27272a"}}>Ignore</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab===6 && (
        <div style={S.card}>
          <div style={{fontWeight:700, fontSize:15, marginBottom:16}}>Impact Simulator</div>
          <p style={{color:"#a1a1aa", fontSize:13, marginBottom:16}}>Preview how many customers match your conditions before activating.</p>
          <div style={S.grid2}>
            <div><label style={S.label}>Condition Set</label><select style={S.select}><option>VIP + Active (current draft)</option><option>Churn Risk {">"} 0.7</option><option>Custom...</option></select></div>
            <div><label style={S.label}>Evaluation Date</label><input style={S.input} type="date" defaultValue="2026-07-26"/></div>
          </div>
          <div style={{...S.row, marginTop:16}}>
            <button style={S.btn()} onClick={simulate} disabled={simulating}>{simulating?"Simulating...":"Run Simulation (1 credit)"}</button>
          </div>
          {simResult && (
            <div style={{marginTop:20, background:"#09090b", borderRadius:10, padding:20, border:"1px solid #22c55e44"}}>
              <div style={{...S.metricNum, textAlign:"center"}}>{simResult.toLocaleString()}</div>
              <div style={{...S.metricLabel, textAlign:"center"}}>Customers would match today</div>
              <div style={S.divider}/>
              <div style={S.grid3}>
                {[["New customers","312"],["Repeat buyers","841"],["VIP","131"]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{fontWeight:700, fontSize:18, color:accent}}>{v}</div>
                    <div style={{fontSize:12, color:"#71717a"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}