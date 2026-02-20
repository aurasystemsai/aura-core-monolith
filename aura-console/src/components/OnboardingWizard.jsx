// Onboarding Wizard - 3-Step Setup Flow
// Guides new users through connecting Shopify and choosing a plan

import React, { useState } from 'react';
import { FaShopify, FaCreditCard, FaRocket, FaCheck } from 'react-icons/fa';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Aura',
    icon: <FaRocket />,
    description: 'Your AI-powered Shopify growth platform'
  },
  {
    id: 'shopify',
    title: 'Connect Shopify',
    icon: <FaShopify />,
    description: 'Connect your store to unlock all features'
  },
  {
    id: 'plan',
    title: 'Choose Your Plan',
    icon: <FaCreditCard />,
    description: 'Select the perfect plan for your business'
  }
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: ['5 AI runs/month', 'Basic analytics', '100 products', 'Email support']
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    period: 'month',
    popular: true,
    features: ['Unlimited AI runs', 'Advanced analytics', 'Unlimited products', 'Priority support', 'API access']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    period: 'month',
    features: ['Everything in Pro', 'Dedicated manager', 'Custom integrations', 'SLA guarantee']
  }
];

const OnboardingWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [shopDomain, setShopDomain] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [shopifyConnected, setShopifyConnected] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const connectShopify = () => {
    if (!shopDomain) {
      alert('Please enter your shop domain');
      return;
    }

    if (!shopDomain.includes('.myshopify.com')) {
      alert('Please enter a valid Shopify domain');
      return;
    }

    // Redirect to OAuth flow
    window.location.href = `/shopify/auth?shop=${encodeURIComponent(shopDomain)}&onboarding=true`;
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding completion and selected plan
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          selectedPlan,
          shopifyConnected
        })
      });

      // Automatically trigger initial SEO site crawl for first-time users
      try {
        const sessionRes = await fetch('/api/session');
        const session = await sessionRes.json();
        
        if (session.ok && session.shop) {
          // Get the shop URL (convert myshopify domain to full URL)
          const shopUrl = session.shop.includes('http') 
            ? session.shop 
            : `https://${session.shop}`;
          
          // Trigger background site crawl
          console.log('[Onboarding] Starting initial SEO scan for:', shopUrl);
          fetch('/api/tools/seo-site-crawler/crawl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: shopUrl })
          }).then(res => res.json()).then(data => {
            console.log('[Onboarding] Initial SEO scan started:', data);
          }).catch(err => {
            console.warn('[Onboarding] Failed to start initial scan (non-blocking):', err);
          });
        }
      } catch (scanError) {
        // Non-blocking - don't prevent onboarding from completing
        console.warn('[Onboarding] Could not auto-start SEO scan:', scanError);
      }

      // Call parent callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const skipOnboarding = () => {
    if (confirm('Are you sure you want to skip setup? You can always configure this later in Settings.')) {
      completeOnboarding();
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-wizard">
        {/* Progress Bar */}
        <div className="progress-container">
          <div className="steps-indicator">
            {STEPS.map((step, index) => (
              <div key={step.id} className="step-indicator">
                <div className={`step-circle ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}>
                  {index < currentStep ? <FaCheck /> : index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`step-line ${index < currentStep ? 'completed' : ''}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          {currentStep === 0 && (
            <div className="step-welcome">
              <div className="welcome-icon">{STEPS[0].icon}</div>
              <h1>Welcome to Aura</h1>
              <p className="subtitle">Your AI-Powered Shopify Growth Platform</p>
              
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon"></div>
                  <h3>AI-Powered Tools</h3>
                  <p>20+ enterprise tools including automatic SEO scanning on setup</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon"></div>
                  <h3>Advanced Analytics</h3>
                  <p>Real-time insights and predictive analytics for growth</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon"></div>
                  <h3>Automation</h3>
                  <p>Set it and forget it - let AI handle the repetitive tasks</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon"></div>
                  <h3>Revenue Growth</h3>
                  <p>Proven strategies to increase AOV, conversions, and LTV</p>
                </div>
              </div>

              <p className="setup-message">Let's get you set up in just 2 minutes — we'll automatically scan your site for SEO issues!</p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="step-shopify">
              <div className="step-icon">{STEPS[1].icon}</div>
              <h2>Connect Your Shopify Store</h2>
              <p>We need to connect to your Shopify store to access products, orders, and customers.</p>

              {!shopifyConnected ? (
                <div className="shopify-connect-form">
                  <div className="input-group">
                    <label htmlFor="shop-domain">Your Shop Domain</label>
                    <input
                      id="shop-domain"
                      type="text"
                      placeholder="yourstore.myshopify.com"
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      className="shop-input"
                    />
                  </div>

                  <button onClick={connectShopify} className="btn-shopify">
                    <FaShopify />Connect to Shopify
                  </button>

                  <div className="privacy-notice">
                     We only request the minimum permissions needed. Your data is encrypted and secure.
                  </div>

                  <div className="skip-link">
                    <button onClick={handleNext} className="link-btn">
                      Skip for now (you can connect later)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="shopify-connected">
                  <div className="success-icon"></div>
                  <h3>Successfully Connected!</h3>
                  <p>Your Shopify store is now connected to Aura.</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-plan">
              <div className="step-icon">{STEPS[2].icon}</div>
              <h2>Choose Your Plan</h2>
              <p>Start with Free and upgrade anytime as you grow.</p>

              <div className="plans-grid">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && <div className="popular-badge">Most Popular</div>}
                    
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      <span className="price">${plan.price}</span>
                      <span className="period">/{plan.period}</span>
                    </div>

                    <ul className="plan-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>
                          <FaCheck className="check-icon" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="select-indicator">
                      {selectedPlan === plan.id ? ' Selected' : 'Select Plan'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="wizard-footer">
          <button
            onClick={skipOnboarding}
            className="btn-text"
          >
            Skip Setup
          </button>
          
          <div className="nav-buttons">
            {currentStep > 0 && (
              <button onClick={handleBack} className="btn-secondary">
                Back
              </button>
            )}
            <button onClick={handleNext} className="btn-primary">
              {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .onboarding-wizard {
          background: white;
          border-radius: 24px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .progress-container {
          padding: 32px 32px 0;
        }

        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .step-indicator {
          display: flex;
          align-items: center;
        }

        .step-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #fafafa;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          transition: all 0.3s;
        }

        .step-circle.active {
          background: #4f46e5;
          color: #09090b;
        }

        .step-circle.completed {
          background: #28a745;
          color: white;
        }

        .step-line {
          width: 80px;
          height: 3px;
          background: #e4e4e7;
          transition: all 0.3s;
        }

        .step-line.completed {
          background: #28a745;
        }

        .step-content {
          padding: 0 48px 32px;
          min-height: 400px;
        }

        .step-welcome {
          text-align: center;
        }

        .welcome-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .step-welcome h1 {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #09090b;
        }

        .subtitle {
          font-size: 20px;
          color: #666;
          margin: 0 0 48px 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin: 32px 0;
        }

        .feature-card {
          padding: 24px;
          border: 2px solid #fafafa;
          border-radius: 12px;
          text-align: center;
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }

        .feature-card p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .setup-message {
          font-size: 18px;
          font-weight: 600;
          color: #4f46e5;
          margin-top: 32px;
        }

        .step-shopify,
        .step-plan {
          text-align: center;
        }

        .step-icon {
          font-size: 64px;
          color: #4f46e5;
          margin-bottom: 24px;
        }

        .step-shopify h2,
        .step-plan h2 {
          font-size: 32px;
          margin: 0 0 8px 0;
        }

        .step-shopify p,
        .step-plan p {
          color: #666;
          margin: 0 0 32px 0;
        }

        .shopify-connect-form {
          max-width: 400px;
          margin: 0 auto;
        }

        .input-group {
          text-align: left;
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .shop-input {
          width: 100%;
          padding: 16px;
          border: 2px solid #e4e4e7;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .shop-input:focus {
          outline: none;
          border-color: #4f46e5;
        }

        .btn-shopify {
          width: 100%;
          background: #96bf48;
          color: white;
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .btn-shopify:hover {
          background: #7aa33c;
        }

        .privacy-notice {
          margin-top: 16px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 8px;
          font-size: 14px;
          color: #666;
        }

        .skip-link {
          margin-top: 16px;
        }

        .link-btn {
          background: none;
          border: none;
          color: #4f46e5;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .shopify-connected {
          padding: 32px;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: #28a745;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          margin: 0 auto 24px;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }

        .plan-card {
          border: 3px solid #e4e4e7;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .plan-card:hover {
          border-color: #4f46e5;
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .plan-card.selected {
          border-color: #4f46e5;
          background: #f0fffa;
        }

        .plan-card.popular {
          border-color: #4f46e5;
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          right: 24px;
          background: #4f46e5;
          color: #09090b;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .plan-card h3 {
          margin: 0 0 16px 0;
          font-size: 24px;
        }

        .plan-price {
          margin-bottom: 24px;
        }

        .plan-price .price {
          font-size: 42px;
          font-weight: 700;
          color: #4f46e5;
        }

        .plan-price .period {
          color: #666;
          font-size: 16px;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
          text-align: left;
        }

        .plan-features li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          font-size: 14px;
        }

        .check-icon {
          color: #28a745;
          flex-shrink: 0;
        }

        .select-indicator {
          padding: 12px;
          background: #fafafa;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
        }

        .plan-card.selected .select-indicator {
          background: #4f46e5;
          color: #09090b;
        }

        .wizard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 48px;
          border-top: 1px solid #e4e4e7;
        }

        .btn-text {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 14px;
          text-decoration: underline;
        }

        .nav-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          background: #4f46e5;
          color: #09090b;
          padding: 14px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #6ad5bc;
        }

        .btn-secondary {
          background: #fafafa;
          padding: 14px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #e4e4e7;
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;
