import React, { useState } from 'react';

export default function AiChatbot({ coreUrl }) {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  // Removed broken CSRF token fetch

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    try {
      const res = await fetch(`${coreUrl}/api/ai/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
          'csrf-token': csrfToken
        },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: '#111111', borderRadius: 12, padding: 24 }}>
      <h2 style={{ color: '#7fffd4' }}>AI Chatbot</h2>
      <div style={{ minHeight: 200, background: 'var(--background-tertiary)', borderRadius: 8, padding: 12, marginBottom: 16, color: 'var(--text-primary)', fontSize: 15 }}>
        {messages.slice(1).map((m, i) => (
          <div key={i} style={{ margin: '8px 0', color: m.role === 'user' ? 'var(--text-accent)' : 'var(--text-primary)' }}>
            <b>{m.role === 'user' ? 'You' : 'AI'}:</b> {m.content}
          </div>
        ))}
        {loading && <div style={{ color: '#7fffd4' }}>AI is typing…</div>}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message…"
          style={{ flex: 1, padding: 10, borderRadius: 6, border: 0 }}
          disabled={loading}
        />
        <button type="submit" style={{ background: '#7fffd4', color: '#111111', fontWeight: 700, border: 0, borderRadius: 6, padding: '0 18px' }} disabled={loading}>
          Send
        </button>
      </form>
      {error && <div style={{ color: 'salmon', marginTop: 12 }}>{error}</div>}
    </div>
  );
}

