'use strict';
const LAUNCHES = [
  {id:'l1',name:'Black Friday 2026',status:'planning',launchDate:'2026-11-28T00:00:00Z',daysUntil:125,progress:0.18,budget:12000,estimatedRevenue:84000,roas:7.0,channels:['email','sms','meta','google','tiktok'],milestones:[{name:'Creative brief',due:'2026-08-15',done:false},{name:'Ad creative',due:'2026-09-01',done:false},{name:'Email sequences',due:'2026-09-15',done:false},{name:'Inventory order',due:'2026-08-01',done:false}]},
  {id:'l2',name:'Autumn Collection Drop',status:'active',launchDate:'2026-09-01T09:00:00Z',daysUntil:37,progress:0.62,budget:4000,estimatedRevenue:28000,roas:7.0,channels:['email','meta','instagram'],milestones:[{name:'Product photography',due:'2026-07-15',done:true},{name:'Lookbook copy',due:'2026-07-30',done:false},{name:'Email sequence',due:'2026-08-10',done:false}]},
  {id:'l3',name:'Summer Flash Sale',status:'completed',launchDate:'2026-07-25T09:00:00Z',daysUntil:0,progress:1.0,budget:2000,actualRevenue:18420,roas:9.21,channels:['email','sms'],milestones:[{name:'All steps',due:'2026-07-20',done:true}]},
];
const LAUNCH_TEMPLATES = [
  {id:'lt1',name:'Flash Sale (1-3 days)',phases:['Teaser email','Sale launch email + SMS','Reminder email (24hr left)','Last chance SMS','Post-sale thank you'],channels:['email','sms'],estimatedLift:'15-25%'},
  {id:'lt2',name:'New Collection Drop',phases:['Pre-launch waitlist','Launch day email + social','Influencer seeding','Week 2 follow-up','Review request'],channels:['email','social','influencer'],estimatedLift:'8-15%'},
  {id:'lt3',name:'Black Friday / BFCM',phases:['6-week build-up content','Pre-sale VIP access','BF launch all channels','Cyber Monday extension','Post-BFCM win-back'],channels:['email','sms','meta','google','tiktok'],estimatedLift:'40-80%'},
];
class LaunchPlannerEngine {
  getLaunches(opts = {}) { let l = LAUNCHES; if (opts.status) l = l.filter(x => x.status === opts.status); return l; }
  getLaunch(id) { return LAUNCHES.find(l => l.id === id) || null; }
  getTemplates() { return LAUNCH_TEMPLATES; }
  getDashboardStats() {
    const active = LAUNCHES.filter(l => l.status === 'active' || l.status === 'planning');
    const completed = LAUNCHES.find(l => l.status === 'completed');
    return { totalLaunches: LAUNCHES.length, activeLaunches: active.length, upcomingLaunches: LAUNCHES.filter(l => l.status === 'planning').length, totalBudget: active.reduce((s, l) => s + l.budget, 0), estimatedRevenue: active.reduce((s, l) => s + (l.estimatedRevenue || 0), 0), lastLaunchRoas: completed ? completed.roas : null, templatesAvailable: LAUNCH_TEMPLATES.length };
  }
  generateLaunchPlan(name, launchDate, budget, channels, templateId) {
    const tpl = this.getTemplates().find(t => t.id === templateId) || LAUNCH_TEMPLATES[0];
    const daysUntil = Math.max(1, Math.round((new Date(launchDate).getTime() - Date.now()) / 86400000));
    const milestones = tpl.phases.map((phase, i) => {
      const dueDate = new Date(Date.now() + (daysUntil * (i + 1) / (tpl.phases.length + 1)) * 86400000);
      return { name: phase, due: dueDate.toISOString().split('T')[0], done: false };
    });
    return { name, launchDate, budget, channels: channels || tpl.channels, milestones, estimatedRevenue: Math.round(budget * 7), roas: 7.0, template: tpl.name, generatedAt: new Date().toISOString() };
  }
}
module.exports = new LaunchPlannerEngine();
module.exports.LaunchPlannerEngine = LaunchPlannerEngine;
