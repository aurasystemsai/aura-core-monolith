/**
 * MozUI.jsx — Moz-inspired shared UI components for AURA
 * ScoreRing, MetricCard, DifficultyBar, DataTable, ToolHeader,
 * LinkTypeBadge, SpamBar, FilterBar, ScoreBar, AuthorityBadge
 */
import React, { useState } from "react";

// ─── Score colour scale (mirrors Moz DA colour system) ───────────────────────
export function scoreColor(n) {
  const s = Number(n) || 0;
  if (s >= 80) return "#1fbb7a"; // excellent — green
  if (s >= 60) return "#3b9eff"; // good       — blue
  if (s >= 40) return "#f5c842"; // fair       — amber
  if (s >= 20) return "#e95d1e"; // poor       — orange
  return "#e03e40";              // very poor  — red
}
export function scoreLabel(n) {
  const s = Number(n) || 0;
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  if (s >= 20) return "Poor";
  return "Very Poor";
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────
// Circular authority score — like Moz DA/PA rings
export function ScoreRing({ score = 0, size = 96, label = "Score", thin = false }) {
  const r = 38, cx = 50, cy = 50;
  const strokeWidth = thin ? 7 : 10;
  const circumference = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, Number(score) / 100)) * circumference;
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
        <text x="50" y="46" textAnchor="middle" fill="#fafafa" fontSize="22" fontWeight="800"
          fontFamily="'Inter',system-ui,sans-serif">{Math.round(Number(score) || 0)}</text>
        <text x="50" y="62" textAnchor="middle" fill="#71717a" fontSize="10"
          fontFamily="'Inter',system-ui,sans-serif">/ 100</text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>{label}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color, textAlign: "center" }}>{scoreLabel(score)}</div>
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
// Big number stat card — like Moz's "Linking Domains" cards
export function MetricCard({ value, label, sub, color, icon, onClick, loading }) {
  return (
    <div onClick={onClick} style={{
      background: "#18181b", border: "1px solid #27272a", borderRadius: 12,
      padding: "18px 20px", flex: 1, minWidth: 120,
      cursor: onClick ? "pointer" : "default",
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = "#4f46e5")}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = "#27272a")}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {icon && <span style={{ marginRight: 5 }}>{icon}</span>}{label}
      </div>
      {loading ? (
        <div style={{ height: 36, background: "#27272a", borderRadius: 6, animation: "moz-pulse 1.4s ease-in-out infinite" }} />
      ) : (
        <div style={{ fontSize: 30, fontWeight: 900, color: color || "#fafafa", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          {value ?? "—"}
        </div>
      )}
      {sub && <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── MetricRow ────────────────────────────────────────────────────────────────
// Horizontal row of MetricCards — the top bar on every Moz tool
export function MetricRow({ metrics = [], loading }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
      {metrics.map((m, i) => (
        <MetricCard key={i} {...m} loading={loading} />
      ))}
    </div>
  );
}

// ─── DifficultyBar ────────────────────────────────────────────────────────────
// Keyword difficulty / spam score horizontal bar
export function DifficultyBar({ score = 0, label, showLabel = true, height = 6 }) {
  const color = scoreColor(100 - score); // invert: high difficulty = bad
  return (
    <div style={{ minWidth: 80 }}>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
          <span style={{ color: "#71717a" }}>{label}</span>
          <span style={{ color, fontWeight: 700 }}>{score}</span>
        </div>
      )}
      <div style={{ background: "#27272a", borderRadius: height, height, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(100, score)}%`, height: "100%",
          background: color, borderRadius: height,
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────
// Generic 0-100 score bar with color auto-set by value
export function ScoreBar({ score = 0, showNumber = true, height = 8 }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, background: "#27272a", borderRadius: height, height, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(100, score)}%`, height: "100%",
          background: color, borderRadius: height,
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      {showNumber && <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>{Math.round(score)}</span>}
    </div>
  );
}

// ─── SpamBar ──────────────────────────────────────────────────────────────────
// Spam score — low is good (green), high is red
export function SpamBar({ score = 0 }) {
  const color = score <= 4 ? "#1fbb7a" : score <= 8 ? "#f5c842" : "#e03e40";
  const label = score <= 4 ? "Low risk" : score <= 8 ? "Medium risk" : "High risk";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
        <span style={{ color: "#71717a" }}>Spam Score</span>
        <span style={{ color, fontWeight: 700 }}>{score}/17</span>
      </div>
      <div style={{ background: "#27272a", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${(score / 17) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s" }} />
      </div>
      <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ─── AuthorityBadge ───────────────────────────────────────────────────────────
// Inline DA/PA badge — the small colored pill on data tables
export function AuthorityBadge({ score, label = "DA" }) {
  const color = scoreColor(score);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: color + "22", border: `1px solid ${color}44`,
      color, borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 9, color: color + "aa" }}>{label}</span> {Math.round(Number(score) || 0)}
    </span>
  );
}

// ─── LinkTypeBadge ────────────────────────────────────────────────────────────
export function LinkTypeBadge({ type }) {
  const map = {
    follow:    { bg: "#15392a", color: "#1fbb7a", text: "Follow" },
    nofollow:  { bg: "#2d1b1b", color: "#f87171", text: "Nofollow" },
    sponsored: { bg: "#2a2015", color: "#f5c842", text: "Sponsored" },
    ugc:       { bg: "#1a1f2e", color: "#818cf8", text: "UGC" },
  };
  const t = (type || "follow").toLowerCase();
  const s = map[t] || map.follow;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
      {s.text}
    </span>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    error:     { bg: "#2d1b1b", color: "#f87171" },
    warning:   { bg: "#2a2015", color: "#f5c842" },
    success:   { bg: "#15392a", color: "#1fbb7a" },
    info:      { bg: "#1a1f2e", color: "#818cf8" },
  };
  const s = map[(status||"info").toLowerCase()] || map.info;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

// ─── SortableTable ────────────────────────────────────────────────────────────
// Full sortable + filterable Moz-style data table
export function SortableTable({ columns = [], rows = [], emptyText = "No data yet.", loading, compact }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = compact ? 10 : 20;

  const sorted = [...rows].sort((a, b) => {
    if (!sortCol) return 0;
    const av = a[sortCol], bv = b[sortCol];
    const an = parseFloat(av), bn = parseFloat(bv);
    const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av || "").localeCompare(String(bv || ""));
    return sortDir === "asc" ? cmp : -cmp;
  });
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("desc"); }
    setPage(0);
  };

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: compact ? 12 : 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #27272a" }}>
              {columns.map(col => (
                <th key={col.key} onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    textAlign: col.align || "left", padding: compact ? "8px 10px" : "10px 14px",
                    color: sortCol === col.key ? "#4f46e5" : "#71717a",
                    fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
                    whiteSpace: "nowrap", cursor: col.sortable !== false ? "pointer" : "default",
                    userSelect: "none", background: "#18181b",
                  }}>
                  {col.label}
                  {col.sortable !== false && (
                    <span style={{ marginLeft: 4, opacity: sortCol === col.key ? 1 : 0.3 }}>
                      {sortCol === col.key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: compact ? "8px 10px" : "12px 14px" }}>
                      <div style={{ height: 14, background: "#27272a", borderRadius: 4, width: "70%", animation: "moz-pulse 1.4s ease-in-out infinite" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: "48px 24px", color: "#52525b", fontSize: 13 }}>{emptyText}</td></tr>
            ) : pageRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1f1f22" }}
                onMouseEnter={e => e.currentTarget.style.background = "#141417"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {columns.map(col => (
                  <td key={col.key} style={{
                    padding: compact ? "8px 10px" : "12px 14px",
                    color: "#fafafa", verticalAlign: "middle",
                    textAlign: col.align || "left",
                  }}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", borderTop: "1px solid #27272a", marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#71717a" }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: "5px 12px", background: "none", border: "1px solid #3f3f46", borderRadius: 6, color: page === 0 ? "#52525b" : "#fafafa", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 12 }}>
              Prev
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: "5px 12px", background: "none", border: "1px solid #3f3f46", borderRadius: 6, color: page >= totalPages - 1 ? "#52525b" : "#fafafa", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontSize: 12 }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────
export function FilterBar({ search, onSearch, placeholder = "Filter...", children, count }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
      {onSearch && (
        <input
          value={search} onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, minWidth: 200, background: "#09090b", border: "1px solid #3f3f46",
            borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "8px 12px", outline: "none",
          }}
        />
      )}
      {children}
      {count != null && (
        <span style={{ fontSize: 12, color: "#71717a", marginLeft: 4, whiteSpace: "nowrap" }}>{count} results</span>
      )}
    </div>
  );
}

// ─── ToolHeader ───────────────────────────────────────────────────────────────
// Standard Moz-style tool page header with domain input + run button
export function ToolHeader({ title, description, inputValue, onInputChange, onRun, loading, inputPlaceholder = "Enter domain or URL...", buttonLabel = "Analyze", extra }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{title}</h1>
      {description && <p style={{ fontSize: 13, color: "#71717a", margin: "0 0 18px" }}>{description}</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {onInputChange && (
          <input
            value={inputValue} onChange={e => onInputChange(e.target.value)}
            placeholder={inputPlaceholder}
            onKeyDown={e => e.key === "Enter" && onRun && !loading && onRun()}
            style={{
              flex: 1, minWidth: 260, background: "#0d0d10", border: "1px solid #3f3f46",
              borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none",
              fontFamily: "'Inter',system-ui,sans-serif",
            }}
          />
        )}
        {onRun && (
          <button onClick={onRun} disabled={loading}
            style={{
              background: loading ? "#2d2d6b" : "#4f46e5", color: "#fff", border: "none",
              borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
            {loading && <Spinner size={14} />}
            {buttonLabel}
          </button>
        )}
        {extra}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function MozTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: "2px solid #27272a", marginBottom: 24, overflowX: "auto", gap: 0 }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          style={{
            background: "none", border: "none", borderBottom: active === tab.id ? "2px solid #4f46e5" : "2px solid transparent",
            color: active === tab.id ? "#4f46e5" : "#71717a",
            fontWeight: active === tab.id ? 700 : 400,
            fontSize: 13, padding: "10px 18px", cursor: "pointer",
            whiteSpace: "nowrap", marginBottom: -2, transition: "all 0.15s",
          }}>
          {tab.label}
          {tab.count != null && (
            <span style={{
              marginLeft: 6, fontSize: 10, fontWeight: 700,
              background: active === tab.id ? "#4f46e5" : "#27272a",
              color: active === tab.id ? "#fff" : "#71717a",
              borderRadius: 10, padding: "1px 6px",
            }}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function MozCard({ title, action, children, noPad }) {
  return (
    <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #27272a" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#fafafa" }}>{title}</span>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={noPad ? {} : { padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "search", title = "No data yet", description, action }) {
  const icons = { search: "○", link: "—", chart: "△", check: "✓" };
  return (
    <div style={{ textAlign: "center", padding: "64px 32px" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, color: "#52525b" }}>
        {icons[icon] || "○"}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: "#71717a", maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.6 }}>{description}</div>}
      {action}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = "#4f46e5" }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `${Math.max(2, size / 8)}px solid ${color}33`,
      borderTop: `${Math.max(2, size / 8)}px solid ${color}`,
      borderRadius: "50%",
      animation: "moz-spin 0.7s linear infinite",
      display: "inline-block",
    }} />
  );
}

// ─── ErrorBox ─────────────────────────────────────────────────────────────────
export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "12px 16px", fontSize: 13, marginBottom: 16 }}>
      {message}
    </div>
  );
}

// ─── ScoreOverview ────────────────────────────────────────────────────────────
// The top section of a Moz tool showing multiple score rings + key metrics
export function ScoreOverview({ scores = [], metrics = [], loading }) {
  return (
    <div style={{
      background: "#18181b", border: "1px solid #27272a", borderRadius: 14,
      padding: "24px", marginBottom: 24,
      display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start",
    }}>
      {scores.length > 0 && (
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {scores.map((s, i) => (
            <ScoreRing key={i} score={loading ? 0 : s.score} label={s.label} size={s.size || 96} />
          ))}
        </div>
      )}
      {metrics.length > 0 && (
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} loading={loading} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KeywordDifficultyCell ────────────────────────────────────────────────────
export function KDCell({ kd }) {
  const score = Number(kd) || 0;
  // For KD: high = bad, so invert scoreColor
  const color = score >= 80 ? "#e03e40" : score >= 60 ? "#e95d1e" : score >= 40 ? "#f5c842" : score >= 20 ? "#3b9eff" : "#1fbb7a";
  const label = score >= 80 ? "Very Hard" : score >= 60 ? "Hard" : score >= 40 ? "Medium" : score >= 20 ? "Easy" : "Very Easy";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 48, background: "#27272a", borderRadius: 4, height: 6, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 20 }}>{score}</span>
      <span style={{ fontSize: 10, color: "#71717a" }}>{label}</span>
    </div>
  );
}
