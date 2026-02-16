const crypto = require('crypto');

// ============================================================================
// DATA STORES
// ============================================================================

const outlines = new Map();
const versions = new Map();
const templates = new Map();
const outlineComments = new Map();
const structureAnalyses = new Map();
const sectionLibrary = new Map();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function calculateReadability(text) {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
  
  let grade = 'College';
  if (avgWordsPerSentence < 15) grade = 'Easy';
  else if (avgWordsPerSentence < 20) grade = 'Medium';
  else if (avgWordsPerSentence < 25) grade = 'Advanced';
  
  return { avgWordsPerSentence, grade };
}

// ============================================================================
// OUTLINE MANAGEMENT
// ============================================================================

function generateOutline(data = {}) {
  const outlineId = data.outlineId || generateId('outline');
  const sections =
    data.sections ||
    [
      { id: generateId('sec'), heading: 'Problem', subheadings: [], notes: 'State the core challenge', wordCount: 120, order: 1, depth: 1 },
      { id: generateId('sec'), heading: 'Solution', subheadings: [], notes: 'Explain how we solve it', wordCount: 240, order: 2, depth: 1 },
      { id: generateId('sec'), heading: 'Proof', subheadings: [], notes: 'Add data, quotes, and visuals', wordCount: 200, order: 3, depth: 1 },
      { id: generateId('sec'), heading: 'CTA', subheadings: [], notes: 'One primary CTA', wordCount: 80, order: 4, depth: 1 },
    ];

  const outline = {
    outlineId,
    briefId: data.briefId || null,
    topic: data.topic || 'Untitled outline',
    sections,
    wordCount: sections.reduce((acc, s) => acc + (s.wordCount || 0), 0),
    persona: data.persona || 'Demand Gen Manager',
    tone: data.tone || 'Confident',
    purpose: data.purpose || 'educate',
    targetAudience: data.targetAudience || 'B2B decision makers',
    framework: data.framework || null,
    status: data.status || 'draft',
    assignedTo: data.assignedTo || null,
    priority: data.priority || 'medium',
    tags: data.tags || [],
    metadata: data.metadata || {},
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  outlines.set(outlineId, outline);
  versions.set(outlineId, [{ versionId: generateId('v1'), ...outline, timestamp: Date.now() }]);

  return outline;
}

function getOutline(outlineId) {
  if (!outlines.has(outlineId)) {
    throw new Error('Outline not found');
  }
  return outlines.get(outlineId);
}

function updateOutline(outlineId, updates = {}) {
  const current = getOutline(outlineId);
  const merged = {
    ...current,
    ...updates,
    sections: updates.sections || current.sections,
    updatedAt: new Date().toISOString(),
  };
  merged.wordCount = merged.sections.reduce((acc, s) => acc + (s.wordCount || 0), 0);
  outlines.set(outlineId, merged);
  
  // Auto-version on significant changes
  if (updates.sections) {
    versionOutline(outlineId, 'Auto-save');
  }
  
  return merged;
}

function deleteOutline(outlineId) {
  if (!outlines.has(outlineId)) {
    throw new Error('Outline not found');
  }
  
  outlines.delete(outlineId);
  versions.delete(outlineId);
  outlineComments.delete(outlineId);
  
  return { success: true, message: 'Outline deleted' };
}

function listOutlines(filters = {}) {
  let results = Array.from(outlines.values());
  
  if (filters.status) {
    results = results.filter(o => o.status === filters.status);
  }
  
  if (filters.assignedTo) {
    results = results.filter(o => o.assignedTo === filters.assignedTo);
  }
  
  if (filters.framework) {
    results = results.filter(o => o.framework === filters.framework);
  }
  
  if (filters.minScore) {
    results = results.filter(o => scoreOutline(o).score >= filters.minScore);
  }
  
  if (filters.tag) {
    results = results.filter(o => o.tags && o.tags.includes(filters.tag));
  }
  
  return results;
}

// ============================================================================
// SECTION MANAGEMENT
// ============================================================================

function addSection(outlineId, sectionData) {
  const outline = getOutline(outlineId);
  
  const newSection = {
    id: generateId('sec'),
    heading: sectionData.heading || 'New Section',
    subheadings: sectionData.subheadings || [],
    notes: sectionData.notes || '',
    wordCount: sectionData.wordCount || 100,
    order: sectionData.order || outline.sections.length + 1,
    depth: sectionData.depth || 1,
    resources: sectionData.resources || [],
    keywords: sectionData.keywords || [],
    status: sectionData.status || 'draft'
  };
  
  outline.sections.push(newSection);
  
  return updateOutline(outlineId, { sections: outline.sections });
}

function updateSection(outlineId, sectionId, updates) {
  const outline = getOutline(outlineId);
  
  const sectionIndex = outline.sections.findIndex(s => s.id === sectionId);
  if (sectionIndex === -1) {
    throw new Error('Section not found');
  }
  
  outline.sections[sectionIndex] = {
    ...outline.sections[sectionIndex],
    ...updates
  };
  
  return updateOutline(outlineId, { sections: outline.sections });
}

function deleteSection(outlineId, sectionId) {
  const outline = getOutline(outlineId);
  
  const filtered = outline.sections.filter(s => s.id !== sectionId);
  
  if (filtered.length === outline.sections.length) {
    throw new Error('Section not found');
  }
  
  return updateOutline(outlineId, { sections: filtered });
}

function reorderSections(outlineId, sectionOrder) {
  const outline = getOutline(outlineId);
  
  const reordered = sectionOrder
    .map(id => outline.sections.find(s => s.id === id))
    .filter(Boolean)
    .map((section, index) => ({ ...section, order: index + 1 }));
  
  return updateOutline(outlineId, { sections: reordered });
}

function addSubheading(outlineId, sectionId, subheadingData) {
  const outline = getOutline(outlineId);
  const section = outline.sections.find(s => s.id === sectionId);
  
  if (!section) {
    throw new Error('Section not found');
  }
  
  const subheading = {
    id: generateId('sub'),
    text: subheadingData.text || 'New Subheading',
    notes: subheadingData.notes || '',
    wordCount: subheadingData.wordCount || 50,
    order: subheadingData.order || section.subheadings.length + 1
  };
  
  section.subheadings = section.subheadings || [];
  section.subheadings.push(subheading);
  
  return updateSection(outlineId, sectionId, { subheadings: section.subheadings });
}

// ============================================================================
// VERSIONING
// ============================================================================

function versionOutline(outlineId, name = null) {
  const outline = getOutline(outlineId);
  const versionId = generateId('v');
  const existing = versions.get(outlineId) || [];
  
  const entry = { 
    versionId, 
    name: name || `v${existing.length + 1}`, 
    snapshot: JSON.parse(JSON.stringify(outline)), 
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  versions.set(outlineId, [entry, ...existing].slice(0, 50)); // Keep last 50 versions
  
  return entry;
}

function listVersions(outlineId) {
  return versions.get(outlineId) || [];
}

function restoreVersion(outlineId, versionId) {
  const versionHistory = versions.get(outlineId) || [];
  const version = versionHistory.find(v => v.versionId === versionId);
  
  if (!version) {
    throw new Error('Version not found');
  }
  
  const restored = {
    ...version.snapshot,
    updatedAt: new Date().toISOString()
  };
  
  outlines.set(outlineId, restored);
  versionOutline(outlineId, `Restored from ${version.name}`);
  
  return restored;
}

function compareVersions(outlineId, versionId1, versionId2) {
  const versionHistory = versions.get(outlineId) || [];
  const v1 = versionHistory.find(v => v.versionId === versionId1);
  const v2 = versionHistory.find(v => v.versionId === versionId2);
  
  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }
  
  const changes = {
    sectionsAdded: v2.snapshot.sections.filter(s2 => !v1.snapshot.sections.find(s1 => s1.id === s2.id)).length,
    sectionsRemoved: v1.snapshot.sections.filter(s1 => !v2.snapshot.sections.find(s2 => s2.id === s1.id)).length,
    sectionsModified: 0,
    wordCountDiff: v2.snapshot.wordCount - v1.snapshot.wordCount
  };
  
  return {
    version1: v1,
    version2: v2,
    changes
  };
}

// ============================================================================
// TEMPLATES
// ============================================================================

function createTemplate(templateData) {
  const templateId = generateId('template');
  
  const template = {
    id: templateId,
    name: templateData.name || 'Untitled Template',
    description: templateData.description || '',
    framework: templateData.framework || null,
    sections: templateData.sections || [],
    targetWordCount: templateData.targetWordCount || 1500,
    purpose: templateData.purpose || 'general',
    industry: templateData.industry || 'general',
    tags: templateData.tags || [],
    createdAt: new Date().toISOString()
  };
  
  templates.set(templateId, template);
  
  return template;
}

function applyTemplate(outlineId, templateId) {
  const outline = getOutline(outlineId);
  const template = templates.get(templateId);
  
  if (!template) {
    throw new Error('Template not found');
  }
  
  const sectionsFromTemplate = template.sections.map((s, index) => ({
    ...s,
    id: generateId('sec'),
    order: index + 1
  }));
  
  return updateOutline(outlineId, {
    sections: sectionsFromTemplate,
    framework: template.framework
  });
}

function listTemplates(filter = {}) {
  let results = Array.from(templates.values());
  
  if (filter.purpose) {
    results = results.filter(t => t.purpose === filter.purpose);
  }
  
  if (filter.framework) {
    results = results.filter(t => t.framework === filter.framework);
  }
  
  if (filter.industry) {
    results = results.filter(t => t.industry === filter.industry);
  }
  
  return results;
}

// ============================================================================
// AUTO-GENERATION
// ============================================================================

function autoGenerateOutline(topic, options = {}) {
  const framework = options.framework || 'Problem-Solution-Proof';
  const targetWordCount = options.targetWordCount || 1500;
  
  const frameworkStructures = {
    'Problem-Solution-Proof': [
      { heading: 'Introduction', wordCount: Math.round(targetWordCount * 0.1), notes: 'Hook and context' },
      { heading: 'The Problem', wordCount: Math.round(targetWordCount * 0.25), notes: `Pain points related to ${topic}` },
      { heading: 'The Solution', wordCount: Math.round(targetWordCount * 0.30), notes: 'How to solve the problem' },
      { heading: 'Proof & Evidence', wordCount: Math.round(targetWordCount * 0.25), notes: 'Data, case studies, testimonials' },
      { heading: 'Conclusion & CTA', wordCount: Math.round(targetWordCount * 0.10), notes: 'Summary and call to action' }
    ],
    'Pain-Agitate-Solve': [
      { heading: 'Pain Point', wordCount: Math.round(targetWordCount * 0.2), notes: 'Identify the problem' },
      { heading: 'Amplify the Pain', wordCount: Math.round(targetWordCount * 0.25), notes: 'Show consequences of inaction' },
      { heading: 'Introduce Solution', wordCount: Math.round(targetWordCount * 0.30), notes: `How ${topic} solves it` },
      { heading: 'Implementation', wordCount: Math.round(targetWordCount * 0.15), notes: 'How to get started' },
      { heading: 'Call to Action', wordCount: Math.round(targetWordCount * 0.10), notes: 'Next steps' }
    ],
    'How-To Guide': [
      { heading: 'Introduction', wordCount: Math.round(targetWordCount * 0.1), notes: `What you'll learn about ${topic}` },
      { heading: 'Prerequisites', wordCount: Math.round(targetWordCount * 0.1), notes: 'What you need before starting' },
      { heading: 'Step 1', wordCount: Math.round(targetWordCount * 0.2), notes: 'First major step' },
      { heading: 'Step 2', wordCount: Math.round(targetWordCount * 0.2), notes: 'Second major step' },
      { heading: 'Step 3', wordCount: Math.round(targetWordCount * 0.2), notes: 'Third major step' },
      { heading: 'Conclusion', wordCount: Math.round(targetWordCount * 0.1), notes: 'Summary and next steps' }
    ]
  };
  
  const structure = frameworkStructures[framework] || frameworkStructures['Problem-Solution-Proof'];
  
  const sections = structure.map((s, index) => ({
    id: generateId('sec'),
    heading: s.heading,
    subheadings: [],
    notes: s.notes,
    wordCount: s.wordCount,
    order: index + 1,
    depth: 1,
    resources: [],
    keywords: [],
    status: 'draft'
  }));
  
  return generateOutline({
    topic,
    sections,
    framework,
    ...options
  });
}

// ============================================================================
// ANALYSIS & SCORING
// ============================================================================

function scoreOutline(outline) {
  const sections = outline.sections || [];
  const completeness = Math.min(100, sections.length * 12 + 30);
  const depth = Math.min(100, Math.round(outline.wordCount / 15));
  const coverage = Math.min(100, Math.round(sections.filter((s) => s.notes?.length > 10).length * 14 + 20));
  const structure = Math.min(100, sections.filter(s => s.subheadings && s.subheadings.length > 0).length * 15 + 40);
  
  const score = Math.round((completeness * 0.3 + depth * 0.25 + coverage * 0.25 + structure * 0.20) / 1);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D';
  
  return { score, grade, completeness, coverage, depth, structure };
}

function analyzeOutlineStructure(outlineId) {
  const outline = getOutline(outlineId);
  const analysisId = generateId('analysis');
  
  const sections = outline.sections || [];
  const totalSections = sections.length;
  const totalSubheadings = sections.reduce((acc, s) => acc + (s.subheadings?.length || 0), 0);
  const avgWordsPerSection = totalSections > 0 ? outline.wordCount / totalSections : 0;
  const maxDepth = Math.max(...sections.map(s => s.depth || 1));
  
  const gaps = [];
  
  if (totalSections < 3) {
    gaps.push({ type: 'structure', severity: 'high', message: 'Outline needs more sections for comprehensive coverage' });
  }
  
  if (totalSubheadings === 0) {
    gaps.push({ type: 'depth', severity: 'medium', message: 'Add subheadings for better structure and readability' });
  }
  
  if (outline.wordCount < 800) {
    gaps.push({ type: 'length', severity: 'medium', message: 'Content may be too brief for topic depth' });
  }
  
  const sectionsWithoutNotes = sections.filter(s => !s.notes || s.notes.length < 5);
  if (sectionsWithoutNotes.length > 0) {
    gaps.push({ type: 'guidance', severity: 'low', message: `${sectionsWithoutNotes.length} sections need writing guidance` });
  }
  
  const analysis = {
    id: analysisId,
    outlineId,
    metrics: {
      totalSections,
      totalSubheadings,
      avgWordsPerSection: Math.round(avgWordsPerSection),
      maxDepth,
      totalWordCount: outline.wordCount
    },
    gaps,
    recommendations: gaps.map(g => g.message),
    score: scoreOutline(outline),
    analyzedAt: new Date().toISOString()
  };
  
  structureAnalyses.set(analysisId, analysis);
  
  return analysis;
}

function suggestImprovements(outlineId) {
  const outline = getOutline(outlineId);
  const analysis = analyzeOutlineStructure(outlineId);
  
  const suggestions = [];
  
  // Structure suggestions
  if (analysis.metrics.totalSections < 4) {
    suggestions.push({
      type: 'structure',
      priority: 'high',
      suggestion: 'Add more main sections for comprehensive topic coverage',
      action: 'Add at least 2 more sections'
    });
  }
  
  // Depth suggestions
  if (analysis.metrics.totalSubheadings < analysis.metrics.totalSections) {
    suggestions.push({
      type: 'depth',
      priority: 'medium',
      suggestion: 'Add subheadings to break down complex sections',
      action: 'Add subheadings to sections with >200 words'
    });
  }
  
  // Word count balance
  const sections = outline.sections || [];
  const wordCounts = sections.map(s => s.wordCount || 0);
  const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / sections.length;
  const imbalanced = wordCounts.filter(wc => wc < avgWordCount * 0.5 || wc > avgWordCount * 2);
  
  if (imbalanced.length > 0) {
    suggestions.push({
      type: 'balance',
      priority: 'low',
      suggestion: 'Balance word count across sections',
      action: 'Redistribute content for more even coverage'
    });
  }
  
  // Framework alignment
  if (!outline.framework) {
    suggestions.push({
      type: 'framework',
      priority: 'medium',
      suggestion: 'Apply a strategic framework for better structure',
      action: 'Choose framework: Problem-Solution-Proof, Pain-Agitate-Solve, or How-To Guide'
    });
  }
  
  return {
    outlineId,
    suggestions,
    analysis,
    totalSuggestions: suggestions.length,
    highPriority: suggestions.filter(s => s.priority === 'high').length
  };
}

// ============================================================================
// COMMENTS & COLLABORATION
// ============================================================================

function addComment(outlineId, commentData) {
  const commentId = generateId('comment');
  
  const comment = {
    id: commentId,
    outlineId,
    sectionId: commentData.sectionId || null,
    author: commentData.author || 'Anonymous',
    text: commentData.text,
    type: commentData.type || 'general', // general, suggestion, question, approval
    resolved: false,
    createdAt: new Date().toISOString()
  };
  
  if (!outlineComments.has(outlineId)) {
    outlineComments.set(outlineId, []);
  }
  
  outlineComments.get(outlineId).push(comment);
  
  return comment;
}

function listComments(outlineId, filters = {}) {
  const comments = outlineComments.get(outlineId) || [];
  
  let filtered = comments;
  
  if (filters.sectionId) {
    filtered = filtered.filter(c => c.sectionId === filters.sectionId);
  }
  
  if (filters.resolved !== undefined) {
    filtered = filtered.filter(c => c.resolved === filters.resolved);
  }
  
  if (filters.type) {
    filtered = filtered.filter(c => c.type === filters.type);
  }
  
  return filtered;
}

function resolveComment(outlineId, commentId) {
  const comments = outlineComments.get(outlineId) || [];
  const comment = comments.find(c => c.id === commentId);
  
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  comment.resolved = true;
  comment.resolvedAt = new Date().toISOString();
  
  return comment;
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

function getStats() {
  const all = Array.from(outlines.values());
  const scores = all.map(o => scoreOutline(o).score);
  
  return {
    totalOutlines: all.length,
    totalTemplates: templates.size,
    averageScore: scores.length ? Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length) : 0,
    averageWordCount: all.length ? Math.round(all.reduce((acc, o) => acc + o.wordCount, 0) / all.length) : 0,
    averageSections: all.length ? Math.round(all.reduce((acc, o) => acc + o.sections.length, 0) / all.length) : 0,
    statuses: all.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}),
    priorities: all.reduce((acc, o) => {
      acc[o.priority] = (acc[o.priority] || 0) + 1;
      return acc;
    }, {}),
    frameworks: all.reduce((acc, o) => {
      if (o.framework) {
        acc[o.framework] = (acc[o.framework] || 0) + 1;
      }
      return acc;
    }, {}),
    highScoreOutlines: scores.filter(s => s >= 80).length,
    mediumScoreOutlines: scores.filter(s => s >= 60 && s < 80).length,
    lowScoreOutlines: scores.filter(s => s < 60).length
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Outline Management
  generateOutline,
  getOutline,
  updateOutline,
  deleteOutline,
  listOutlines,
  
  // Section Management
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
  addSubheading,
  
  // Versioning
  versionOutline,
  listVersions,
  restoreVersion,
  compareVersions,
  
  // Templates
  createTemplate,
  applyTemplate,
  listTemplates,
  
  // Auto-Generation
  autoGenerateOutline,
  
  // Analysis & Scoring
  scoreOutline,
  analyzeOutlineStructure,
  suggestImprovements,
  
  // Comments & Collaboration
  addComment,
  listComments,
  resolveComment,
  
  // Statistics
  getStats,
};
