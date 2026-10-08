'use strict';
const APP_METRICS = {
  ios: { dau: 8420, mau: 28400, sessions: 42840, avgSessionMin: 4.2, crashRate: 0.0012, ratingAvg: 4.7, ratingCount: 2840, retentionD1: 0.42, retentionD7: 0.28, retentionD30: 0.18 },
  android: { dau: 12840, mau: 42800, sessions: 68420, avgSessionMin: 3.8, crashRate: 0.0024, ratingAvg: 4.5, ratingCount: 4820, retentionD1: 0.38, retentionD7: 0.24, retentionD30: 0.15 },
};
const SCREENS = [
  {screen:'/home',views:284200,uniqueUsers:48200,avgDwellSec:28,bounceRate:0.18},
  {screen:'/product/:id',views:184200,uniqueUsers:42800,avgDwellSec:92,bounceRate:0.32},
  {screen:'/cart',views:48200,uniqueUsers:28400,avgDwellSec:64,bounceRate:0.48},
  {screen:'/checkout',views:28400,uniqueUsers:18400,avgDwellSec:124,bounceRate:0.22},
];
const EVENTS = [
  {event:'add_to_cart',count:48420,trend:'+12%'},
  {event:'begin_checkout',count:28420,trend:'+8%'},
  {event:'purchase',count:18420,conversionValue:184200,trend:'+18%'},
  {event:'product_view',count:184200,trend:'+4%'},
];
const PUSH_CAMPAIGNS = [
  {id:'push1',title:'Flash Sale starts NOW',status:'sent',sent:28400,opened:8420,openRate:0.296,revenue:18420,sentAt:'2026-07-25T10:00:00Z'},
  {id:'push2',title:'Your cart is waiting',status:'active',sent:4820,opened:1840,openRate:0.381,revenue:8420,sentAt:'2026-07-26T08:00:00Z'},
];
class MobileAppEngine {
  getAppMetrics() { return APP_METRICS; }
  getScreens() { return SCREENS; }
  getEvents() { return EVENTS; }
  getPushCampaigns() { return PUSH_CAMPAIGNS; }
  getDashboardStats() {
    return { totalDau: APP_METRICS.ios.dau + APP_METRICS.android.dau, totalMau: APP_METRICS.ios.mau + APP_METRICS.android.mau, iosCrashRate: APP_METRICS.ios.crashRate, androidCrashRate: APP_METRICS.android.crashRate, avgRating: parseFloat(((APP_METRICS.ios.ratingAvg * APP_METRICS.ios.ratingCount + APP_METRICS.android.ratingAvg * APP_METRICS.android.ratingCount) / (APP_METRICS.ios.ratingCount + APP_METRICS.android.ratingCount)).toFixed(2)), pushCampaigns: PUSH_CAMPAIGNS.length };
  }
}
module.exports = new MobileAppEngine();
module.exports.MobileAppEngine = MobileAppEngine;
