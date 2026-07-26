'use strict';
const DOMAINS = [
  {id:'d1',domain:'mail.brand.com',status:'healthy',spfValid:true,dkimValid:true,dmarcPolicy:'quarantine',reputation:94,spamRate:0.0012,inboxRate:0.96,lastChecked:'2026-07-26T09:00:00Z'},
  {id:'d2',domain:'promo.brand.com',status:'warning',spfValid:true,dkimValid:false,dmarcPolicy:'none',reputation:72,spamRate:0.024,inboxRate:0.81,lastChecked:'2026-07-26T09:00:00Z'},
  {id:'d3',domain:'transact.brand.com',status:'healthy',spfValid:true,dkimValid:true,dmarcPolicy:'reject',reputation:98,spamRate:0.0004,inboxRate:0.99,lastChecked:'2026-07-26T09:00:00Z'},
];
const BLACKLISTS = [
  {id:'bl1',list:'Spamhaus ZEN',checked:'2026-07-26T09:00:00Z',listed:false},
  {id:'bl2',list:'Barracuda',checked:'2026-07-26T09:00:00Z',listed:false},
  {id:'bl3',list:'SORBS',checked:'2026-07-26T09:00:00Z',listed:false},
];
const ISP_METRICS = [
  {isp:'Gmail',inboxRate:0.97,spamRate:0.018,deferRate:0.005,volume:48420},
  {isp:'Outlook',inboxRate:0.94,spamRate:0.032,deferRate:0.012,volume:28420},
  {isp:'Yahoo',inboxRate:0.91,spamRate:0.042,deferRate:0.008,volume:12840},
  {isp:'Apple Mail',inboxRate:0.98,spamRate:0.012,deferRate:0.002,volume:8420},
];
class EmailDeliverabilityEngine {
  getDomains() { return DOMAINS; }
  getBlacklists() { return BLACKLISTS; }
  getIspMetrics() { return ISP_METRICS; }
  checkDomain(domain) {
    const d = DOMAINS.find(x => x.domain === domain);
    if (d) return d;
    return { domain, status: 'unknown', spfValid: null, dkimValid: null, dmarcPolicy: 'none', reputation: null, message: 'Domain not yet monitored' };
  }
  getRecommendations() {
    return [
      { severity: 'high', domain: 'promo.brand.com', issue: 'DKIM not configured', fix: 'Add DKIM TXT record to DNS for selector "promo"', impact: 'Inbox rate will drop to <60% without DKIM' },
      { severity: 'medium', domain: 'promo.brand.com', issue: 'DMARC policy is "none"', fix: 'Upgrade to "quarantine" after DKIM is fixed', impact: 'Phishing risk and reduced deliverability' },
      { severity: 'low', domain: 'mail.brand.com', issue: 'DMARC policy is "quarantine" not "reject"', fix: 'Upgrade to p=reject for maximum protection', impact: 'Minor security improvement' },
    ];
  }
  getDashboardStats() {
    return {
      totalDomains: DOMAINS.length,
      healthyDomains: DOMAINS.filter(d => d.status === 'healthy').length,
      warningDomains: DOMAINS.filter(d => d.status === 'warning').length,
      avgReputation: Math.round(DOMAINS.reduce((s, d) => s + d.reputation, 0) / DOMAINS.length),
      avgInboxRate: parseFloat((DOMAINS.reduce((s, d) => s + d.inboxRate, 0) / DOMAINS.length).toFixed(3)),
      blacklistsClear: BLACKLISTS.filter(b => !b.listed).length,
      blacklistsChecked: BLACKLISTS.length,
    };
  }
}
module.exports = new EmailDeliverabilityEngine();
module.exports.EmailDeliverabilityEngine = EmailDeliverabilityEngine;
