import { useEffect, useState } from 'react';

// Simple pub/sub for global API errors without mutating during render
let globalApiError = '';
let listeners = [];

const subscribe = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};

export function useGlobalApiError() {
  const [error, setError] = useState(globalApiError);

  useEffect(() => subscribe(setError), []);

  return [error, setError];
}

export function setApiError(err) {
  globalApiError = err;
  listeners.forEach((fn) => fn(err));
}
