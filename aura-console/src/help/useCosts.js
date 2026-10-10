import { useEffect, useState } from "react";
import { apiFetchJSON } from "../api";

let cache = null;
let pending = null;

function load() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = apiFetchJSON("/api/billing/credit-costs")
      .then((r) => { if (r.ok && r.costs) cache = { costs: r.costs, multipliers: r.modelMultipliers || {} }; return cache; })
      .catch(() => null)
      .finally(() => { pending = null; });
  }
  return pending;
}

// Credit price table, fetched once and shared by every badge on the page.
export default function useCosts() {
  const [data, setData] = useState(cache);
  useEffect(() => {
    let live = true;
    if (!cache) load().then((d) => { if (live && d) setData(d); });
    return () => { live = false; };
  }, []);
  return data;
}
