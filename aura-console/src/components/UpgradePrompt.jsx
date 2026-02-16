// Components for displaying locked features and upgrade prompts
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanAccess, useToolAccess } from '../hooks/usePlanAccess';
import './UpgradePrompt.css';

/**
 * Shows a lock icon and upgrade message for locked tools
 */
export function LockedToolBadge({ toolId, requiredPlan = 'professional' }) {
  return (
    <div className="locked-tool-badge">
      <svg className="lock-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a3 3 0 0 0-3 3v3H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a3 3 0 0 0-3-3zm1 6V4a1 1 0 0 0-2 0v3h2z"/>
      </svg>
      <span className="upgrade-hint">{requiredPlan}</span>
    </div>
  );
}

/**
 * Full-page upgrade prompt overlay
 */
export function UpgradePrompt({ toolId, toolName, requiredPlan = 'professional' }) {
  const navigate = useNavigate();
  
  const planNames = {
    professional: 'Professional',
    enterprise: 'Enterprise'
  };
  
  const planPrices = {
    professional: '$99/month',
    enterprise: '$299/month'
  };

  return (
    <div className="upgrade-prompt-overlay">
      <div className="upgrade-prompt-card">
        <div className="upgrade-prompt-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#5C6AC4" opacity="0.1"/>
            <path d="M32 16a8 8 0 0 0-8 8v6h-4a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V34a4 4 0 0 0-4-4h-4v-6a8 8 0 0 0-8-8zm4 14v-6a4 4 0 0 0-8 0v6h8z" fill="#5C6AC4"/>
          </svg>
        </div>
        
        <h2 className="upgrade-prompt-title">Upgrade to Access {toolName}</h2>
        
        <p className="upgrade-prompt-description">
          This tool requires the <strong>{planNames[requiredPlan]} plan</strong> ({planPrices[requiredPlan]}).
        </p>
        
        <div className="upgrade-prompt-benefits">
          <h3>What you'll get:</h3>
          <ul>
            {requiredPlan === 'professional' && (
              <>
                <li>10,000 AI runs per month</li>
                <li>10,000 products</li>
                <li>5 team members</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
                <li>API access</li>
              </>
            )}
            {requiredPlan === 'enterprise' && (
              <>
                <li>Unlimited AI runs</li>
                <li>Unlimited products</li>
                <li>Unlimited team members</li>
                <li>White-label API</li>
                <li>Dedicated support</li>
                <li>Custom integrations</li>
              </>
            )}
          </ul>
        </div>
        
        <div className="upgrade-prompt-actions">
          <button 
            className="btn btn-primary btn-upgrade"
            onClick={() => navigate('/billing')}
          >
            Upgrade to {planNames[requiredPlan]}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline upgrade banner (less intrusive than full overlay)
 */
export function UpgradeBanner({ toolId, toolName, requiredPlan = 'professional' }) {
  const navigate = useNavigate();
  
  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-content">
        <div className="upgrade-banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a5 5 0 0 0-5 5v4H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3h-1V7a5 5 0 0 0-5-5zm3 9V7a3 3 0 0 0-6 0v4h6z"/>
          </svg>
        </div>
        <div className="upgrade-banner-text">
          <strong>{toolName}</strong> requires {requiredPlan} plan
        </div>
      </div>
      <button 
        className="btn btn-sm btn-primary"
        onClick={() => navigate('/billing')}
      >
        Upgrade
      </button>
    </div>
  );
}

/**
 * Wrapper component that checks access and shows upgrade prompt if needed
 */
export function ProtectedTool({ toolId, toolName, children }) {
  const { canAccess, loading, upgradeMessage } = useToolAccess(toolId);
  
  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Checking access...</p>
      </div>
    );
  }
  
  if (!canAccess) {
    // Extract required plan from message if available
    const requiredPlan = upgradeMessage?.includes('enterprise') ? 'enterprise' : 'professional';
    return <UpgradePrompt toolId={toolId} toolName={toolName} requiredPlan={requiredPlan} />;
  }
  
  return <>{children}</>;
}

/**
 * Usage limit warning banner
 */
export function UsageLimitWarning({ limitType, currentUsage, limit }) {
  const navigate = useNavigate();
  const percent = (currentUsage / limit) * 100;
  
  if (percent < 80) return null; // Only show when approaching limit
  
  const isExceeded = percent >= 100;
  
  return (
    <div className={`usage-limit-banner ${isExceeded ? 'exceeded' : 'warning'}`}>
      <div className="usage-limit-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
        </svg>
        <div className="usage-limit-text">
          {isExceeded ? (
            <strong>Limit reached:</strong>
          ) : (
            <strong>Approaching limit:</strong>
          )}
          {' '}
          You've used {currentUsage.toLocaleString()} of {limit.toLocaleString()} {limitType}
        </div>
      </div>
      <button 
        className="btn btn-sm btn-primary"
        onClick={() => navigate('/billing')}
      >
        Upgrade Plan
      </button>
    </div>
  );
}

/**
 * Plan badge to show current plan
 */
export function PlanBadge() {
  const { plan, loading } = usePlanAccess();
  
  if (loading) return null;
  
  const planColors = {
    free: '#8A8A8A',
    professional: '#5C6AC4',
    enterprise: '#F49342'
  };
  
  const planNames = {
    free: 'Free',
    professional: 'Pro',
    enterprise: 'Enterprise'
  };
  
  return (
    <div 
      className="plan-badge"
      style={{ 
        backgroundColor: planColors[plan],
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        display: 'inline-block'
      }}
    >
      {planNames[plan] || plan}
    </div>
  );
}

export default UpgradePrompt;
