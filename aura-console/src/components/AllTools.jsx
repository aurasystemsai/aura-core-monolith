import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api";
import usePlan, { canUseTool, requiredPlanFor, PLAN_LABEL, PLAN_PRICE, PLAN_COLOUR } from "../hooks/usePlan";

export default function AllTools({ setActiveSection }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("category");
  const { plan, planLoading } = usePlan();

  useEffect(() => {
    async function loadModules() {
      try {
        const resp = await apiFetch("/api/main-suite/modules");
        const data = await resp.json();
        if (data.modules) {
          // Flatten all modules from groups
          const allModules = data.modules.flatMap((group) =>
            group.modules.map((mod) => ({
              ...mod,
              category: group.title,
              categoryId: group.id,
            }))
          );
          setModules(allModules);
        }
      } catch (err) {
        console.error("Failed to load tools:", err);
      } finally {
        setLoading(false);
      }
    }
    loadModules();
  }, []);

  const categories = useMemo(() => [
    { id: 'all', label: 'All' },
    ...Array.from(new Set(modules.map(m => m.categoryId)))
      .map(id => { const m = modules.find(x => x.categoryId === id); return { id, label: m?.category || id }; })
  ], [modules]);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredModules = modules.filter((mod) => {
    const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'all' || mod.categoryId === activeCategory;
    return matchesSearch && matchesCat;
  });

  const sortedModules = [...filteredModules].sort((a, b) => {
    if (sortBy === "category") return a.category.localeCompare(b.category);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const getCategoryTag = (categoryId) => {
    const colors = {
      workflows: { bg: "#3b82f6", text: "Platform" },
      analytics: { bg: "#8b5cf6", text: "Analytics" },
      seo: { bg: "#10b981", text: "SEO" },
      personalization: { bg: "#f59e0b", text: "Personalization" },
      revenue: { bg: "#14b8a6", text: "Finance" },
      lifecycle: { bg: "#ec4899", text: "Email" },
      social: { bg: "#4f46e5", text: "Marketing" },
      support: { bg: "#06b6d4", text: "Support" },
      ads: { bg: "#ef4444", text: "Ads" },
    };
    return colors[categoryId] || { bg: "#71717a", text: "Other" };
  };

  const handleToolClick = (moduleId, categoryId) => {
    if (!canUseTool(plan, moduleId)) {
      // Send to Settings billing section
      setActiveSection("settings");
      return;
    }
    try {
      const prefs = JSON.parse(localStorage.getItem("main-suite-prefs") || "{}");
      localStorage.setItem(
        "main-suite-prefs",
        JSON.stringify({ ...prefs, activeGroup: categoryId })
      );
    } catch (e) {}
    setActiveSection(moduleId);
  };

  if (loading) {
    return (
      <div className="all-tools-loading">
        <div className="spinner"></div>
        <p>Loading tools...</p>
      </div>
    );
  }

  return (
    <div className="all-tools-container">
      {/* Header */}
      <div className="all-tools-header">
        <h1>All Tools</h1>
        <p className="subtitle">
          {modules.length} powerful modules to grow your business
        </p>
      </div>

      {/* Controls */}
      <div className="all-tools-controls">
        <input
          type="text"
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="category">Sort: Category</option>
          <option value="name">Sort: A → Z</option>
        </select>
        <button
          onClick={() => setActiveSection("main-suite")}
          className="btn-open-suite"
        >
          Open Suite View
        </button>
      </div>
      {/* Category filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${activeCategory === cat.id ? '#4f46e5' : '#27272a'}`,
              background: activeCategory === cat.id ? '#4f46e522' : 'transparent',
              color: activeCategory === cat.id ? '#4f46e5' : '#a1a1aa',
            }}
          >
            {cat.label}
          </button>
        ))}
        {(searchTerm || activeCategory !== 'all') && (
          <button
            onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid #52525b', background: 'transparent', color: '#71717a' }}
          >
            Clear filters 
          </button>
        )}
      </div>

      {/* Tool Grid */}
      {sortedModules.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#71717a' }}>
          
          <div style={{ fontSize: 18, fontWeight: 700, color: '#a1a1aa', marginBottom: 8 }}>No tools found</div>
          <div style={{ fontSize: 14 }}>Try a different search term or category</div>
          <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} style={{ marginTop: 20, padding: '8px 20px', borderRadius: 8, border: '1px solid #52525b', background: 'transparent', color: '#4f46e5', fontWeight: 700, cursor: 'pointer' }}>Clear filters</button>
        </div>
      )}
      <div className="all-tools-grid">
        {sortedModules.map((mod) => {
          const tag = getCategoryTag(mod.categoryId);
          const locked = !planLoading && !canUseTool(plan, mod.id);
          const reqPlan = requiredPlanFor(mod.id);
          return (
            <div
              key={mod.id}
              className="tool-card"
              onClick={() => handleToolClick(mod.id, mod.categoryId)}
              style={locked ? { opacity: 0.72, position: "relative", cursor: "pointer" } : { position: "relative" }}
            >
              {locked && (
                <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "rgba(15,23,42,0.82)", backdropFilter: "blur(2px)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, textAlign: "center" }}>
                  <span style={{ fontSize: 28 }}></span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: PLAN_COLOUR[reqPlan] }}>{PLAN_LABEL[reqPlan]} Plan</span>
                  <span style={{ fontSize: 11, color: "#a1a1aa" }}>from {PLAN_PRICE[reqPlan]}</span>
                  <span style={{ fontSize: 11, color: "#4f46e5", fontWeight: 700, marginTop: 2 }}>Upgrade Plan →</span>
                </div>
              )}
              <div className="tool-card-header">
                <h3>{mod.name}</h3>
                <span
                  className="category-tag"
                  style={{ backgroundColor: tag.bg }}
                >
                  {tag.text}
                </span>
              </div>
              <p className="tool-description">{mod.description}</p>
              {mod.status && (
                <span className={`status-badge status-${mod.status}`}>
                  {mod.status === "new" ? "NEW" : mod.status === "beta" ? "BETA" : mod.status}
                </span>
              )}
              {mod.docUrl && (
                <a
                  href={mod.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="doc-link"
                  onClick={(e) => e.stopPropagation()}
                >
                   Docs
                </a>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .all-tools-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          background: #18181b;
          min-height: 100vh;
        }

        .all-tools-header {
          margin-bottom: 32px;
        }

        .all-tools-header h1 {
          font-size: 36px;
          font-weight: 900;
          color: #4f46e5;
          margin: 0 0 8px 0;
        }

        .subtitle {
          color: #a1a1aa;
          font-size: 16px;
          margin: 0;
        }

        .all-tools-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(127, 255, 212, 0.2);
          border-top-color: #4f46e5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .all-tools-loading p {
          color: #a1a1aa;
          font-size: 15px;
        }

        .all-tools-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #27272a;
          background: #18181b;
          color: #fafafa;
          font-size: 15px;
        }

        .search-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(127, 255, 212, 0.1);
        }

        .sort-select {
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #27272a;
          background: #18181b;
          color: #fafafa;
          font-size: 15px;
          cursor: pointer;
        }

        .btn-open-suite {
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #22d3ee 100%);
          color: #18181b;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-open-suite:hover {
          transform: translateY(-2px);
        }

        .all-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .tool-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .tool-card:hover {
          transform: translateY(-4px);
          border-color: #4f46e5;
          box-shadow: 0 8px 24px rgba(127, 255, 212, 0.15);
        }

        .tool-card-header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .tool-card h3 {
          font-size: 18px;
          font-weight: 700;
          color: #fafafa;
          margin: 0;
          flex: 1;
        }

        .category-tag {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .tool-description {
          color: #a1a1aa;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .status-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-new {
          background: #22d3ee;
          color: #18181b;
        }

        .status-beta {
          background: #f59e0b;
          color: #18181b;
        }

        .doc-link {
          display: inline-block;
          margin-top: 12px;
          color: #4f46e5;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .doc-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

