
import React, { useState } from 'react';
import './Auth.css';

const initialState = {
  mode: 'login', // or 'signup'
  email: '',
  password: '',
  error: '',
  loading: false,
};

const Auth = () => {
  const [state, setState] = useState(initialState);

  const handleChange = e => {
    setState(s => ({ ...s, [e.target.name]: e.target.value, error: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setState(s => ({ ...s, loading: true, error: '' }));
    // TODO: Replace with real backend authentication API call
    // Example using fetch (uncomment and implement your real endpoint):
    /*
    try {
      const res = await fetch('/api/auth/' + state.mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, password: state.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');
      // Handle successful login/signup (e.g., redirect, set session, etc.)
      setState(s => ({ ...s, loading: false, error: '', email: '', password: '' }));
      // window.location.href = '/';
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
    */
    setState(s => ({ ...s, loading: false, error: 'Live authentication required. Please connect to backend.' }));
  };

  const switchMode = () => {
    setState(s => ({ ...initialState, mode: s.mode === 'login' ? 'signup' : 'login' }));
  };

  return (
    <div className="aura-auth-shell">
      <h2 className="aura-auth-title">{state.mode === 'login' ? 'Login to Aura Console' : 'Create your Aura Account'}</h2>
      <form className="aura-auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={state.email}
          onChange={handleChange}
          className="aura-auth-input"
          autoComplete="email"
          disabled={state.loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={state.password}
          onChange={handleChange}
          className="aura-auth-input"
          autoComplete={state.mode === 'login' ? 'current-password' : 'new-password'}
          disabled={state.loading}
        />
        {state.error && <div className="aura-auth-error">{state.error}</div>}
        <button type="submit" className="aura-auth-btn" disabled={state.loading}>
          {state.loading ? (state.mode === 'login' ? 'Logging in…' : 'Signing up…') : (state.mode === 'login' ? 'Login' : 'Sign Up')}
        </button>
      </form>
      <div className="aura-auth-switch">
        {state.mode === 'login' ? (
          <>
            <span>Don&apos;t have an account?</span>
            <button className="aura-auth-link" onClick={switchMode} disabled={state.loading}>Sign Up</button>
          </>
        ) : (
          <>
            <span>Already have an account?</span>
            <button className="aura-auth-link" onClick={switchMode} disabled={state.loading}>Login</button>
          </>
        )}
      </div>
      {/* No demo login available. Live authentication only. */}
    </div>
  );
};

export default Auth;
