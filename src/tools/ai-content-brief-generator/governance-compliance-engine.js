const crypto = require('crypto');

// ============================================================================
// DATA STORES
// ============================================================================

const approvals = new Map();
const auditTrail = [];
const policies = new Map();
const complianceChecks = new Map();
const violations = new Map();
const riskAssessments = new Map();
const regulatoryReports = new Map();

// ============================================================================
// DEFAULT POLICIES
// ============================================================================

const defaultPolicies = [
  { id: 'pii', name: 'No PII in prompts', severity: 'high', category: 'privacy' },
  { id: 'claims', name: 'Claims must be cited', severity: 'medium', category: 'accuracy' },
  { id: 'tone', name: 'Brand tone compliance', severity: 'medium', category: 'brand' },
  { id: 'region', name: 'Localization reviewed', severity: 'low', category: 'localization' },
  { id: 'legal', name: 'Legal review required', severity: 'high', category: 'legal' },
  { id: 'accessibility', name: 'WCAG 2.1 AA compliance', severity: 'medium', category: 'accessibility' },
  { id: 'gdpr', name: 'GDPR compliance', severity: 'high', category: 'privacy' },
  { id: 'copyright', name: 'Copyright verification', severity: 'high', category: 'legal' }
];

// Initialize default policies
defaultPolicies.forEach(p => policies.set(p.id, p));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function calculateComplianceScore(checks) {
  const total = checks.length || 1;
  const passed = checks.filter(c => c.passed).length;
  return Math.round((passed / total) * 100);
}

// ============================================================================
// COMPLIANCE EVALUATION
// ============================================================================

function evaluateCompliance(data = {}) {
  const evaluationId = generateId('eval');
  const issues = [];
  const checks = [];
  
  // PII Check
  const piiCheck = {
    policyId: 'pii',
    name: 'PII Detection',
    passed: !data.containsPII,
    severity: 'high'
  };
  checks.push(piiCheck);
  if (data.containsPII) {
    issues.push({ policyId: 'pii', message: 'Remove PII from prompt', severity: 'high', remediation: 'Anonymize personal data' });
  }
  
  // Citations Check
  const citationsCheck = {
    policyId: 'claims',
    name: 'Citation Validation',
    passed: data.citations && data.citations >= 2,
    severity: 'medium'
  };
  checks.push(citationsCheck);
  if (!citationsCheck.passed) {
    issues.push({ policyId: 'claims', message: 'Add at least 2 citations', severity: 'medium', remediation: 'Include credible sources' });
  }
  
  // Brand Tone Check
  const toneCheck = {
    policyId: 'tone',
    name: 'Brand Tone Alignment',
    passed: !data.tone || data.tone === 'on-brand',
    severity: 'medium'
  };
  checks.push(toneCheck);
  if (!toneCheck.passed) {
    issues.push({ policyId: 'tone', message: 'Tone deviates from brand guidance', severity: 'medium', remediation: 'Align with brand voice guidelines' });
  }
  
  // Legal Review Check
  const legalCheck = {
    policyId: 'legal',
    name: 'Legal Review',
    passed: !!data.legalApproved,
    severity: 'high'
  };
  checks.push(legalCheck);
  if (!legalCheck.passed) {
    issues.push({ policyId: 'legal', message: 'Legal review required', severity: 'high', remediation: 'Submit for legal approval' });
  }
  
  // GDPR Compliance
  const gdprCheck = {
    policyId: 'gdpr',
    name: 'GDPR Compliance',
    passed: !!data.gdprCompliant,
    severity: 'high'
  };
  checks.push(gdprCheck);
  if (!gdprCheck.passed) {
    issues.push({ policyId: 'gdpr', message: 'GDPR compliance not verified', severity: 'high', remediation: 'Verify GDPR requirements' });
  }
  
  // Accessibility Check
  const accessibilityCheck = {
    policyId: 'accessibility',
    name: 'Accessibility Standards',
    passed: !!data.accessibilityVerified,
    severity: 'medium'
  };
  checks.push(accessibilityCheck);
  if (!accessibilityCheck.passed) {
    issues.push({ policyId: 'accessibility', message: 'Accessibility not verified', severity: 'medium', remediation: 'Test against WCAG 2.1 AA' });
  }
  
  const complianceScore = calculateComplianceScore(checks);
  const passes = issues.length === 0;
  const status = passes ? 'approved' : issues.some(i => i.severity === 'high') ? 'blocked' : 'action_required';
  
  const evaluation = {
    evaluationId,
    briefId: data.briefId || 'unknown',
    checks,
    issues,
    complianceScore,
    passes,
    status,
    nextSteps: passes ? [] : issues.map(i => i.remediation),
    riskLevel: issues.some(i => i.severity === 'high') ? 'high' : issues.length > 0 ? 'medium' : 'low',
    evaluatedAt: new Date().toISOString()
  };
  
  complianceChecks.set(evaluationId, evaluation);
  logAudit(data.briefId || 'unknown', `Compliance evaluated: ${status} (Score: ${complianceScore})`);
  
  // Record violations if any
  if (issues.length > 0) {
    recordViolation(data.briefId, issues);
  }
  
  return evaluation;
}

function getComplianceCheck(evaluationId) {
  if (!complianceChecks.has(evaluationId)) {
    throw new Error('Compliance check not found');
  }
  return complianceChecks.get(evaluationId);
}

function listComplianceChecks(filters = {}) {
  let results = Array.from(complianceChecks.values());
  
  if (filters.status) {
    results = results.filter(check => check.status === filters.status);
  }
  
  if (filters.briefId) {
    results = results.filter(check => check.briefId === filters.briefId);
  }
  
  if (filters.riskLevel) {
    results = results.filter(check => check.riskLevel === filters.riskLevel);
  }
  
  return results;
}

// ============================================================================
// POLICY MANAGEMENT
// ============================================================================

function listPolicies(filters = {}) {
  let results = Array.from(policies.values());
  
  if (filters.category) {
    results = results.filter(p => p.category === filters.category);
  }
  
  if (filters.severity) {
    results = results.filter(p => p.severity === filters.severity);
  }
  
  return results;
}

function getPolicy(policyId) {
  if (!policies.has(policyId)) {
    throw new Error('Policy not found');
  }
  return policies.get(policyId);
}

function createPolicy(policyData) {
  const policyId = policyData.id || generateId('policy');
  
  const policy = {
    id: policyId,
    name: policyData.name || 'New Policy',
    description: policyData.description || '',
    severity: policyData.severity || 'medium',
    category: policyData.category || 'general',
    checks: policyData.checks || [],
    active: policyData.active !== false,
    createdAt: new Date().toISOString()
  };
  
  policies.set(policyId, policy);
  logAudit('system', `Policy created: ${policy.name}`);
  
  return policy;
}

function updatePolicy(policyId, updates) {
  const policy = getPolicy(policyId);
  
  const updated = {
    ...policy,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  policies.set(policyId, updated);
  logAudit('system', `Policy updated: ${policy.name}`);
  
  return updated;
}

function deletePolicy(policyId) {
  if (!policies.has(policyId)) {
    throw new Error('Policy not found');
  }
  
  policies.delete(policyId);
  logAudit('system', `Policy deleted: ${policyId}`);
  
  return { success: true, message: 'Policy deleted' };
}

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

function requestApproval(data = {}) {
  const approvalId = generateId('apr');
  
  const approval = {
    approvalId,
    briefId: data.briefId || 'unknown',
    type: data.type || 'content',
    owner: data.owner || 'Content Lead',
    reviewer: data.reviewer || 'Legal',
    status: 'pending',
    comments: [],
    submittedAt: new Date().toISOString(),
    dueDate: data.dueDate || new Date(Date.now() + 48 * 3600e3).toISOString(),
    priority: data.priority || 'medium'
  };
  
  approvals.set(approvalId, approval);
  logAudit(approval.briefId, `Approval requested by ${approval.owner}, assigned to ${approval.reviewer}`);
  
  return approval;
}

function getApproval(approvalId) {
  if (!approvals.has(approvalId)) {
    throw new Error('Approval not found');
  }
  return approvals.get(approvalId);
}

function updateApprovalStatus(approvalId, status, comments = '') {
  const approval = getApproval(approvalId);
  
  approval.status = status;
  approval.reviewedAt = new Date().toISOString();
  
  if (comments) {
    approval.comments.push({
      author: approval.reviewer,
      text: comments,
      timestamp: new Date().toISOString()
    });
  }
  
  approvals.set(approvalId, approval);
  logAudit(approval.briefId, `Approval ${status} by ${approval.reviewer}`);
  
  return approval;
}

function listApprovals(filters = {}) {
  let results = Array.from(approvals.values());
  
  if (filters.status) {
    results = results.filter(a => a.status === filters.status);
  }
  
  if (filters.briefId) {
    results = results.filter(a => a.briefId === filters.briefId);
  }
  
  if (filters.reviewer) {
    results = results.filter(a => a.reviewer === filters.reviewer);
  }
  
  return results;
}

// ============================================================================
// VIOLATION TRACKING
// ============================================================================

function recordViolation(briefId, issues) {
  const violationId = generateId('violation');
  
  const violation = {
    id: violationId,
    briefId,
    issues,
    severity: issues.some(i => i.severity === 'high') ? 'high' : 'medium',
    status: 'open',
    reportedAt: new Date().toISOString(),
    resolvedAt: null
  };
  
  violations.set(violationId, violation);
  logAudit(briefId, `Violation recorded: ${issues.length} issue(s)`);
  
  return violation;
}

function getViolation(violationId) {
  if (!violations.has(violationId)) {
    throw new Error('Violation not found');
  }
  return violations.get(violationId);
}

function resolveViolation(violationId, resolution) {
  const violation = getViolation(violationId);
  
  violation.status = 'resolved';
  violation.resolution = resolution;
  violation.resolvedAt = new Date().toISOString();
  
  violations.set(violationId, violation);
  logAudit(violation.briefId, `Violation resolved: ${violationId}`);
  
  return violation;
}

function listViolations(filters = {}) {
  let results = Array.from(violations.values());
  
  if (filters.status) {
    results = results.filter(v => v.status === filters.status);
  }
  
  if (filters.severity) {
    results = results.filter(v => v.severity === filters.severity);
  }
  
  if (filters.briefId) {
    results = results.filter(v => v.briefId === filters.briefId);
  }
  
  return results;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

function assessRisk(briefId, riskData = {}) {
  const assessmentId = generateId('risk');
  
  const riskFactors = {
    legalRisk: riskData.legalRisk || 0,
    privacyRisk: riskData.privacyRisk || 0,
    brandRisk: riskData.brandRisk || 0,
    complianceRisk: riskData.complianceRisk || 0
  };
  
  const overallRisk = Math.round(
    (riskFactors.legalRisk * 0.35 +
     riskFactors.privacyRisk * 0.30 +
     riskFactors.brandRisk * 0.20 +
     riskFactors.complianceRisk * 0.15)
  );
  
  const riskLevel = overallRisk >= 75 ? 'high' : overallRisk >= 50 ? 'medium' : 'low';
  
  const assessment = {
    id: assessmentId,
    briefId,
    riskFactors,
    overallRisk,
    riskLevel,
    mitigationSteps: [],
    assessedAt: new Date().toISOString()
  };
  
  // Generate mitigation steps
  if (riskFactors.legalRisk >= 50) {
    assessment.mitigationSteps.push('Obtain legal review before publication');
  }
  if (riskFactors.privacyRisk >= 50) {
    assessment.mitigationSteps.push('Conduct privacy impact assessment');
  }
  if (riskFactors.brandRisk >= 50) {
    assessment.mitigationSteps.push('Align content with brand guidelines');
  }
  if (riskFactors.complianceRisk >= 50) {
    assessment.mitigationSteps.push('Verify regulatory compliance');
  }
  
  riskAssessments.set(assessmentId, assessment);
  logAudit(briefId, `Risk assessment completed: ${riskLevel} risk (${overallRisk}/100)`);
  
  return assessment;
}

function getRiskAssessment(assessmentId) {
  if (!riskAssessments.has(assessmentId)) {
    throw new Error('Risk assessment not found');
  }
  return riskAssessments.get(assessmentId);
}

function listRiskAssessments(filters = {}) {
  let results = Array.from(riskAssessments.values());
  
  if (filters.riskLevel) {
    results = results.filter(r => r.riskLevel === filters.riskLevel);
  }
  
  if (filters.briefId) {
    results = results.filter(r => r.briefId === filters.briefId);
  }
  
  return results;
}

// ============================================================================
// REGULATORY REPORTING
// ============================================================================

function generateRegulatoryReport(options = {}) {
  const reportId = generateId('report');
  
  const timeRange = options.timeRange || '30d';
  const endDate = new Date();
  const startDate = new Date(endDate - (parseInt(timeRange) || 30) * 24 * 3600e3);
  
  const checksInRange = Array.from(complianceChecks.values())
    .filter(check => new Date(check.evaluatedAt) >= startDate);
  
  const violationsInRange = Array.from(violations.values())
    .filter(v => new Date(v.reportedAt) >= startDate);
  
  const report = {
    id: reportId,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      duration: timeRange
    },
    summary: {
      totalChecks: checksInRange.length,
      passedChecks: checksInRange.filter(c => c.passes).length,
      failedChecks: checksInRange.filter(c => !c.passes).length,
      totalViolations: violationsInRange.length,
      openViolations: violationsInRange.filter(v => v.status === 'open').length,
      resolvedViolations: violationsInRange.filter(v => v.status === 'resolved').length,
      averageComplianceScore: checksInRange.length 
        ? Math.round(checksInRange.reduce((sum, c) => sum + c.complianceScore, 0) / checksInRange.length)
        : 0
    },
    byPolicy: {},
    bySeverity: {
      high: violationsInRange.filter(v => v.severity === 'high').length,
      medium: violationsInRange.filter(v => v.severity === 'medium').length,
      low: violationsInRange.filter(v => v.severity === 'low').length
    },
    trends: {
      improving: checksInRange.length > 10 && checksInRange.slice(-5).every(c => c.passes),
      degrading: checksInRange.length > 10 && checksInRange.slice(-5).every(c => !c.passes)
    },
    generatedAt: new Date().toISOString()
  };
  
  regulatoryReports.set(reportId, report);
  logAudit('system', `Regulatory report generated: ${reportId}`);
  
  return report;
}

function getRegulatoryReport(reportId) {
  if (!regulatoryReports.has(reportId)) {
    throw new Error('Regulatory report not found');
  }
  return regulatoryReports.get(reportId);
}

function listRegulatoryReports() {
  return Array.from(regulatoryReports.values());
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

function logAudit(briefId, action) {
  const entry = { 
    id: generateId('audit'), 
    briefId, 
    action, 
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  auditTrail.push(entry);
  return entry;
}

function getAuditTrail(briefId, options = {}) {
  let results = auditTrail.filter((a) => !briefId || a.briefId === briefId);
  
  if (options.limit) {
    results = results.slice(-options.limit);
  } else {
    results = results.slice(-50); // Default last 50
  }
  
  return results;
}

function searchAuditTrail(query) {
  return auditTrail.filter(entry => 
    entry.action.toLowerCase().includes(query.toLowerCase()) ||
    entry.briefId.toLowerCase().includes(query.toLowerCase())
  ).slice(-100);
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

function getStats() {
  const allChecks = Array.from(complianceChecks.values());
  const allViolations = Array.from(violations.values());
  const allApprovals = Array.from(approvals.values());
  
  return {
    totalComplianceChecks: allChecks.length,
    passedChecks: allChecks.filter(c => c.passes).length,
    failedChecks: allChecks.filter(c => !c.passes).length,
    averageComplianceScore: allChecks.length 
      ? Math.round(allChecks.reduce((sum, c) => sum + c.complianceScore, 0) / allChecks.length)
      : 0,
    totalViolations: allViolations.length,
    openViolations: allViolations.filter(v => v.status === 'open').length,
    resolvedViolations: allViolations.filter(v => v.status === 'resolved').length,
    totalApprovals: allApprovals.length,
    pendingApprovals: allApprovals.filter(a => a.status === 'pending').length,
    approvedCount: allApprovals.filter(a => a.status === 'approved').length,
    rejectedCount: allApprovals.filter(a => a.status === 'rejected').length,
    totalPolicies: policies.size,
    activePolicies: Array.from(policies.values()).filter(p => p.active).length,
    totalRiskAssessments: riskAssessments.size,
    highRiskCount: Array.from(riskAssessments.values()).filter(r => r.riskLevel === 'high').length,
    auditTrailSize: auditTrail.length
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Compliance Evaluation
  evaluateCompliance,
  getComplianceCheck,
  listComplianceChecks,
  
  // Policy Management
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  
  // Approvals
  requestApproval,
  getApproval,
  updateApprovalStatus,
  listApprovals,
  
  // Violations
  recordViolation,
  getViolation,
  resolveViolation,
  listViolations,
  
  // Risk Assessment
  assessRisk,
  getRiskAssessment,
  listRiskAssessments,
  
  // Regulatory Reporting
  generateRegulatoryReport,
  getRegulatoryReport,
  listRegulatoryReports,
  
  // Audit Trail
  logAudit,
  getAuditTrail,
  searchAuditTrail,
  
  // Statistics
  getStats,
};
