import React from "react";
export default function AuraAPISDK() {
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #0001", padding: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Aura API SDK</h2>
      <p style={{ color: "#444", marginBottom: 18 }}>
        Access and test the Aura API endpoints. Use the docs below for integration details.
      </p>
      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 24, marginTop: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>API Documentation:</div>
        <pre style={{ fontSize: 15, color: "#23263a" }}>
{`POST /api/aura-api-sdk/docs
GET /api/aura-api-sdk/i18n`}
        </pre>
      </div>
    </div>
  );
}
