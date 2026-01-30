// Causal Inference & Explainable AI Module
// Explains *why* metrics change, not just that they did. Provides human-readable explanations and confidence scores.
// Phase 1: Simple causal analysis, LLM-based explanations, and confidence estimation.

const { runAIAssistant } = require('./openai');

class CausalExplainableAI {
  async explainChange(metric, before, after, context = {}) {
    // Simple causal analysis: difference, direction, and context
    const delta = after - before;
    let cause = 'unknown';
    if (context.relatedEvents && context.relatedEvents.length) {
      cause = context.relatedEvents.map(e => e.description).join('; ');
    }
    // Use LLM to generate a human explanation
    const prompt = `Metric: ${metric}\nBefore: ${before}\nAfter: ${after}\nChange: ${delta > 0 ? '+' : ''}${delta}\nContext: ${JSON.stringify(context)}\nExplain the likely cause of this change in plain English, and rate your confidence 0-100.`;
    try {
      const aiResult = await runAIAssistant(prompt);
      const text = aiResult.choices?.[0]?.text || '';
      // Parse confidence if present
      const match = text.match(/confidence[\s:]*([0-9]{1,3})/i);
      const confidence = match ? Math.min(100, parseInt(match[1], 10)) : 50;
      return {
        explanation: text.trim(),
        confidence,
        cause,
        delta,
      };
    } catch (e) {
      return {
        explanation: 'Unable to determine cause.',
        confidence: 0,
        cause,
        delta,
      };
    }
  }
}

module.exports = new CausalExplainableAI();
