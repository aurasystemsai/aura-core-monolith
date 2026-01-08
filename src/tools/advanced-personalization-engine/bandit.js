// src/tools/advanced-personalization-engine/bandit.js
// Simple multi-armed bandit optimizer for personalization variants
const variantStats = {};

function recordResult(variantId, reward) {
  if (!variantStats[variantId]) variantStats[variantId] = { n: 0, sum: 0 };
  variantStats[variantId].n += 1;
  variantStats[variantId].sum += reward;
}

function selectVariant(variantIds) {
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