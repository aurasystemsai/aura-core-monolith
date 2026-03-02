import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production this could send to an error-reporting service
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;
      return (
        <div style={{
          minHeight: "60vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#09090b", color: "#fafafa",
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: 40,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 14, color: "#71717a", marginBottom: 24, textAlign: "center", maxWidth: 420 }}>
            An unexpected error occurred in this tool. Try refreshing the page. If the problem persists, contact support.
          </div>
          <div style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, padding: "14px 18px", maxWidth: 560, width: "100%", marginBottom: 20 }}>
            <pre style={{ fontSize: 12, color: "#f87171", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          <button
            style={{ padding: "10px 28px", borderRadius: 8, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
          >
            Reload tool
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
