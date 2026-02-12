// Pricing evaluation pipeline (stub) with guardrails and rounding
const db = require('./db');

const ROUNDING = {
  NONE: 'none',
  ENDING_99: 'ending-99',
  ENDING_95: 'ending-95',
  STEP: 'step'
};

const DEFAULTS = {
  rounding: ROUNDING.ENDING_99,
  step: 0.05,
  guardrails: { floor: null, ceiling: null, map: null, minMargin: null }
};

const applyRounding = (price, strategy = ROUNDING.ENDING_99, step = DEFAULTS.step) => {
  if (!price || Number.isNaN(price)) return { price: 0, strategy: ROUNDING.NONE };
  if (strategy === ROUNDING.NONE) return { price, strategy };

  if (strategy === ROUNDING.ENDING_99) {
    // Round down to nearest .99
    const wholePart = Math.floor(price);
    const rounded = price >= wholePart + 0.99 ? wholePart + 0.99 : (wholePart - 1) + 0.99;
    return { price: rounded, strategy };
  }

  if (strategy === ROUNDING.ENDING_95) {
    // Round down to nearest .95
    const wholePart = Math.floor(price);
    const rounded = price >= wholePart + 0.95 ? wholePart + 0.95 : (wholePart - 1) + 0.95;
    return { price: rounded, strategy };
  }

  if (strategy === ROUNDING.STEP) {
    const rounded = Math.round(price / step) * step;
    return { price: rounded, strategy, step };
  }

  return { price, strategy: ROUNDING.NONE };
};

const applyGuardrails = (price, guardrails = {}, cost) => {
  const hits = [];
  let nextPrice = price;

  if (guardrails.floor != null && price < guardrails.floor) {
    nextPrice = guardrails.floor;
    hits.push({ type: 'floor', value: guardrails.floor });
  }

  if (guardrails.ceiling != null && nextPrice > guardrails.ceiling) {
    nextPrice = guardrails.ceiling;
    hits.push({ type: 'ceiling', value: guardrails.ceiling });
  }

  if (guardrails.map != null && nextPrice < guardrails.map) {
    nextPrice = guardrails.map;
    hits.push({ type: 'map', value: guardrails.map });
  }

  if (guardrails.minMargin != null && cost != null) {
    const margin = (nextPrice - cost) / (cost || 1);
    if (margin < guardrails.minMargin) {
      const target = cost * (1 + guardrails.minMargin);
      nextPrice = Math.max(nextPrice, target);
      hits.push({ type: 'minMargin', value: guardrails.minMargin, enforcedPrice: nextPrice });
    }
  }

  return { price: nextPrice, hits };
};

const applyRuleActions = (price, rule) => {
  const actions = Array.isArray(rule.actions) ? rule.actions : [rule.action || rule.actions].filter(Boolean);
  let nextPrice = price;
  const applied = [];

  actions.forEach((action) => {
    if (!action || !action.type) return;
    switch (action.type) {
      case 'set-price':
        nextPrice = Number(action.value || nextPrice);
        applied.push({ id: rule.id, name: rule.name, type: action.type, value: action.value });
        break;
      case 'discount-percent':
        nextPrice = nextPrice * (1 - Number(action.value || 0) / 100);
        applied.push({ id: rule.id, name: rule.name, type: action.type, value: action.value });
        break;
      case 'discount-amount':
        nextPrice = nextPrice - Number(action.value || 0);
        applied.push({ id: rule.id, name: rule.name, type: action.type, value: action.value });
        break;
      case 'surcharge-percent':
        nextPrice = nextPrice * (1 + Number(action.value || 0) / 100);
        applied.push({ id: rule.id, name: rule.name, type: action.type, value: action.value });
        break;
      case 'surcharge-amount':
        nextPrice = nextPrice + Number(action.value || 0);
        applied.push({ id: rule.id, name: rule.name, type: action.type, value: action.value });
        break;
      default:
        applied.push({ id: rule.id, name: rule.name, type: 'unknown', value: action.value });
    }
  });

  return { price: nextPrice, applied };
};

const evaluatePrice = (payload = {}) => {
  const requestId = payload.requestId || `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const basePrice = Number(payload.basePrice || payload.signals?.basePrice || 0);
  const cost = payload.cost ?? payload.signals?.cost;
  const currency = payload.currency || 'USD';
  const rounding = payload.rounding || DEFAULTS.rounding;
  const step = payload.step || payload.roundingStep || DEFAULTS.step;
  const guardrails = { ...DEFAULTS.guardrails, ...(payload.guardrails || {}) };
  const rules = Array.isArray(payload.rules) && payload.rules.length ? payload.rules : db.list();
  
  // Extract context for scope matching
  const context = {
    productId: payload.productId,
    category: payload.category,
    segment: payload.segment
  };

  // Filter and sort rules by priority desc then id asc
  const activeRules = rules
    .filter(r => {
      if (!r || r.status === 'draft') return false;
      
      // Check scope matching
      if (r.scope === 'global') return true;
      if (r.scope === 'product' && r.scopeValue === context.productId) return true;
      if (r.scope === 'category' && r.scopeValue === context.category) return true;
      if (r.scope === 'segment' && r.scopeValue === context.segment) return true;
      
      return false;
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.id || 0) - (b.id || 0));

  let currentPrice = basePrice;
  const appliedRules = [];

  activeRules.forEach((rule) => {
    const { price: nextPrice, applied } = applyRuleActions(currentPrice, rule);
    if (applied.length) {
      currentPrice = nextPrice;
      appliedRules.push(...applied);
    }
  });

  // Apply rounding BEFORE guardrails so guardrails have final say
  const roundedResult = applyRounding(currentPrice, rounding, step);
  const guardrailResult = applyGuardrails(roundedResult.price, guardrails, cost);

  return {
    requestId,
    currency,
    price: Number(guardrailResult.price.toFixed(2)),
    diagnostics: {
      basePrice,
      cost,
      appliedRules,
      guardrailHits: guardrailResult.hits,
      rounding: roundedResult,
      guardrails,
      rulesEvaluated: activeRules.length
    }
  };
};

module.exports = {
  evaluatePrice,
  ROUNDING,
  DEFAULTS
};
