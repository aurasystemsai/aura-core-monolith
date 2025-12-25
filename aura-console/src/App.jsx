// TODO: Refactor the main UI shell, navigation, and dashboard to match the new world-class, modern, professional standards set in ProductsList.jsx:
// - Consistent actionable tips, field targets, and device previews
// - Google-style SEO previews and export everywhere
// - Accessibility and keyword checks everywhere
// - Modern, clean, SEMrush/Ahrefs-level layout and visual polish
// - Propagate all advanced features and best practices to every tool and dashboard view
// aura-console/src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";
import ProjectSetup from "./ProjectSetup";
import ProjectSwitcher from "./ProjectSwitcher";

import SystemHealthPanel from "./components/SystemHealthPanel";
import DraftLibrary from "./components/DraftLibrary";
import ContentHealthAuditor from "./components/ContentHealthAuditor";
import ContentIngestor from "./components/ContentIngestor";
import ProductsList from "./components/ProductsList.jsx";


const DEFAULT_CORE_API = "https://aura-core-monolith.onrender.com";

// Single place to define engines used by the console
const ENGINES = {
  product: {
    key: "product",
    toolId: "product-seo",
    // ...other fields...
  },
  // ...other engines...
};

function App() {
  const [activeSection, setActiveSection] = useState('products');
  // ...existing hooks and logic...
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar active={activeSection} onSelect={setActiveSection} />
      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ProjectSwitcher coreUrl={coreUrl} currentProject={project} onSelectProject={setProject} onDisconnect={() => setProject(null)} />
        </div>
        {/* Main content area switches by section */}
        {activeSection === 'products' && <ProductsList shopDomain={null} shopToken={null} />}
        {activeSection === 'content-health' && <ContentHealthAuditor />}
        {activeSection === 'fix-queue' && <div><h2>Fix Queue</h2><p>Coming soon: Advanced fix queue UI.</p></div>}
        {activeSection === 'content-ingest' && <ContentIngestor />}
        {activeSection === 'draft-library' && <DraftLibrary />}
        {activeSection === 'system-health' && <SystemHealthPanel />}
      </main>
    </div>
  );
}
export default App;
