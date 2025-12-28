import React, { useState } from 'react';
import './Onboarding.css';

const steps = [
  'welcome',
  'connect-shop',
  'setup-complete',
];

const Onboarding = () => {
  const [step, setStep] = useState(steps[0]);
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnect = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Simulate shop connection
    setTimeout(() => {
      if (!shopDomain || !shopDomain.match(/^[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}$/)) {
        setError('Please enter a valid shop domain.');
        setLoading(false);
        return;
      }
      setStep('setup-complete');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="aura-onboarding-shell">
      {step === 'welcome' && (
        <div className="aura-onboarding-step">
          <h2 className="aura-onboarding-title">Welcome to AURA!</h2>
          <p className="aura-onboarding-desc">Get started with world-class automation for e-commerce. Use the sidebar to explore tools, check your dashboard, and optimize your store.</p>
          <button className="aura-onboarding-btn" onClick={() => setStep('connect-shop')}>Start Onboarding</button>
        </div>
      )}
      {step === 'connect-shop' && (
        <div className="aura-onboarding-step">
          <h2 className="aura-onboarding-title">Connect your Shopify store</h2>
          <form className="aura-onboarding-form" onSubmit={handleConnect}>
            <input
              type="text"
              name="shopDomain"
              placeholder="your-store.myshopify.com"
              value={shopDomain}
              onChange={e => setShopDomain(e.target.value)}
              className="aura-onboarding-input"
              disabled={loading}
            />
            {error && <div className="aura-onboarding-error">{error}</div>}
            <button type="submit" className="aura-onboarding-btn" disabled={loading}>
              {loading ? 'Connecting…' : 'Connect Store'}
            </button>
          </form>
        </div>
      )}
      {step === 'setup-complete' && (
        <div className="aura-onboarding-step">
          <h2 className="aura-onboarding-title">Setup Complete!</h2>
          <p className="aura-onboarding-desc">Your store <b>{shopDomain}</b> is now connected. You’re ready to use all Aura Console features.</p>
          <button className="aura-onboarding-btn" onClick={() => window.location.reload()}>Go to Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
