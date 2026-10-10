import React from "react";
import useCosts from "./useCosts";

// Shows what an AI action will cost, e.g. "2 credits", next to the button that runs it.
// `model` applies the model multiplier; `times` multiplies for bulk runs. Renders nothing until prices load.
export default function CostBadge({ action, model, times = 1, style }) {
  const data = useCosts();
  if (!data || data.costs[action] == null) return null;
  const mult = (model && data.multipliers[model]) || 1;
  const total = Math.max(1, Math.round(data.costs[action] * mult * times));
  return (
    <span
      title="Credits are only taken after the AI finishes successfully."
      style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#4338ca", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 999, padding: "2px 8px", marginLeft: 8, whiteSpace: "nowrap", ...style }}
    >
      {total} {total === 1 ? "credit" : "credits"}{times > 1 ? ` for ${times}` : ""}
    </span>
  );
}
