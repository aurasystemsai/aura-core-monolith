import { useState } from 'react';

// Global error state for API errors
let globalApiError = '';
let setGlobalApiError = () => {};

export function useGlobalApiError() {
  const [error, setError] = useState(globalApiError);
  setGlobalApiError = setError;
  return [error, setError];
}

export function setApiError(err) {
  globalApiError = err;
  setGlobalApiError(err);
}
