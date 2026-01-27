import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ style = {}, label = "← Go Back" }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        background: "#22223b",
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
