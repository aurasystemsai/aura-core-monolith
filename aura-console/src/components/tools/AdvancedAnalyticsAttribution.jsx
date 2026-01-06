  // ...existing code...
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ query, result: data.result }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import/export handlers
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const importedHistory = JSON.parse(evt.target.result);
        setHistory(importedHistory);
        setImported(file.name);
      } catch (err) {
        setError("Invalid file format");
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history)], { type: "application/json" });
    setExported(URL.createObjectURL(blob));
  };
  const handleFeedback = () => {
    setFeedback("");
    // Could POST feedback to backend here
  };

  const onboardingContent = (
    <div className="aura-card" style={{ padding: 16, marginBottom: 18 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>How to use Advanced Analytics Attribution:</div>
      <ol style={{ margin: 0, paddingLeft: 18 }}>
        <li>Describe your analytics or attribution question in the input box.</li>
        <li>Click Analyze to get actionable insights and channel breakdowns.</li>
        <li>Review results, export history, and send feedback for improvements.</li>
      </ol>
    </div>
  );

  return (
    <div className="aura-card" style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: "var(--text-primary)" }}>Advanced Analytics Attribution</h2>
      </div>
      <div style={{ marginBottom: 10, color: "var(--text-accent)", fontWeight: 600 }}>
        <span role="img" aria-label="chart">📊</span> Analyze attribution and performance across all channels.
      </div>
      <button onClick={() => setShowOnboarding(v => !v)} className="aura-btn" style={{ marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}

      {/* Query Input */}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        type="text"
        className="aura-input"
        style={{ width: "100%", marginBottom: 18 }}
        placeholder="Describe your analytics or attribution question..."
        aria-label="Analytics query input"
      />
      <button onClick={handleAnalyze} disabled={loading || !query} className="aura-btn" style={{ marginBottom: 18 }}>{loading ? "Analyzing..." : "Analyze"}</button>
      {error && <div style={{ color: "var(--button-danger-bg)", marginBottom: 10 }}>{error}</div>}

      {/* Result Visualization */}
      {result && (
        <div className="aura-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Analysis Result:</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* Import/Export */}
      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} className="aura-btn" style={{ marginRight: 12 }}>Import History</button>
        <button onClick={handleExport} className="aura-btn">Export History</button>
        {imported && <span style={{ marginLeft: 12, color: 'var(--text-accent)' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="analytics-history.json" style={{ marginLeft: 12, color: 'var(--text-accent)', textDecoration: 'underline' }}>Download Export</a>}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="aura-card" style={{ marginTop: 24, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analysis History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Query:</b> {h.query}</div>
                <div><b>Result:</b> {JSON.stringify(h.result).slice(0, 120)}{JSON.stringify(h.result).length > 120 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} className="aura-card" style={{ marginTop: 32, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          className="aura-input"
          style={{ width: '100%', marginBottom: 12 }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" className="aura-btn">Send Feedback</button>
        {error && <div style={{ color: 'var(--button-danger-bg)', marginTop: 8 }}>{error}</div>}
      </form>

      {/* Accessibility & Compliance */}
      <div style={{ marginTop: 32, fontSize: 13, color: 'var(--text-accent)', textAlign: "center" }}>
        <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: 'var(--text-accent)', textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
