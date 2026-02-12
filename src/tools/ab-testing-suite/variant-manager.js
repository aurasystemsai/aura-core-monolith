/**
 * A/B Testing Suite - Variant Management System
 * 
 * Handles variant creation, editing, and tracking of changes:
 * - Visual editor support (DOM modifications)
 * - Code editor (HTML/CSS/JS injection)
 * - Redirect variants (split URL testing)
 * - Change tracking and version control
 * - Preview generation
 * 
 * @module variant-manager
 */

// In-memory storage
const variants = new Map();
const changes = new Map();
const previews = new Map();

/**
 * Create a new variant
 */
function createVariant(config) {
  const variant = {
    id: config.id || `variant_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    experimentId: config.experimentId,
    name: config.name,
    description: config.description || '',
    isControl: config.isControl || false,
    trafficWeight: config.trafficWeight || 50,
    changes: [],
    type: config.type || 'dom', // 'dom', 'redirect', 'code'
    redirectUrl: config.redirectUrl || null,
    customCode: config.customCode || null,
    imageUrl: config.imageUrl || null,
    createdAt: new Date().toISOString(),
    createdBy: config.createdBy || 'system',
    metadata: config.metadata || {}
  };
  
  variants.set(variant.id, variant);
  
  return variant;
}

/**
 * Get variant by ID
 */
function getVariant(variantId) {
  return variants.get(variantId);
}

/**
 * Update variant
 */
function updateVariant(variantId, updates) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  Object.assign(variant, updates);
  variant.updatedAt = new Date().toISOString();
  
  return variant;
}

/**
 * Delete variant
 */
function deleteVariant(variantId) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  // Delete associated changes
  variant.changes.forEach(changeId => {
    changes.delete(changeId);
  });
  
  // Delete preview
  previews.delete(variantId);
  
  // Delete variant
  variants.delete(variantId);
  
  return { success: true, deletedVariantId: variantId };
}

/**
 * List variants by experiment ID
 */
function listVariantsByExperiment(experimentId) {
  const allVariants = Array.from(variants.values());
  return allVariants.filter(v => v.experimentId === experimentId);
}

// ============================================================================
// CHANGE MANAGEMENT
// ============================================================================

/**
 * Add a change to a variant
 */
function addChange(variantId, changeConfig) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  const change = {
    id: changeConfig.id || `change_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    variantId,
    type: changeConfig.type, // 'element', 'attribute', 'style', 'insert', 'remove', 'code'
    selector: changeConfig.selector || null,
    action: changeConfig.action || null, // 'modify', 'insert', 'remove', 'replace'
    value: changeConfig.value || null,
    oldValue: changeConfig.oldValue || null,
    position: changeConfig.position || null, // 'before', 'after', 'prepend', 'append'
    createdAt: new Date().toISOString()
  };
  
  changes.set(change.id, change);
  variant.changes.push(change.id);
  variant.updatedAt = new Date().toISOString();
  
  return change;
}

/**
 * Update a change
 */
function updateChange(changeId, updates) {
  const change = changes.get(changeId);
  
  if (!change) {
    throw new Error('Change not found');
  }
  
  Object.assign(change, updates);
  change.updatedAt = new Date().toISOString();
  
  return change;
}

/**
 * Remove a change from a variant
 */
function removeChange(variantId, changeId) {
  const variant = variants.get(variantId);
  const change = changes.get(changeId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  if (!change) {
    throw new Error('Change not found');
  }
  
  // Remove from variant's change list
  variant.changes = variant.changes.filter(id => id !== changeId);
  variant.updatedAt = new Date().toISOString();
  
  // Delete change
  changes.delete(changeId);
  
  return { success: true, deletedChangeId: changeId };
}

/**
 * Get all changes for a variant
 */
function getVariantChanges(variantId) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  return variant.changes.map(changeId => changes.get(changeId)).filter(Boolean);
}

/**
 * Get change by ID
 */
function getChange(changeId) {
  return changes.get(changeId);
}

// ============================================================================
// DOM MANIPULATION CHANGES
// ============================================================================

/**
 * Create element modification change
 */
function modifyElement(variantId, selector, property, value) {
  return addChange(variantId, {
    type: 'element',
    selector,
    action: 'modify',
    value: { property, value }
  });
}

/**
 * Create element style change
 */
function modifyStyle(variantId, selector, cssProperty, cssValue) {
  return addChange(variantId, {
    type: 'style',
    selector,
    action: 'modify',
    value: { property: cssProperty, value: cssValue }
  });
}

/**
 * Create element attribute change
 */
function modifyAttribute(variantId, selector, attribute, value) {
  return addChange(variantId, {
    type: 'attribute',
    selector,
    action: 'modify',
    value: { attribute, value }
  });
}

/**
 * Create element text change
 */
function modifyText(variantId, selector, newText) {
  return addChange(variantId, {
    type: 'element',
    selector,
    action: 'modify',
    value: { property: 'textContent', value: newText }
  });
}

/**
 * Create element HTML change
 */
function modifyHTML(variantId, selector, newHTML) {
  return addChange(variantId, {
    type: 'element',
    selector,
    action: 'modify',
    value: { property: 'innerHTML', value: newHTML }
  });
}

/**
 * Insert new element
 */
function insertElement(variantId, targetSelector, html, position = 'after') {
  return addChange(variantId, {
    type: 'insert',
    selector: targetSelector,
    action: 'insert',
    value: html,
    position
  });
}

/**
 * Remove element
 */
function removeElement(variantId, selector) {
  return addChange(variantId, {
    type: 'remove',
    selector,
    action: 'remove',
    value: null
  });
}

/**
 * Replace element
 */
function replaceElement(variantId, selector, newHTML) {
  return addChange(variantId, {
    type: 'element',
    selector,
    action: 'replace',
    value: newHTML
  });
}

// ============================================================================
// CODE INJECTION
// ============================================================================

/**
 * Add custom JavaScript code
 */
function addJavaScript(variantId, code, position = 'head') {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  if (!variant.customCode) {
    variant.customCode = {
      js: [],
      css: [],
      html: []
    };
  }
  
  variant.customCode.js.push({
    code,
    position, // 'head' or 'body'
    createdAt: new Date().toISOString()
  });
  
  variant.updatedAt = new Date().toISOString();
  
  return variant;
}

/**
 * Add custom CSS code
 */
function addCSS(variantId, css) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  if (!variant.customCode) {
    variant.customCode = {
      js: [],
      css: [],
      html: []
    };
  }
  
  variant.customCode.css.push({
    code: css,
    createdAt: new Date().toISOString()
  });
  
  variant.updatedAt = new Date().toISOString();
  
  return variant;
}

/**
 * Add custom HTML
 */
function addHTML(variantId, html, position = 'body') {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  if (!variant.customCode) {
    variant.customCode = {
      js: [],
      css: [],
      html: []
    };
  }
  
  variant.customCode.html.push({
    code: html,
    position, // 'head' or 'body'
    createdAt: new Date().toISOString()
  });
  
  variant.updatedAt = new Date().toISOString();
  
  return variant;
}

// ============================================================================
// PREVIEW & RENDERING
// ============================================================================

/**
 * Generate preview for variant
 */
function generatePreview(variantId, baseUrl) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  const variantChanges = getVariantChanges(variantId);
  
  // Generate client-side JavaScript to apply changes
  const applyChangesScript = generateApplyChangesScript(variantChanges, variant.customCode);
  
  const preview = {
    variantId,
    baseUrl,
    previewUrl: `${baseUrl}?aura_preview=${variantId}`,
    applyChangesScript,
    generatedAt: new Date().toISOString()
  };
  
  previews.set(variantId, preview);
  
  return preview;
}

/**
 * Generate JavaScript code to apply variant changes
 */
function generateApplyChangesScript(variantChanges, customCode) {
  let script = `
(function() {
  'use strict';
  
  // Wait for DOM to be ready
  function applyChanges() {
    try {
`;
  
  // Add DOM changes
  for (const change of variantChanges) {
    if (change.type === 'element' && change.action === 'modify') {
      const { property, value } = change.value;
      script += `
      // Modify element property
      const elem_${change.id.replace(/[^a-z0-9]/gi, '')} = document.querySelector('${change.selector}');
      if (elem_${change.id.replace(/[^a-z0-9]/gi, '')}) {
        elem_${change.id.replace(/[^a-z0-9]/gi, '')}.${property} = ${JSON.stringify(value)};
      }
`;
    } else if (change.type === 'style') {
      const { property, value } = change.value;
      script += `
      // Modify element style
      const elem_${change.id.replace(/[^a-z0-9]/gi, '')} = document.querySelector('${change.selector}');
      if (elem_${change.id.replace(/[^a-z0-9]/gi, '')}) {
        elem_${change.id.replace(/[^a-z0-9]/gi, '')}.style.${property} = ${JSON.stringify(value)};
      }
`;
    } else if (change.type === 'attribute') {
      const { attribute, value } = change.value;
      script += `
      // Modify element attribute
      const elem_${change.id.replace(/[^a-z0-9]/gi, '')} = document.querySelector('${change.selector}');
      if (elem_${change.id.replace(/[^a-z0-9]/gi, '')}) {
        elem_${change.id.replace(/[^a-z0-9]/gi, '')}.setAttribute(${JSON.stringify(attribute)}, ${JSON.stringify(value)});
      }
`;
    } else if (change.type === 'insert') {
      script += `
      // Insert element
      const target_${change.id.replace(/[^a-z0-9]/gi, '')} = document.querySelector('${change.selector}');
      if (target_${change.id.replace(/[^a-z0-9]/gi, '')}) {
        const temp = document.createElement('div');
        temp.innerHTML = ${JSON.stringify(change.value)};
        const newElem = temp.firstElementChild;
        target_${change.id.replace(/[^a-z0-9]/gi, '')}.insertAdjacentElement('${change.position || 'afterend'}', newElem);
      }
`;
    } else if (change.type === 'remove') {
      script += `
      // Remove element
      const elem_${change.id.replace(/[^a-z0-9]/gi, '')} = document.querySelector('${change.selector}');
      if (elem_${change.id.replace(/[^a-z0-9]/gi, '')}) {
        elem_${change.id.replace(/[^a-z0-9]/gi, '')}.remove();
      }
`;
    } else if (change.type === 'element' && change.action === 'replace') {
      script += `
      // Replace element
      const elem_${change.id.replace(/[^a-z0-9]/gi, '')} = document.querySelector('${change.selector}');
      if (elem_${change.id.replace(/[^a-z0-9]/gi, '')}) {
        const temp = document.createElement('div');
        temp.innerHTML = ${JSON.stringify(change.value)};
        const newElem = temp.firstElementChild;
        elem_${change.id.replace(/[^a-z0-9]/gi, '')}.replaceWith(newElem);
      }
`;
    }
  }
  
  script += `
    } catch (error) {
      console.error('[AURA A/B Test] Error applying changes:', error);
    }
  }
  
  // Apply changes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyChanges);
  } else {
    applyChanges();
  }
`;
  
  // Add custom CSS
  if (customCode?.css && customCode.css.length > 0) {
    script += `
  // Apply custom CSS
  const style = document.createElement('style');
  style.textContent = ${JSON.stringify(customCode.css.map(c => c.code).join('\n'))};
  document.head.appendChild(style);
`;
  }
  
  // Add custom JavaScript
  if (customCode?.js && customCode.js.length > 0) {
    script += `
  // Execute custom JavaScript
  ${customCode.js.map(c => c.code).join('\n')}
`;
  }
  
  script += `
})();
`;
  
  return script;
}

/**
 * Get preview by variant ID
 */
function getPreview(variantId) {
  return previews.get(variantId);
}

// ============================================================================
// VERSION CONTROL
// ============================================================================

/**
 * Create a snapshot of variant for versioning
 */
function createSnapshot(variantId, description = '') {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  const variantChanges = getVariantChanges(variantId);
  
  const snapshot = {
    id: `snapshot_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    variantId,
    description,
    variant: JSON.parse(JSON.stringify(variant)),
    changes: JSON.parse(JSON.stringify(variantChanges)),
    createdAt: new Date().toISOString()
  };
  
  if (!variant.snapshots) {
    variant.snapshots = [];
  }
  
  variant.snapshots.push(snapshot);
  
  return snapshot;
}

/**
 * Restore variant from snapshot
 */
function restoreFromSnapshot(variantId, snapshotId) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  const snapshot = variant.snapshots?.find(s => s.id === snapshotId);
  
  if (!snapshot) {
    throw new Error('Snapshot not found');
  }
  
  // Clear existing changes
  variant.changes.forEach(changeId => {
    changes.delete(changeId);
  });
  
  // Restore variant data (except snapshots and metadata)
  const { snapshots, ...snapshotVariant } = snapshot.variant;
  Object.assign(variant, snapshotVariant);
  variant.changes = [];
  variant.updatedAt = new Date().toISOString();
  
  // Restore changes
  for (const snapshotChange of snapshot.changes) {
    const newChange = { ...snapshotChange };
    newChange.id = `change_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    changes.set(newChange.id, newChange);
    variant.changes.push(newChange.id);
  }
  
  return variant;
}

/**
 * List snapshots for variant
 */
function listSnapshots(variantId) {
  const variant = variants.get(variantId);
  
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  return variant.snapshots || [];
}

// ============================================================================
// DUPLICATE & CLONE
// ============================================================================

/**
 * Duplicate a variant
 */
function duplicateVariant(variantId, newName) {
  const original = variants.get(variantId);
  
  if (!original) {
    throw new Error('Variant not found');
  }
  
  const variantChanges = getVariantChanges(variantId);
  
  // Create new variant
  const newVariant = createVariant({
    experimentId: original.experimentId,
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    isControl: false, // Duplicates are never control
    trafficWeight: original.trafficWeight,
    type: original.type,
    redirectUrl: original.redirectUrl,
    customCode: original.customCode ? JSON.parse(JSON.stringify(original.customCode)) : null,
    imageUrl: original.imageUrl
  });
  
  // Duplicate changes
  for (const change of variantChanges) {
    const newChange = { ...change };
    delete newChange.id;
    newChange.variantId = newVariant.id;
    addChange(newVariant.id, newChange);
  }
  
  return newVariant;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate variant configuration
 */
function validateVariant(variant) {
  const errors = [];
  
  if (!variant.name || variant.name.trim() === '') {
    errors.push('Variant name is required');
  }
  
  if (variant.trafficWeight < 0 || variant.trafficWeight > 100) {
    errors.push('Traffic weight must be between 0 and 100');
  }
  
  if (variant.type === 'redirect' && !variant.redirectUrl) {
    errors.push('Redirect URL is required for redirect variants');
  }
  
  if (variant.changes && variant.changes.length > 100) {
    errors.push('Maximum 100 changes allowed per variant');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate change configuration
 */
function validateChange(change) {
  const errors = [];
  
  if (!change.type) {
    errors.push('Change type is required');
  }
  
  if (['element', 'style', 'attribute', 'insert', 'remove'].includes(change.type) && !change.selector) {
    errors.push('CSS selector is required for this change type');
  }
  
  if (!change.action) {
    errors.push('Change action is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  // Variant management
  createVariant,
  getVariant,
  updateVariant,
  deleteVariant,
  listVariantsByExperiment,
  duplicateVariant,
  
  // Change management
  addChange,
  getChange,
  updateChange,
  removeChange,
  getVariantChanges,
  
  // DOM manipulation helpers
  modifyElement,
  modifyStyle,
  modifyAttribute,
  modifyText,
  modifyHTML,
  insertElement,
  removeElement,
  replaceElement,
  
  // Code injection
  addJavaScript,
  addCSS,
  addHTML,
  
  // Preview & rendering
  generatePreview,
  getPreview,
  generateApplyChangesScript,
  
  // Version control
  createSnapshot,
  restoreFromSnapshot,
  listSnapshots,
  
  // Validation
  validateVariant,
  validateChange,
  
  // Storage (for testing)
  variants,
  changes,
  previews
};
