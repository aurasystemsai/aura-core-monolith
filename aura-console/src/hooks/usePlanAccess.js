// Hook for checking plan-based access control
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * Hook to check if user has access to a tool or feature
 * @param {string} toolId - Tool ID to check access for
 * @param {string} featureId - Feature ID to check access for
 * @returns {object} - { hasAccess, plan, loading, error, checkAccess, accessibleTools, planFeatures }
 */
export function usePlanAccess(toolId = null, featureId = null) {
  const [state, setState] = useState({
    hasAccess: true, // Default to true to avoid blocking on error
    plan: 'free',
    loading: true,
    error: null,
    accessibleTools: [],
    planFeatures: null
  });

  const checkAccess = useCallback(async (tool = toolId, feature = featureId) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const params = new URLSearchParams();
      if (tool) params.set('tool', tool);
      if (feature) params.set('feature', feature);
      
      const response = await api.get(`/api/access/check?${params.toString()}`);
      
      setState({
        hasAccess: response.has_access,
        plan: response.plan,
        loading: false,
        error: null,
        accessibleTools: response.accessible_tools || [],
        planFeatures: response.features || null,
        message: response.message || null
      });
      
      return response.has_access;
    } catch (error) {
      console.error('Plan access check error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        hasAccess: true // Fail open - don't block users on error
      }));
      return true;
    }
  }, [toolId, featureId]);

  useEffect(() => {
    if (toolId || featureId) {
      checkAccess();
    } else {
      // Just get plan info without specific access check
      checkAccess(null, null);
    }
  }, [toolId, featureId, checkAccess]);

  return {
    ...state,
    checkAccess,
    refresh: checkAccess
  };
}

/**
 * Hook to get all plan features and limits
 */
export function usePlanFeatures() {
  const { planFeatures, plan, loading, error } = usePlanAccess();
  
  return {
    features: planFeatures,
    plan,
    loading,
    error,
    aiRunsLimit: planFeatures?.ai_runs_limit || 100,
    productsLimit: planFeatures?.products_limit || 50,
    teamMembers: planFeatures?.team_members || 1,
    tools: planFeatures?.tools || [],
    hasUnlimited: (key) => planFeatures?.[`${key}_limit`] === -1,
  };
}

/**
 * Hook to check if user can access a specific tool
 * @param {string} toolId - Tool ID to check
 */
export function useToolAccess(toolId) {
  const { hasAccess, plan, loading, message } = usePlanAccess(toolId);
  
  return {
    canAccess: hasAccess,
    plan,
    loading,
    upgradeMessage: message,
    isLocked: !hasAccess
  };
}

/**
 * Hook to check usage limits
 */
export function useUsageLimits() {
  const [usage, setUsage] = useState({
    ai_runs: 0,
    products: 0,
    loading: true,
    error: null
  });
  
  const { planFeatures, plan } = usePlanFeatures();

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await api.get('/api/billing/usage');
        setUsage(prev => ({
          ...prev,
          ai_runs: response.stats?.ai_runs || 0,
          products: response.stats?.products || 0,
          loading: false,
          error: null
        }));
      } catch (error) {
        console.error('Usage fetch error:', error);
        setUsage(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };
    
    fetchUsage();
    // Refresh every minute
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, []);

  const getUsagePercent = (limitType) => {
    const limit = planFeatures?.[`${limitType}_limit`];
    if (limit === -1) return 0; // Unlimited
    if (!limit) return 0;
    const current = usage[limitType] || 0;
    return Math.min(100, (current / limit) * 100);
  };

  const isLimitReached = (limitType) => {
    const limit = planFeatures?.[`${limitType}_limit`];
    if (limit === -1) return false; // Unlimited
    if (!limit) return false;
    const current = usage[limitType] || 0;
    return current >= limit;
  };

  return {
    usage,
    limits: {
      ai_runs: planFeatures?.ai_runs_limit || 100,
      products: planFeatures?.products_limit || 50
    },
    getUsagePercent,
    isLimitReached,
    plan,
    loading: usage.loading || !planFeatures,
    error: usage.error
  };
}

export default usePlanAccess;
