import toolsMeta from "../toolMeta";


function Sidebar({ current, onSelect }) {
  const navItems = [
        { key: 'dashboard', label: 'Dashboard', icon: '📊' },
        { key: 'auth', label: 'Auth', icon: '🔑' },
        { key: 'onboarding', label: 'Onboarding', icon: '🚀' },
        { key: 'credits', label: 'Credits', icon: '💳' },
        { key: 'orchestration', label: 'Orchestration', icon: '🧩' },
        { key: 'products', label: 'Products', icon: '📦' },
        { key: 'content-health', label: 'Content Health', icon: '🩺' },
        { key: 'fix-queue', label: 'Fix Queue', icon: '🛠️' },
        { key: 'content-ingest', label: 'Content Ingest', icon: '📥' },
        { key: 'draft-library', label: 'Draft Library', icon: '📚' },
        { key: 'system-health', label: 'System Health', icon: '🖥️' }
  ];
  function Sidebar({ current, onSelect, onShowChangelog, changelogUnread }) {
    return (
    <nav className="sidebar">
      <div className="sidebar-brand" style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        <img src="/logo-aura.png" alt="AURA Logo" style={{height:38,width:38,objectFit:'contain',borderRadius:10,boxShadow:'0 2px 12px #22d3ee55'}} />
      </div>
      <ul className="sidebar-nav">
        {navItems.map(item => (
          <li
            key={item.key}
            className={current === item.key ? 'active' : ''}
            onClick={() => onSelect(item.key)}
            tabIndex={0}
            aria-label={item.label}
            title={item.label}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(item.key);
              }
            }}
            style={{ outline: current === item.key ? '2px solid #7fffd4' : 'none' }}
          >
            {/* icon removed */}
            <span className="sidebar-label">{item.label}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onShowChangelog}
        style={{
          width: '100%', background: 'none', border: 'none', color: '#7fffd4', fontWeight: 700, fontSize: 15, cursor: 'pointer', margin: '18px 0 8px 0', padding: 0, textAlign: 'left', position: 'relative', display: 'flex', alignItems: 'center', gap: 8
        }}
        aria-label="Show What’s New / Changelog"
      >
        <span style={{fontSize:18}}>✨</span> What’s New
        {changelogUnread && <span style={{width:10,height:10,borderRadius:'50%',background:'#ff4d4f',display:'inline-block',marginLeft:4}} aria-label="New update" />}
      </button>
      <div className="sidebar-section-label">Tools</div>
      <ul className="sidebar-nav sidebar-tools">
        {toolsMeta.map(tool => (
          <li
            key={tool.id}
            className={current === tool.id ? 'active' : ''}
            onClick={() => onSelect(tool.id)}
            tabIndex={0}
            aria-label={tool.name}
            title={tool.description || tool.name}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(tool.id);
              }
            }}
            style={{ outline: current === tool.id ? '2px solid #7fffd4' : 'none' }}
          >
            {/* icon removed */}
            <span className="sidebar-label">{tool.name}</span>
          </li>
        ))}
      </ul>
      <div className="sidebar-profile" style={{
        marginTop: 'auto',
        padding: '32px 0 24px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}>
        <img
          src="/avatar-default.png"
          alt="User Avatar"
          style={{ width: 48, height: 48, borderRadius: '50%', boxShadow: '0 2px 12px #22d3ee55', marginBottom: 6 }}
        />
        <div style={{ fontWeight: 700, color: '#7fffd4', fontSize: 16, letterSpacing: '0.01em', textShadow: '0 1px 4px #0004', lineHeight: 1.2 }}>
          User Name
        </div>
        <div style={{ fontSize: 13, color: '#e6e6f0', opacity: 1, lineHeight: 1.2 }}>user@email.com</div>
      </div>
    </nav>
  );
}
  export default Sidebar;


