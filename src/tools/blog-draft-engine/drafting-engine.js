/**
 * DRAFTING ENGINE
 * Content generation, version control, editorial quality checks,
 * readability optimization, fact-checking, and draft iterations
 */

const crypto = require('crypto');

// In-memory stores
const drafts = new Map();
const versions = new Map();
const revisions = new Map();
const editorialChecks = new Map();
const factChecks = new Map();
const readabilityScores = new Map();

// ================================================================
// DRAFT MANAGEMENT
// ================================================================

function createDraft({
  briefId,
  outlineId,
  title,
  content,
  primaryKeyword,
  targetWordCount = 1500,
  sections = [],
  metadata = {}
}) {
  const draftId = `draft-${crypto.randomBytes(4).toString('hex')}`;
  
  const draft = {
    draftId,
    briefId,
    outlineId,
    title,
    content,
    primaryKeyword,
    targetWordCount,
    sections,
    metadata,
    version: 1,
    status: 'draft',
    wordCount: countWords(content),
    readabilityScore: null,
    editorialScore: null,
    factCheckStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: metadata.userId || 'system',
    lastEditedBy: metadata.userId || 'system'
  };
  
  // Auto-analyze
  draft.readabilityScore = analyzeReadability(content);
  draft.editorialScore = runEditorialChecks(draftId);
  
  drafts.set(draftId, draft);
  
  // Create initial version snapshot
  createVersion(draftId, 'Initial draft');
  
  return draft;
}

function getDraft(draftId) {
  return drafts.get(draftId) || null;
}

function listDrafts({ status, briefId, minScore, limit = 50, offset = 0 }) {
  let results = Array.from(drafts.values());
  
  if (status) {
    results = results.filter(d => d.status === status);
  }
  
  if (briefId) {
    results = results.filter(d => d.briefId === briefId);
  }
  
  if (minScore !== undefined) {
    results = results.filter(d => d.editorialScore && d.editorialScore >= minScore);
  }
  
  results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  return {
    drafts: results.slice(offset, offset + limit),
    total: results.length,
    offset,
    limit
  };
}

function updateDraft(draftId, updates, userId = 'system') {
  const draft = drafts.get(draftId);
  if (!draft) return null;
  
  // Create version snapshot before update
  createVersion(draftId, updates.changeNote || 'Update');
  
  Object.assign(draft, updates);
  draft.version++;
  draft.updatedAt = new Date().toISOString();
  draft.lastEditedBy = userId;
  
  // Re-analyze if content changed
  if (updates.content) {
    draft.wordCount = countWords(updates.content);
    draft.readabilityScore = analyzeReadability(updates.content);
    draft.editorialScore = runEditorialChecks(draftId);
  }
  
  drafts.set(draftId, draft);
  return draft;
}

function deleteDraft(draftId) {
  // Delete versions
  const draftVersions = Array.from(versions.values())
    .filter(v => v.draftId === draftId);
  
  draftVersions.forEach(v => versions.delete(v.versionId));
  
  return drafts.delete(draftId);
}

function countWords(text) {
  if (!text) return 0;
  
  const cleaned = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned.split(' ').length;
}

// ================================================================
// VERSION CONTROL
// ================================================================

function createVersion(draftId, changeNote = '') {
  const draft = drafts.get(draftId);
  if (!draft) return null;
  
  const versionId = `version-${crypto.randomBytes(4).toString('hex')}`;
  
  const version = {
    versionId,
    draftId,
    versionNumber: draft.version,
    snapshot: JSON.parse(JSON.stringify(draft)),
    changeNote,
    createdAt: new Date().toISOString(),
    createdBy: draft.lastEditedBy
  };
  
  versions.set(versionId, version);
  return version;
}

function getVersion(versionId) {
  return versions.get(versionId) || null;
}

function listVersions(draftId) {
  return Array.from(versions.values())
    .filter(v => v.draftId === draftId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

function restoreVersion(versionId, userId = 'system') {
  const version = versions.get(versionId);
  if (!version) return null;
  
  const draft = drafts.get(version.draftId);
  if (!draft) return null;
  
  // Create snapshot of current state
  createVersion(version.draftId, `Restore to version ${version.versionNumber}`);
  
  // Restore snapshot
  const restored = version.snapshot;
  restored.version = draft.version + 1;
  restored.updatedAt = new Date().toISOString();
  restored.lastEditedBy = userId;
  
  drafts.set(version.draftId, restored);
  return restored;
}

function compareDraftVersions(versionId1, versionId2) {
  const v1 = versions.get(versionId1);
  const v2 = versions.get(versionId2);
  
  if (!v1 || !v2) return null;
  
  const diff = {
    version1: v1.versionNumber,
    version2: v2.versionNumber,
    titleChanged: v1.snapshot.title !== v2.snapshot.title,
    contentChanged: v1.snapshot.content !== v2.snapshot.content,
    wordCountDiff: v2.snapshot.wordCount - v1.snapshot.wordCount,
    readabilityDiff: v2.snapshot.readabilityScore - v1.snapshot.readabilityScore,
    changes: []
  };
  
  if (diff.titleChanged) {
    diff.changes.push({
      field: 'title',
      old: v1.snapshot.title,
      new: v2.snapshot.title
    });
  }
  
  if (diff.contentChanged) {
    diff.changes.push({
      field: 'content',
      type: 'text_diff',
      wordCountChange: diff.wordCountDiff
    });
  }
  
  return diff;
}

// ================================================================
// EDITORIAL QUALITY CHECKS
// ================================================================

function runEditorialChecks(draftId) {
  const draft = drafts.get(draftId);
  if (!draft) return null;
  
  const checkId = `editorial-${crypto.randomBytes(4).toString('hex')}`;
  
  const checks = {
    checkId,
    draftId,
    timestamp: new Date().toISOString(),
    
    // Grammar checks
    grammar: checkGrammar(draft.content),
    
    // Style checks
    passiveVoice: checkPassiveVoice(draft.content),
    sentenceLength: checkSentenceLength(draft.content),
    paragraphLength: checkParagraphLength(draft.content),
    
    // Content checks
    keywordUsage: checkKeywordUsage(draft.content, draft.primaryKeyword),
    headingStructure: checkHeadingStructure(draft.sections),
    
    // Completeness
    hasIntro: checkHasIntroduction(draft.content),
    hasConclusion: checkHasConclusion(draft.content),
    hasCTA: checkHasCTA(draft.content),
    
    // Word count
    wordCountTarget: checkWordCountTarget(draft.wordCount, draft.targetWordCount)
  };
  
  // Compute overall score
  const scores = [
    checks.grammar.score,
    checks.passiveVoice.score,
    checks.sentenceLength.score,
    checks.paragraphLength.score,
    checks.keywordUsage.score,
    checks.headingStructure.score,
    checks.hasIntro ? 100 : 0,
    checks.hasConclusion ? 100 : 0,
    checks.hasCTA ? 100 : 0,
    checks.wordCountTarget.score
  ];
  
  checks.overallScore = Math.round(
    scores.reduce((sum, s) => sum + s, 0) / scores.length
  );
  
  checks.grade = checks.overallScore >= 90 ? 'A' :
                 checks.overallScore >= 80 ? 'B' :
                 checks.overallScore >= 70 ? 'C' :
                 checks.overallScore >= 60 ? 'D' : 'F';
  
  editorialChecks.set(checkId, checks);
  return checks.overallScore;
}

function checkGrammar(content) {
  // Simplified grammar check
  const errors = [];
  
  // Check for common errors
  if (content.match(/\bi\b/)) errors.push("Lowercase 'i' detected");
  if (content.match(/\s{2,}/)) errors.push("Multiple spaces detected");
  if (content.match(/[.!?]\s*[a-z]/)) errors.push("Sentence not capitalized");
  
  return {
    score: Math.max(70, 100 - errors.length * 10),
    errors
  };
}

function checkPassiveVoice(content) {
  const passivePatterns = [
    /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi
  ];
  
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  let passiveCount = 0;
  
  sentences.forEach(sentence => {
    passivePatterns.forEach(pattern => {
      if (pattern.test(sentence)) passiveCount++;
    });
  });
  
  const passivePercent = (passiveCount / sentences.length) * 100;
  
  return {
    score: passivePercent < 10 ? 100 :
           passivePercent < 20 ? 85 :
           passivePercent < 30 ? 70 : 50,
    passiveCount,
    totalSentences: sentences.length,
    passivePercent: Math.round(passivePercent)
  };
}

function checkSentenceLength(content) {
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  
  const wordCounts = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = wordCounts.reduce((sum, c) => sum + c, 0) / wordCounts.length;
  
  // Ideal: 15-20 words per sentence
  const score = avgLength >= 15 && avgLength <= 20 ? 100 :
                avgLength >= 12 && avgLength <= 25 ? 85 :
                avgLength >= 10 && avgLength <= 30 ? 70 : 50;
  
  return {
    score,
    avgLength: Math.round(avgLength),
    minLength: Math.min(...wordCounts),
    maxLength: Math.max(...wordCounts)
  };
}

function checkParagraphLength(content) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  
  const wordCounts = paragraphs.map(p => p.trim().split(/\s+/).length);
  const avgLength = wordCounts.reduce((sum, c) => sum + c, 0) / wordCounts.length;
  
  // Ideal: 50-100 words per paragraph
  const score = avgLength >= 50 && avgLength <= 100 ? 100 :
                avgLength >= 40 && avgLength <= 120 ? 85 :
                avgLength >= 30 && avgLength <= 150 ? 70 : 50;
  
  return {
    score,
    avgLength: Math.round(avgLength),
    paragraphCount: paragraphs.length
  };
}

function checkKeywordUsage(content, keyword) {
  if (!keyword) return { score: 100, occurrences: 0, density: 0 };
  
  const contentLower = content.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  
  const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
  const wordCount = countWords(content);
  const density = (occurrences / wordCount) * 100;
  
  // Ideal density: 0.5-2.5%
  const score = density >= 0.5 && density <= 2.5 ? 100 :
                density >= 0.3 && density <= 3.0 ? 85 :
                density >= 0.1 && density <= 4.0 ? 70 : 50;
  
  return {
    score,
    occurrences,
    density: density.toFixed(2),
    recommendation: density < 0.5 ? 'Add more keyword usage' :
                    density > 2.5 ? 'Reduce keyword density (may appear spammy)' :
                    'Keyword density is optimal'
  };
}

function checkHeadingStructure(sections) {
  if (!sections || sections.length === 0) {
    return { score: 50, issues: ['No sections defined'] };
  }
  
  const issues = [];
  
  if (sections.length < 3) issues.push('Too few sections (minimum 3 recommended)');
  if (sections.length > 12) issues.push('Too many sections (may be fragmented)');
  
  const hasProperOrder = sections.every((s, i) => s.order === i + 1);
  if (!hasProperOrder) issues.push('Section order is not sequential');
  
  return {
    score: issues.length === 0 ? 100 : Math.max(50, 100 - issues.length * 15),
    sectionCount: sections.length,
    issues
  };
}

function checkHasIntroduction(content) {
  const firstParagraph = content.split(/\n\n/)[0] || '';
  return firstParagraph.length >= 100;
}

function checkHasConclusion(content) {
  const paragraphs = content.split(/\n\n/);
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  
  const conclusionKeywords = [
    'conclusion',
    'in summary',
    'to summarize',
    'in closing',
    'to wrap up',
    'final thoughts'
  ];
  
  const hasKeyword = conclusionKeywords.some(kw => 
    lastParagraph.toLowerCase().includes(kw)
  );
  
  return hasKeyword || lastParagraph.length >= 80;
}

function checkHasCTA(content) {
  const ctaPatterns = [
    /get started/i,
    /sign up/i,
    /learn more/i,
    /contact us/i,
    /try.*free/i,
    /download/i,
    /subscribe/i,
    /book a demo/i
  ];
  
  return ctaPatterns.some(pattern => pattern.test(content));
}

function checkWordCountTarget(actual, target) {
  const diff = Math.abs(actual - target);
  const diffPercent = (diff / target) * 100;
  
  const score = diffPercent < 5 ? 100 :
                diffPercent < 10 ? 90 :
                diffPercent < 15 ? 80 :
                diffPercent < 25 ? 70 : 50;
  
  return {
    score,
    actual,
    target,
    diff,
    diffPercent: Math.round(diffPercent),
    status: diffPercent < 10 ? 'on-target' :
            actual < target ? 'under' : 'over'
  };
}

// ================================================================
// READABILITY ANALYSIS
// ================================================================

function analyzeReadability(content) {
  const scoreId = `read-${crypto.randomBytes(4).toString('hex')}`;
  
  const fleschScore = calculateFleschReadingEase(content);
  const gradeLevel = calculateGradeLevel(content);
  const complexWords = analyzeComplexWords(content);
  
  const readability = {
    scoreId,
    fleschScore,
    gradeLevel,
    complexWords,
    interpretation: interpretFleschScore(fleschScore),
    recommendation: generateReadabilityRecommendation(fleschScore, gradeLevel),
    timestamp: new Date().toISOString()
  };
  
  readabilityScores.set(scoreId, readability);
  return fleschScore;
}

function calculateFleschReadingEase(content) {
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const words = content.match(/\b\w+\b/g) || [];
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - 
                (1.015 * avgWordsPerSentence) - 
                (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word) {
  word = word.toLowerCase();
  
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

function calculateGradeLevel(content) {
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const words = content.match(/\b\w+\b/g) || [];
  const complexWords = words.filter(w => countSyllables(w) >= 3);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const complexWordPercent = (complexWords.length / words.length) * 100;
  
  // Gunning Fog Index
  const gradeLevel = 0.4 * (avgWordsPerSentence + complexWordPercent);
  
  return Math.round(gradeLevel);
}

function analyzeComplexWords(content) {
  const words = content.match(/\b\w+\b/g) || [];
  const complexWords = words.filter(w => countSyllables(w) >= 3);
  
  return {
    count: complexWords.length,
    percent: ((complexWords.length / words.length) * 100).toFixed(1),
    examples: [...new Set(complexWords)].slice(0, 10)
  };
}

function interpretFleschScore(score) {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}

function generateReadabilityRecommendation(fleschScore, gradeLevel) {
  const recommendations = [];
  
  if (fleschScore < 60) {
    recommendations.push('Simplify sentence structure');
    recommendations.push('Use shorter words where possible');
  }
  
  if (gradeLevel > 10) {
    recommendations.push('Reduce complex vocabulary');
    recommendations.push('Break long sentences into shorter ones');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Readability is good for general audience');
  }
  
  return recommendations;
}

// ================================================================
// FACT CHECKING
// ================================================================

function submitForFactCheck(draftId, claims = []) {
  const draft = drafts.get(draftId);
  if (!draft) return null;
  
  const checkId = `fact-${crypto.randomBytes(4).toString('hex')}`;
  
  const factCheck = {
    checkId,
    draftId,
    claims,
    status: 'pending',
    results: [],
    submittedAt: new Date().toISOString()
  };
  
  factChecks.set(checkId, factCheck);
  
  draft.factCheckStatus = 'pending';
  drafts.set(draftId, draft);
  
  return factCheck;
}

function recordFactCheckResult(checkId, claimIndex, verified, notes = '') {
  const factCheck = factChecks.get(checkId);
  if (!factCheck) return null;
  
  factCheck.results.push({
    claimIndex,
    verified,
    notes,
    verifiedAt: new Date().toISOString()
  });
  
  // Update status if all claims checked
  if (factCheck.results.length === factCheck.claims.length) {
    const allVerified = factCheck.results.every(r => r.verified);
    factCheck.status = allVerified ? 'approved' : 'issues_found';
    
    // Update draft
    const draft = drafts.get(factCheck.draftId);
    if (draft) {
      draft.factCheckStatus = factCheck.status;
      drafts.set(factCheck.draftId, draft);
    }
  }
  
  factChecks.set(checkId, factCheck);
  return factCheck;
}

function getFactCheckStatus(draftId) {
  return Array.from(factChecks.values())
    .find(fc => fc.draftId === draftId) || null;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Draft management
  createDraft,
  getDraft,
  listDrafts,
  updateDraft,
  deleteDraft,
  
  // Version control
  createVersion,
  getVersion,
  listVersions,
  restoreVersion,
  compareDraftVersions,
  
  // Editorial checks
  runEditorialChecks,
  checkGrammar,
  checkPassiveVoice,
  checkKeywordUsage,
  
  // Readability
  analyzeReadability,
  calculateFleschReadingEase,
  calculateGradeLevel,
  
  // Fact checking
  submitForFactCheck,
  recordFactCheckResult,
  getFactCheckStatus,
  
  // Utilities
  countWords,
  countSyllables,
  
  // Internal stores
  drafts,
  versions,
  revisions,
  editorialChecks,
  factChecks,
  readabilityScores
};
