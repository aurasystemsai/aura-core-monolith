/**
 * useCredits — global credit balance hook
 * Fetches once on mount, refreshes every 60 s, and exposes a manual refresh() fn.
 * Also stores the balance on window.__AURA_CREDITS so tool components can read it
 * without needing React context.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetchJSON } from '../api';

// Mirror of backend ACTION_COSTS (creditLedger.js) — used by buttons to show costs
export const ACTION_COSTS = {
  'seo-scan':             1,
  'seo-analysis':         1,
  'alt-text':             1,
  'image-alt':            1,
  'blog-draft':           3,
  'blog-outline':         2,
  'content-brief':        2,
  'email-gen':            2,
  'email-template':       2,
  'social-post':          1,
  'social-schedule':      1,
  'link-suggestion':      1,
  'internal-link':        1,
  'competitive-report':   5,
  'competitive-analysis': 5,
  'support-reply':        1,
  'ai-support':           1,
  'product-description':  2,
  'schema-gen':           1,
  'keyword-research':     2,
  'rank-check':           1,
  'churn-predict':        2,
  'pricing-optimize':     2,
  'ad-copy':              2,
  'campaign-gen':         3,
  'analytics-insight':    2,
  'segmentation':         2,
  'personalization':      2,
  'fix-queue-item':       1,
  'generic-ai':           1,
};

const REFRESH_INTERVAL_MS = 60_000;

// Module-level singleton so every hook instance shares the same state
let _balance = null;
let _unlimited = false;
let _loading = true;
let _listeners = [];

function notify() { _listeners.forEach(fn => fn({ balance: _balance, unlimited: _unlimited, loading: _loading })); }

async function fetchBalance() {
  try {
    const data = await apiFetchJSON('/api/billing/credits');
    if (data?.ok) {
      _balance   = data.unlimited ? Infinity : (data.balance ?? 0);
      _unlimited = data.unlimited || false;
      _loading   = false;
      if (typeof window !== 'undefined') {
        window.__AURA_CREDITS = { balance: _balance, unlimited: _unlimited };
      }
      notify();
    }
  } catch (_) { /* silent — balance stays stale */ }
}

// Kick off the first fetch + interval (once per page load)
let _intervalStarted = false;
function ensurePolling() {
  if (_intervalStarted) return;
  _intervalStarted = true;
  fetchBalance();
  setInterval(fetchBalance, REFRESH_INTERVAL_MS);
}

export function useCredits() {
  const [state, setState] = useState({ balance: _balance, unlimited: _unlimited, loading: _loading });
  const stateRef = useRef(state);

  useEffect(() => {
    ensurePolling();
    const handler = (next) => { stateRef.current = next; setState(next); };
    _listeners.push(handler);
    // If balance already loaded, give it immediately
    if (_balance !== null) setState({ balance: _balance, unlimited: _unlimited, loading: false });
    return () => { _listeners = _listeners.filter(fn => fn !== handler); };
  }, []);

  const refresh = useCallback(() => fetchBalance(), []);

  return { ...state, refresh };
}
