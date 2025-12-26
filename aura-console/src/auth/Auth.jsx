
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
    // Simulate backend call
    setTimeout(() => {
      if (!state.email || !state.password) {
        setState(s => ({ ...s, loading: false, error: 'Email and password required.' }));
        return;
      }
      if (state.mode === 'login') {
        // Simulate login success/failure
        if (state.email === 'demo@aura.com' && state.password === 'demo123') {
          setState(s => ({ ...s, loading: false, error: '', email: '', password: '' }));
          alert('Login successful!');
        } else {
          setState(s => ({ ...s, loading: false, error: 'Invalid credentials.' }));
        }
      } else {
        // Simulate signup
        setState(s => ({ ...s, loading: false, error: '', email: '', password: '' }));
        alert('Signup successful!');
      }
    }, 1200);
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
      <div className="aura-auth-demo">Demo login: demo@aura.com / demo123</div>
    </div>
  );
};

export default Auth;
