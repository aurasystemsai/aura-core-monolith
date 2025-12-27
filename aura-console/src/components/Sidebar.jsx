import React from 'react';
import { useTranslation } from 'react-i18next';
import toolsMeta from '../toolMeta';

function Sidebar({ current, onSelect, mode, setMode }) {
  const { t } = useTranslation();
  const navItems = [
    { key: 'dashboard', label: t('sidebar_dashboard') },
    { key: 'auth', label: t('sidebar_auth') },
    { key: 'onboarding', label: t('sidebar_onboarding') },
    { key: 'credits', label: t('sidebar_credits') },
    { key: 'orchestration', label: t('sidebar_orchestration') },
    { key: 'products', label: t('sidebar_products') },
    { key: 'content-health', label: t('sidebar_content_health') },
    { key: 'fix-queue', label: t('sidebar_fix_queue') },
    { key: 'content-ingest', label: t('sidebar_content_ingest') },
    { key: 'draft-library', label: t('sidebar_draft_library') },
    { key: 'system-health', label: t('sidebar_system_health') },
  ];
  return (
    <nav className="sidebar">
      <div className="sidebar-brand" style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        <img src="/logo-aura.png" alt={t('sidebar_logo_alt')} style={{height:38,width:38,objectFit:'contain',borderRadius:10,boxShadow:'0 2px 12px #22d3ee55'}} />
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
      <div className="sidebar-section-label">{t('sidebar_tools_section')}</div>
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
          alt={t('sidebar_avatar_alt')}
          style={{ width: 48, height: 48, borderRadius: '50%', boxShadow: '0 2px 12px #22d3ee55', marginBottom: 6 }}
        />
        <div style={{ fontWeight: 700, color: '#7fffd4', fontSize: 16, letterSpacing: '0.01em', textShadow: '0 1px 4px #0004', lineHeight: 1.2 }}>
          {t('sidebar_user_name')}
        </div>
        <div style={{ fontSize: 13, color: '#e6e6f0', opacity: 1, lineHeight: 1.2 }}>{t('sidebar_user_email')}</div>
        <label htmlFor="theme-picker" style={{ fontSize: 13, color: '#cbd5f5', marginTop: 10, marginBottom: 4 }}>{t('sidebar_theme_label')}</label>
        <select
          id="theme-picker"
          value={mode}
          onChange={e => setMode(e.target.value)}
          style={{
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 15,
            background: '#181c2a',
            color: '#7fffd4',
            border: '1.5px solid #7fffd4',
            marginBottom: 8,
            fontWeight: 600,
            outline: 'none',
            boxShadow: '0 2px 8px #22d3ee22',
            cursor: 'pointer',
          }}
          aria-label={t('sidebar_theme_picker_aria')}
        >
          <option value="system">{t('sidebar_theme_system')}</option>
          <option value="light">{t('sidebar_theme_light')}</option>
          <option value="dark">{t('sidebar_theme_dark')}</option>
        </select>
      </div>
    </nav>
  );
}

export default Sidebar;


