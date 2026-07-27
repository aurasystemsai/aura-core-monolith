'use strict';
const CONSENTS = [
  {id:'c1',customerId:'C-001',email:'jane@example.com',marketing:true,analytics:true,thirdParty:false,gdprLawfulBasis:'consent',collectedAt:'2026-01-15T10:00:00Z',source:'checkout',ipAddress:'masked',country:'GB'},
  {id:'c2',customerId:'C-002',email:'marcus@example.com',marketing:false,analytics:true,thirdParty:false,gdprLawfulBasis:'legitimate_interest',collectedAt:'2026-02-20T09:00:00Z',source:'account',ipAddress:'masked',country:'DE'},
  {id:'c3',customerId:'C-003',email:'sarah@example.com',marketing:true,analytics:true,thirdParty:true,gdprLawfulBasis:'consent',collectedAt:'2026-03-10T11:00:00Z',source:'newsletter_signup',ipAddress:'masked',country:'GB'},
];
const DSAR_REQUESTS = [
  {id:'dsar1',type:'access',customerEmail:'test@example.com',status:'completed',requestedAt:'2026-07-01T10:00:00Z',completedAt:'2026-07-08T14:00:00Z',dueBy:'2026-07-31T10:00:00Z',data:{orders:12,reviews:2,marketingEmails:180}},
  {id:'dsar2',type:'deletion',customerEmail:'delete@example.com',status:'in_progress',requestedAt:'2026-07-20T09:00:00Z',completedAt:null,dueBy:'2026-08-19T09:00:00Z'},
  {id:'dsar3',type:'portability',customerEmail:'export@example.com',status:'pending',requestedAt:'2026-07-25T14:00:00Z',completedAt:null,dueBy:'2026-08-24T14:00:00Z'},
];
const COMPLIANCE_CHECKS = [
  {id:'cc1',name:'GDPR Consent Records',status:'compliant',lastChecked:'2026-07-26T06:00:00Z',details:'All marketing consents recorded with timestamp and source'},
  {id:'cc2',name:'Cookie Banner',status:'compliant',lastChecked:'2026-07-26T06:00:00Z',details:'Cookie consent banner active on all pages, TCF 2.2 compliant'},
  {id:'cc3',name:'Privacy Policy',status:'warning',lastChecked:'2026-07-26T06:00:00Z',details:'Privacy policy last updated 180 days ago — review recommended'},
  {id:'cc4',name:'Data Retention',status:'compliant',lastChecked:'2026-07-26T06:00:00Z',details:'Auto-deletion of inactive customer data after 3 years configured'},
  {id:'cc5',name:'DSAR Response Time',status:'compliant',lastChecked:'2026-07-26T06:00:00Z',details:'Average DSAR response time: 7.2 days (limit: 30 days)'},
  {id:'cc6',name:'CCPA Opt-Out',status:'compliant',lastChecked:'2026-07-26T06:00:00Z',details:'Do Not Sell/Share link present in footer and privacy policy'},
];
class CompliancePrivacyEngine {
  getConsents(opts = {}) {
    let c = CONSENTS;
    if (opts.country) c = c.filter(x => x.country === opts.country);
    if (opts.marketing !== undefined) c = c.filter(x => String(x.marketing) === opts.marketing);
    return c;
  }
  getDsarRequests(opts = {}) {
    let d = DSAR_REQUESTS;
    if (opts.status) d = d.filter(x => x.status === opts.status);
    if (opts.type) d = d.filter(x => x.type === opts.type);
    return d;
  }
  getDsarRequest(id) { return DSAR_REQUESTS.find(d => d.id === id) || null; }
  getComplianceChecks() { return COMPLIANCE_CHECKS; }
  getDashboardStats() {
    return {
      totalConsentRecords: CONSENTS.length,
      marketingConsentRate: parseFloat((CONSENTS.filter(c => c.marketing).length / CONSENTS.length).toFixed(2)),
      openDsarRequests: DSAR_REQUESTS.filter(d => d.status !== 'completed').length,
      overdueRequests: 0,
      complianceScore: Math.round(COMPLIANCE_CHECKS.filter(c => c.status === 'compliant').length / COMPLIANCE_CHECKS.length * 100),
      warnings: COMPLIANCE_CHECKS.filter(c => c.status === 'warning').length,
      checksTotal: COMPLIANCE_CHECKS.length,
    };
  }
  createDsarRequest(type, customerEmail) {
    const dueDate = new Date(Date.now() + 30 * 86400000);
    return { id: 'dsar_' + Date.now(), type, customerEmail, status: 'pending', requestedAt: new Date().toISOString(), dueBy: dueDate.toISOString(), message: 'DSAR request created. Response due within 30 days as per GDPR Article 12.' };
  }
  deleteCustomerData(customerId, reason) {
    return { customerId, status: 'queued', reason, deletionScope: ['personal_data', 'marketing_preferences', 'browsing_history'], retainedScope: ['order_records_7yr', 'fraud_prevention'], scheduledAt: new Date().toISOString(), completionEstimate: '24-48 hours' };
  }
}
module.exports = new CompliancePrivacyEngine();
module.exports.CompliancePrivacyEngine = CompliancePrivacyEngine;
