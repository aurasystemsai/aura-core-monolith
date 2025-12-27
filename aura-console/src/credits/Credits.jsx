import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import './Credits.css';

const Credits = () => {
  // Placeholder state for credits and usage
  const [credits, setCredits] = useState(120);
  const [used, setUsed] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuyCredits = () => {
    setLoading(true);
    setError('');
    // Simulate purchase
    setTimeout(() => {
      setCredits(c => c + 100);
      setLoading(false);
    }, 1200);
  };

  const { t } = useTranslation();
  return (
    <div className="aura-credits-shell">
      <h2 className="aura-credits-title">{t('credits_title')}</h2>
      <div className="aura-credits-balance">
        <span className="aura-credits-label">{t('credits_current')}</span>
        <span className="aura-credits-value">{credits}</span>
      </div>
      <div className="aura-credits-usage">
        <span className="aura-credits-label">{t('credits_used_this_month')}</span>
        <span className="aura-credits-value aura-credits-used">{used}</span>
      </div>
      <div className="aura-credits-progress">
        <div className="aura-credits-bar-bg">
          <div className="aura-credits-bar" style={{ width: `${Math.min(100, (used / (credits + used)) * 100)}%` }} />
        </div>
        <span className="aura-credits-bar-label">{t('credits_total', { total: used + credits })}</span>
      </div>
      <button className="aura-credits-btn" onClick={handleBuyCredits} disabled={loading}>
        {loading ? t('credits_processing') : t('credits_buy_100')}
      </button>
      {error && <div className="aura-credits-error">{error}</div>}
      <div className="aura-credits-note">{t('credits_note')}</div>
    </div>
  );
};

export default Credits;
