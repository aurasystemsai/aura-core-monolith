import { useEffect, useState } from 'react';

// Simple pub/sub for credit errors — same pattern as globalApiError.js
// Fires when the API returns 402 + credit_error: true
let creditErr = null;
let listeners = [];

const subscribe = (fn) => {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
};

export function useCreditError() {
  const [err, setErr] = useState(creditErr);
  useEffect(() => subscribe(setErr), []);
  const dismiss = () => {
    creditErr = null;
    listeners.forEach((fn) => fn(null));
  };
  return [err, dismiss];
}

export function setCreditError(data) {
  creditErr = data;
  listeners.forEach((fn) => fn(data));
}
