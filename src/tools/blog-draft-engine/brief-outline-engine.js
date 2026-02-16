/**
 * BRIEF & OUTLINE ENGINE
 * Content brief creation, outline structuring, compliance validation,
 * persona targeting, approval workflows, and quality scoring
 */

const crypto = require('crypto');

// In-memory stores
const briefs = new Map();
const outlines = new Map();
const templates = new Map();
const approvals = new Map();
const complianceChecks = new Map();
const personas = new Map();

// ================================================================
// BRIEF MANAGEMENT
// ================================================================

function createBrief({
  title,
  primaryKeyword,
  secondaryKeywords = [],
  targetAudience,
  contentGoal,
  tone = 'professional',
  wordCountTarget = 1500,
  sections = [],
  metadata = {}
}) {
  const briefId = `brief-${crypto.randomBytes(4).toString('hex')}`;
  
  const brief = {
    briefId,
    title,
    primaryKeyword,
    secondaryKeywords,
    targetAudience,
    contentGoal,
    tone,
    wordCountTarget,
    sections,
    metadata,
    compliance: {
      pii: 'pending',
      claims: 'pending',
      tone: 'pending',
      legal: 'pending'
    },
    status: 'draft',
    score: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: metadata.userId || 'system',
    approvers: [],
    approvalStatus: 'pending'
  };
  
  briefs.set(briefId, brief);
  
  // Auto-run compliance checks
  const complianceResult = runComplianceChecks(briefId);
  brief.compliance = complianceResult;
  
  // Compute quality score
  brief.score = scoreBrief(brief);
  
  briefs.set(briefId, brief);
  return brief;
}

function getBrief(briefId) {
  return briefs.get(briefId) || null;
}

function listBriefs({ status, minScore, limit = 50, offset = 0 }) {
  let results = Array.from(briefs.values());
  
  if (status) {
    results = results.filter(b => b.status === status);
  }
  
  if (minScore !== undefined) {
    results = results.filter(b => b.score && b.score >= minScore);
  }
  
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return {
    briefs: results.slice(offset, offset + limit),
    total: results.length,
    offset,
    limit
  };
}

function updateBrief(briefId, updates) {
  const brief = briefs.get(briefId);
  if (!brief) return null;
  
  Object.assign(brief, updates);
  brief.updatedAt = new Date().toISOString();
  
  // Re-run compliance if content changed
  if (updates.title || updates.sections || updates.tone) {
    brief.compliance = runComplianceChecks(briefId);
  }
  
  // Recompute score
  brief.score = scoreBrief(brief);
  
  briefs.set(briefId, brief);
  return brief;
}

function deleteBrief(briefId) {
  // Delete associated outlines
  const relatedOutlines = Array.from(outlines.values())
    .filter(o => o.briefId === briefId);
  
  relatedOutlines.forEach(o => outlines.delete(o.outlineId));
  
  return briefs.delete(briefId);
}

function scoreBrief(brief) {
  const components = {
    completeness: scoreBriefCompleteness(brief),
    seoAlignment: scoreSEOAlignment(brief),
    audienceMatch: scoreAudienceMatch(brief),
    compliance: scoreCompliance(brief.compliance)
  };
  
  const score = Math.round(
    components.completeness * 0.30 +
    components.seoAlignment * 0.30 +
    components.audienceMatch * 0.25 +
    components.compliance * 0.15
  );
  
  return score;
}

function scoreBriefCompleteness(brief) {
  const required = [
    brief.title && brief.title.length > 10,
    brief.primaryKeyword && brief.primaryKeyword.length > 0,
    brief.targetAudience && brief.targetAudience.length > 0,
    brief.contentGoal && brief.contentGoal.length > 0,
    brief.sections && brief.sections.length >= 3,
    brief.wordCountTarget && brief.wordCountTarget >= 500
  ];
  
  const fulfilled = required.filter(Boolean).length;
  return Math.round((fulfilled / required.length) * 100);
}

function scoreSEOAlignment(brief) {
  let score = 60;
  
  if (brief.primaryKeyword) score += 15;
  if (brief.secondaryKeywords && brief.secondaryKeywords.length > 0) score += 10;
  if (brief.title && brief.title.toLowerCase().includes(brief.primaryKeyword.toLowerCase())) score += 15;
  
  return Math.min(100, score);
}

function scoreAudienceMatch(brief) {
  if (!brief.targetAudience) return 60;
  
  const audience = brief.targetAudience.toLowerCase();
  const title = (brief.title || '').toLowerCase();
  const goal = (brief.contentGoal || '').toLowerCase();
  
  let score = 70;
  
  if (title.includes(audience)) score += 15;
  if (goal.includes('convert') || goal.includes('engage')) score += 10;
  if (brief.tone && brief.tone.length > 0) score += 5;
  
  return Math.min(100, score);
}

function scoreCompliance(compliance) {
  const checks = Object.values(compliance);
  const passed = checks.filter(c => c === 'clean' || c === 'approved').length;
  
  return Math.round((passed / checks.length) * 100);
}

// ================================================================
// OUTLINE MANAGEMENT
// ================================================================

function createOutline({
  briefId,
  sections = [],
  targetWordCount = 1500,
  metadata = {}
}) {
  const outlineId = `outline-${crypto.randomBytes(4).toString('hex')}`;
  
  // Default sections if none provided
  if (sections.length === 0) {
    sections = [
      { heading: 'Introduction', notes: 'Hook and context', words: 150, order: 1 },
      { heading: 'Problem Statement', notes: 'Define the challenge', words: 200, order: 2 },
      { heading: 'Solution Framework', notes: 'Present the approach', words: 400, order: 3 },
      { heading: 'Implementation', notes: 'Tactical steps', words: 500, order: 4 },
      { heading: 'Case Study', notes: 'Real example', words: 200, order: 5 },
      { heading: 'Conclusion', notes: 'Summary and CTA', words: 150, order: 6 }
    ];
  }
  
  const outline = {
    outlineId,
    briefId,
    sections,
    targetWordCount,
    metadata,
    status: 'draft',
    score: null,
    grade: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Compute quality score
  const gradeResult = gradeOutline(outline);
  outline.score = gradeResult.score;
  outline.grade = gradeResult.grade;
  
  outlines.set(outlineId, outline);
  return outline;
}

function getOutline(outlineId) {
  return outlines.get(outlineId) || null;
}

function listOutlines({ briefId, minScore, limit = 50 }) {
  let results = Array.from(outlines.values());
  
  if (briefId) {
    results = results.filter(o => o.briefId === briefId);
  }
  
  if (minScore !== undefined) {
    results = results.filter(o => o.score && o.score >= minScore);
  }
  
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return results.slice(0, limit);
}

function updateOutline(outlineId, updates) {
  const outline = outlines.get(outlineId);
  if (!outline) return null;
  
  Object.assign(outline, updates);
  outline.updatedAt = new Date().toISOString();
  
  // Recompute grade
  const gradeResult = gradeOutline(outline);
  outline.score = gradeResult.score;
  outline.grade = gradeResult.grade;
  
  outlines.set(outlineId, outline);
  return outline;
}

function deleteOutline(outlineId) {
  return outlines.delete(outlineId);
}

function gradeOutline(outline) {
  const depth = scoreOutlineDepth(outline);
  const coverage = scoreOutlineCoverage(outline);
  const clarity = scoreOutlineClarity(outline);
  const balance = scoreOutlineBalance(outline);
  
  const score = Math.round(
    depth * 0.35 +
    coverage * 0.30 +
    clarity * 0.20 +
    balance * 0.15
  );
  
  const grade = score >= 90 ? 'A' :
                score >= 80 ? 'B' :
                score >= 70 ? 'C' :
                score >= 60 ? 'D' : 'F';
  
  return {
    score,
    grade,
    depth,
    coverage,
    clarity,
    balance
  };
}

function scoreOutlineDepth(outline) {
  const sections = outline.sections || [];
  const totalWords = sections.reduce((sum, s) => sum + (s.words || 0), 0);
  
  // Target depth score based on word count allocation
  const depthScore = Math.min(100, Math.round((totalWords / outline.targetWordCount) * 100));
  
  return depthScore;
}

function scoreOutlineCoverage(outline) {
  const sections = outline.sections || [];
  
  // More sections = better coverage
  let score = 50;
  
  if (sections.length >= 3) score += 15;
  if (sections.length >= 5) score += 15;
  if (sections.length >= 7) score += 10;
  if (sections.length >= 10) score += 10;
  
  return Math.min(100, score);
}

function scoreOutlineClarity(outline) {
  const sections = outline.sections || [];
  
  // Check for clear headings and notes
  const hasHeadings = sections.filter(s => s.heading && s.heading.length > 0).length;
  const hasNotes = sections.filter(s => s.notes && s.notes.length > 0).length;
  
  const headingScore = Math.round((hasHeadings / sections.length) * 50);
  const notesScore = Math.round((hasNotes / sections.length) * 50);
  
  return headingScore + notesScore;
}

function scoreOutlineBalance(outline) {
  const sections = outline.sections || [];
  if (sections.length === 0) return 50;
  
  const wordCounts = sections.map(s => s.words || 0);
  const avg = wordCounts.reduce((sum, w) => sum + w, 0) / wordCounts.length;
  
  // Calculate variance
  const variance = wordCounts.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / wordCounts.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower std dev = better balance
  const balanceScore = Math.max(50, 100 - Math.round(stdDev / 5));
  
  return balanceScore;
}

// ================================================================
// COMPLIANCE VALIDATION
// ================================================================

function runComplianceChecks(briefId) {
  const brief = briefs.get(briefId);
  if (!brief) return null;
  
  const checkId = `check-${crypto.randomBytes(4).toString('hex')}`;
  
  const piiCheck = checkPII(brief);
  const claimsCheck = checkClaims(brief);
  const toneCheck = checkTone(brief);
  const legalCheck = checkLegal(brief);
  
  const compliance = {
    checkId,
    briefId,
    pii: piiCheck.status,
    piiIssues: piiCheck.issues,
    claims: claimsCheck.status,
    claimsIssues: claimsCheck.issues,
    tone: toneCheck.status,
    toneIssues: toneCheck.issues,
    legal: legalCheck.status,
    legalIssues: legalCheck.issues,
    overallStatus: computeOverallCompliance([piiCheck, claimsCheck, toneCheck, legalCheck]),
    timestamp: new Date().toISOString()
  };
  
  complianceChecks.set(checkId, compliance);
  return compliance;
}

function checkPII(brief) {
  const text = `${brief.title} ${brief.sections.join(' ')} ${brief.metadata.description || ''}`;
  const textLower = text.toLowerCase();
  
  const piiPatterns = [
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'SSN' },
    { pattern: /\b\d{16}\b/, type: 'Credit Card' },
    { pattern: /@[\w.-]+\.\w+/, type: 'Email (if personal)' }
  ];
  
  const issues = [];
  piiPatterns.forEach(({ pattern, type }) => {
    if (pattern.test(textLower)) {
      issues.push(`Potential ${type} detected`);
    }
  });
  
  return {
    status: issues.length === 0 ? 'clean' : 'flagged',
    issues
  };
}

function checkClaims(brief) {
  const text = `${brief.title} ${brief.sections.join(' ')}`;
  const textLower = text.toLowerCase();
  
  const claimPatterns = [
    'guaranteed',
    '100%',
    'always',
    'never fails',
    'proven',
    'scientifically proven',
    'certified',
    'approved'
  ];
  
  const issues = [];
  claimPatterns.forEach(pattern => {
    if (textLower.includes(pattern)) {
      issues.push(`Unsubstantiated claim: "${pattern}"`);
    }
  });
  
  return {
    status: issues.length === 0 ? 'clean' : 'review_required',
    issues
  };
}

function checkTone(brief) {
  if (!brief.tone) {
    return { status: 'pending', issues: ['Tone not specified'] };
  }
  
  const targetTone = brief.tone.toLowerCase();
  const title = (brief.title || '').toLowerCase();
  
  const issues = [];
  
  // Check for tone mismatches
  if (targetTone === 'professional' && (title.includes('!!!') || title.includes('omg'))) {
    issues.push('Casual language detected in professional brief');
  }
  
  if (targetTone === 'casual' && title.match(/\b(hereby|heretofore|aforementioned)\b/)) {
    issues.push('Overly formal language detected in casual brief');
  }
  
  return {
    status: issues.length === 0 ? 'on-brand' : 'review_required',
    issues
  };
}

function checkLegal(brief) {
  const text = `${brief.title} ${brief.sections.join(' ')}`;
  const textLower = text.toLowerCase();
  
  const legalFlags = [
    'lawsuit',
    'sue',
    'litigation',
    'illegal',
    'violates',
    'infringes'
  ];
  
  const issues = [];
  legalFlags.forEach(flag => {
    if (textLower.includes(flag)) {
      issues.push(`Legal review recommended: "${flag}"`);
    }
  });
  
  return {
    status: issues.length === 0 ? 'cleared' : 'legal_review_required',
    issues
  };
}

function computeOverallCompliance(checks) {
  const statuses = checks.map(c => c.status);
  
  if (statuses.every(s => s === 'clean' || s === 'cleared' || s === 'on-brand')) {
    return 'approved';
  }
  
  if (statuses.some(s => s === 'flagged' || s === 'legal_review_required')) {
    return 'blocked';
  }
  
  return 'review_required';
}

// ================================================================
// PERSONA TARGETING
// ================================================================

function createPersona({
  name,
  role,
  industry,
  painPoints = [],
  goals = [],
  contentPreferences = {}
}) {
  const personaId = `persona-${crypto.randomBytes(4).toString('hex')}`;
  
  const persona = {
    personaId,
    name,
    role,
    industry,
    painPoints,
    goals,
    contentPreferences,
    status: 'active',
    briefCount: 0,
    createdAt: new Date().toISOString()
  };
  
  personas.set(personaId, persona);
  return persona;
}

function matchBriefToPersona(briefId, personaId) {
  const brief = briefs.get(briefId);
  const persona = personas.get(personaId);
  
  if (!brief || !persona) return null;
  
  const roleMatch = brief.targetAudience && 
    brief.targetAudience.toLowerCase().includes(persona.role.toLowerCase());
  
  const painPointMatch = persona.painPoints.some(pain => 
    brief.title.toLowerCase().includes(pain.toLowerCase())
  );
  
  const goalMatch = persona.goals.some(goal =>
    (brief.contentGoal || '').toLowerCase().includes(goal.toLowerCase())
  );
  
  const matchScore = Math.round(
    (roleMatch ? 40 : 0) +
    (painPointMatch ? 35 : 0) +
    (goalMatch ? 25 : 0)
  );
  
  return {
    briefId,
    personaId,
    matchScore,
    roleMatch,
    painPointMatch,
    goalMatch,
    recommendation: matchScore >= 70 ? 'strong' : matchScore >= 50 ? 'moderate' : 'weak'
  };
}

function listPersonas({ status, industry }) {
  let results = Array.from(personas.values());
  
  if (status) {
    results = results.filter(p => p.status === status);
  }
  
  if (industry) {
    results = results.filter(p => p.industry === industry);
  }
  
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ================================================================
// APPROVAL WORKFLOWS
// ================================================================

function submitForApproval(briefId, approvers = []) {
  const brief = briefs.get(briefId);
  if (!brief) return null;
  
  const approvalId = `approval-${crypto.randomBytes(4).toString('hex')}`;
  
  const approval = {
    approvalId,
    briefId,
    approvers,
    status: 'pending',
    responses: [],
    submittedAt: new Date().toISOString(),
    submittedBy: brief.createdBy
  };
  
  approvals.set(approvalId, approval);
  
  brief.approvalStatus = 'pending';
  brief.approvers = approvers;
  briefs.set(briefId, brief);
  
  return approval;
}

function recordApprovalResponse(approvalId, approverId, decision, comments = '') {
  const approval = approvals.get(approvalId);
  if (!approval) return null;
  
  const response = {
    approverId,
    decision, // 'approved', 'rejected', 'changes_requested'
    comments,
    timestamp: new Date().toISOString()
  };
  
  approval.responses.push(response);
  
  // Update overall status
  const allResponded = approval.responses.length === approval.approvers.length;
  
  if (allResponded) {
    const allApproved = approval.responses.every(r => r.decision === 'approved');
    const anyRejected = approval.responses.some(r => r.decision === 'rejected');
    
    if (allApproved) {
      approval.status = 'approved';
    } else if (anyRejected) {
      approval.status = 'rejected';
    } else {
      approval.status = 'changes_requested';
    }
    
    // Update brief status
    const brief = briefs.get(approval.briefId);
    if (brief) {
      brief.approvalStatus = approval.status;
      briefs.set(approval.briefId, brief);
    }
  }
  
  approvals.set(approvalId, approval);
  return approval;
}

function getApprovalStatus(briefId) {
  const approval = Array.from(approvals.values())
    .find(a => a.briefId === briefId);
  
  return approval || null;
}

// ================================================================
// TEMPLATE MANAGEMENT
// ================================================================

function createTemplate({ name, description, sections, category = 'general' }) {
  const templateId = `template-${crypto.randomBytes(4).toString('hex')}`;
  
  const template = {
    templateId,
    name,
    description,
    sections,
    category,
    usageCount: 0,
    createdAt: new Date().toISOString()
  };
  
  templates.set(templateId, template);
  return template;
}

function applyTemplate(templateId, briefData = {}) {
  const template = templates.get(templateId);
  if (!template) return null;
  
  // Increment usage
  template.usageCount++;
  templates.set(templateId, template);
  
  // Create brief from template
  const brief = createBrief({
    ...briefData,
    sections: template.sections
  });
  
  return brief;
}

function listTemplates({ category }) {
  let results = Array.from(templates.values());
  
  if (category) {
    results = results.filter(t => t.category === category);
  }
  
  return results.sort((a, b) => b.usageCount - a.usageCount);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Brief management
  createBrief,
  getBrief,
  listBriefs,
  updateBrief,
  deleteBrief,
  scoreBrief,
  
  // Outline management
  createOutline,
  getOutline,
  listOutlines,
  updateOutline,
  deleteOutline,
  gradeOutline,
  
  // Compliance
  runComplianceChecks,
  checkPII,
  checkClaims,
  checkTone,
  checkLegal,
  
  // Personas
  createPersona,
  matchBriefToPersona,
  listPersonas,
  
  // Approvals
  submitForApproval,
  recordApprovalResponse,
  getApprovalStatus,
  
  // Templates
  createTemplate,
  applyTemplate,
  listTemplates,
  
  // Internal stores
  briefs,
  outlines,
  templates,
  approvals,
  complianceChecks,
  personas
};
