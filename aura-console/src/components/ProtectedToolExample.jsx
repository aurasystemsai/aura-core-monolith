// Example: Protected Tool Page with Access Control
import React, { useState } from 'react';
import { ProtectedTool, UsageLimitWarning, PlanBadge } from './UpgradePrompt';
import { useUsageLimits } from '../hooks/usePlanAccess';

/**
 * Example: Abandoned Checkout Tool (requires Professional plan)
 */
function AbandonedCheckoutTool() {
  const [campaigns, setCampaigns] = useState([]);
  const { usage, limits, isLimitReached } = useUsageLimits();
  
  return (
    <ProtectedTool 
      toolId="abandoned-checkout" 
      toolName="Abandoned Checkout Winback"
    >
      <div className="tool-page">
        <div className="tool-header">
          <div>
            <h1>Abandoned Checkout Winback</h1>
            <p>Recover lost sales with AI-powered email campaigns</p>
          </div>
          <PlanBadge />
        </div>
        
        {/* Show usage warning if approaching limit */}
        <UsageLimitWarning 
          limitType="ai_runs"
          currentUsage={usage.ai_runs}
          limit={limits.ai_runs}
        />
        
        {/* Tool content */}
        <div className="tool-content">
          <button 
            className="btn btn-primary"
            disabled={isLimitReached('ai_runs')}
            onClick={() => {/* Create campaign */}}
          >
            {isLimitReached('ai_runs') ? 'Limit Reached - Upgrade Plan' : 'Create Campaign'}
          </button>
          
          {/* Rest of tool UI */}
        </div>
      </div>
    </ProtectedTool>
  );
}

/**
 * Example: Dashboard with Tool Cards (showing locked/unlocked states)
 */
function ToolsDashboard() {
  const { accessibleTools, plan } = usePlanAccess();
  
  const allTools = [
    { id: 'product-seo', name: 'Product SEO', category: 'free', icon: '🛍️' },
    { id: 'blog-seo', name: 'Blog SEO', category: 'free', icon: '📝' },
    { id: 'abandoned-checkout', name: 'Abandoned Checkout', category: 'professional', icon: '🛒' },
    { id: 'reviews-ugc', name: 'Reviews & UGC', category: 'professional', icon: '⭐' },
    { id: 'ai-support-assistant', name: 'AI Support Assistant', category: 'enterprise', icon: '🤖' },
    { id: 'advanced-analytics', name: 'Advanced Analytics', category: 'enterprise', icon: '📊' },
  ];
  
  const isAccessible = (toolId) => {
    return accessibleTools.includes(toolId);
  };
  
  return (
    <div className="tools-dashboard">
      <h1>Tools</h1>
      
      <div className="tools-grid">
        {allTools.map(tool => {
          const accessible = isAccessible(tool.id);
          
          return (
            <div 
              key={tool.id} 
              className={`tool-card ${accessible ? '' : 'locked'}`}
            >
              <div className="tool-card-icon">{tool.icon}</div>
              <h3>{tool.name}</h3>
              
              {!accessible && (
                <div className="tool-locked-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2a5 5 0 0 0-5 5v4H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3h-1V7a5 5 0 0 0-5-5zm3 9V7a3 3 0 0 0-6 0v4h6z"/>
                  </svg>
                  <span className="upgrade-to">{tool.category}</span>
                </div>
              )}
              
              {accessible ? (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => window.location.href = `/tools/${tool.id}`}
                >
                  Open Tool
                </button>
              ) : (
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => window.location.href = '/billing'}
                >
                  Upgrade
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Example: API call with automatic error handling for plan limits
 */
async function makeProtectedAPICall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    // Check for upgrade_required flag
    if (response.status === 403 && data.upgrade_required) {
      // Redirect to billing page
      window.location.href = '/billing?upgrade=' + (data.required_plan || 'professional');
      throw new Error(data.error || 'Plan upgrade required');
    }
    
    // Check for usage limit exceeded
    if (response.status === 429 && data.upgrade_required) {
      // Show modal or redirect to billing
      alert(`${data.error}\n\nUpgrade your plan to continue using this feature.`);
      throw new Error(data.error);
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Export examples for documentation
export {
  AbandonedCheckoutTool,
  ToolsDashboard,
  makeProtectedAPICall
};
