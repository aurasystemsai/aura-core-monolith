// src/tools/abandoned-checkout-winback/bandit.js
// Simple multi-armed bandit optimizer for winback variants
const variantStats = {};

function recordResult(variantId, reward) {
  if (!variantStats[variantId]) variantStats[variantId] = { n: 0, sum: 0 };
  variantStats[variantId].n += 1;
  variantStats[variantId].sum += reward;
}

function selectVariant(variantIds) {
  // Epsilon-greedy for demo
  const epsilon = 0.1;
  if (Math.random() < epsilon) return variantIds[Math.floor(Math.random() * variantIds.length)];
  let best = variantIds[0], bestAvg = -Infinity;
  for (const id of variantIds) {
    const stats = variantStats[id] || { n: 0, sum: 0 };
    const avg = stats.n ? stats.sum / stats.n : 0;
    if (avg > bestAvg) { best = id; bestAvg = avg; }
  }
  return best;
}

module.exports = { recordResult, selectVariant };