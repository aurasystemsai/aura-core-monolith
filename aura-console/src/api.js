// src/api.js
// Global API utility for CSRF and credentials handling

let csrfToken = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function apiFetch(url, options = {}) {
  // Always send credentials
  options.credentials = 'include';
  options.headers = options.headers || {};

  // For unsafe methods, attach CSRF token
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await getCsrfToken();
    options.headers['x-csrf-token'] = token;
    // Also support legacy header
    options.headers['csrf-token'] = token;
  }

  return fetch(url, options);
}

export function resetCsrfToken() {
  csrfToken = null;
}
