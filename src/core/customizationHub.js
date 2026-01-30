// Hyper-customization: widget marketplace and no-code automation hub
// Manages widgets, user installations, and simple automation recipes

const { v4: uuidv4 } = require('uuid');

class CustomizationHub {
  constructor() {
    this.widgets = new Map(); // widgetId -> definition
    this.installs = new Map(); // userId -> [{ widgetId, settings }]
    this.recipes = new Map(); // recipeId -> { steps }
  }

  registerWidget(widgetId, definition) {
    this.widgets.set(widgetId, { widgetId, ...definition });
    return this.widgets.get(widgetId);
  }

  listWidgets() {
    return Array.from(this.widgets.values());
  }

  installWidget(userId, widgetId, settings = {}) {
    if (!this.widgets.has(widgetId)) return { ok: false, error: 'unknown widget' };
    if (!this.installs.has(userId)) this.installs.set(userId, []);
    const install = { id: uuidv4(), widgetId, settings, installedAt: Date.now() };
    this.installs.get(userId).push(install);
    return { ok: true, install };
  }

  listInstalls(userId) {
    return this.installs.get(userId) || [];
  }

  registerRecipe(name, steps = []) {
    const id = uuidv4();
    const recipe = { id, name, steps, createdAt: Date.now() };
    this.recipes.set(id, recipe);
    return recipe;
  }

  listRecipes() {
    return Array.from(this.recipes.values());
  }

  runRecipe(id, payload = {}) {
    const recipe = this.recipes.get(id);
    if (!recipe) return { ok: false, error: 'recipe not found' };
    // No-code style: apply steps sequentially to payload
    let state = { ...payload };
    for (const step of recipe.steps) {
      const { op, field, value, factor } = step;
      if (op === 'set') state[field] = value;
      if (op === 'multiply') state[field] = (state[field] || 0) * (factor || 1);
      if (op === 'increment') state[field] = (state[field] || 0) + (value || 0);
    }
    return { ok: true, result: state };
  }

  reset() {
    this.widgets.clear();
    this.installs.clear();
    this.recipes.clear();
  }
}

module.exports = new CustomizationHub();
