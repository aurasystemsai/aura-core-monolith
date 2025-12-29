import React from "react";

export default function ReportExportBar({ onExportCSV, onExportPDF, onScheduleEmail }) {
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      marginBottom: 24,
      marginTop: 8,
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <button onClick={onExportCSV} style={btnStyle} title="Export as CSV">Export CSV</button>
      <button onClick={onExportPDF} style={btnStyle} title="Export as PDF">Export PDF</button>
      <button onClick={onScheduleEmail} style={btnStyle} title="Schedule Email Summary">Schedule Email</button>
    </div>
  );
}

const btnStyle = {
  background: '#23263a',
  color: '#7fffd4',
  border: '1.5px solid #7fffd4',
  borderRadius: 8,
  padding: '10px 22px',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: '0 2px 12px #22d3ee33',
  transition: 'background 0.18s, color 0.18s',
};
