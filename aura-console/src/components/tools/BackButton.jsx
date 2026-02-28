import React from "react";

export default function BackButton({ style = {}, label = "← Go Back", onClick }) {
  const handleClick = () => {
    if (typeof onClick === "function") {
      onClick();
      return;
    }
    // Always prefer section history — goes back to wherever the user actually came from
    if (typeof window !== "undefined" && typeof window.__AURA_SECTION_BACK === 'function') {
      window.__AURA_SECTION_BACK();
      return;
    }
    // Fallback: go to main suite
    if (typeof window !== "undefined" && typeof window.__AURA_TO_SUITE === 'function') {
      window.__AURA_TO_SUITE();
      return;
    }
    if (typeof window !== "undefined" && window.history?.back) {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: "#18181b",
        color: "#a5f3fc",
        border: "none",
        borderRadius: 8,
        padding: "7px 18px",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
        marginBottom: 18,
        ...style,
      }}
    >
      {label}
    </button>
  );
}

