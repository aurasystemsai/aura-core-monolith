'use strict';
const ASSETS = [
  {id:'a1',name:'Summer_Hero_Banner.jpg',type:'image',mimeType:'image/jpeg',sizeKb:284,tags:['summer','hero','banner','homepage'],usageCount:12,collections:['Homepage','Summer Sale'],uploadedAt:'2026-07-01T10:00:00Z',url:'/assets/summer-hero.jpg',width:2400,height:1200},
  {id:'a2',name:'EcoHoodie_Lookbook.pdf',type:'document',mimeType:'application/pdf',sizeKb:4820,tags:['lookbook','hoodie','press'],usageCount:4,collections:['Press Kit'],uploadedAt:'2026-07-10T09:00:00Z',url:'/assets/eco-hoodie-lookbook.pdf'},
  {id:'a3',name:'Brand_Logo_Full_Color.svg',type:'image',mimeType:'image/svg+xml',sizeKb:24,tags:['logo','brand','primary'],usageCount:284,collections:['Brand Assets'],uploadedAt:'2026-01-01T00:00:00Z',url:'/assets/logo.svg'},
  {id:'a4',name:'Product_Shoot_Q3_2026.zip',type:'archive',mimeType:'application/zip',sizeKb:284200,tags:['product','photography','Q3'],usageCount:0,collections:['Product Photography'],uploadedAt:'2026-07-20T14:00:00Z',url:'/assets/product-q3.zip'},
  {id:'a5',name:'Summer_Sale_TV_Spot_30s.mp4',type:'video',mimeType:'video/mp4',sizeKb:48200,tags:['video','ad','summer'],usageCount:2,collections:['Advertising'],uploadedAt:'2026-06-25T11:00:00Z',url:'/assets/summer-tv-spot.mp4',durationSec:30},
];
const COLLECTIONS = [
  {id:'c1',name:'Homepage',assetCount:4,lastUpdated:'2026-07-20T10:00:00Z'},
  {id:'c2',name:'Summer Sale',assetCount:12,lastUpdated:'2026-07-01T08:00:00Z'},
  {id:'c3',name:'Brand Assets',assetCount:8,lastUpdated:'2026-06-01T00:00:00Z'},
  {id:'c4',name:'Press Kit',assetCount:6,lastUpdated:'2026-07-10T09:00:00Z'},
  {id:'c5',name:'Product Photography',assetCount:84,lastUpdated:'2026-07-20T14:00:00Z'},
];
class DamEngine {
  getAssets(opts = {}) {
    let a = ASSETS;
    if (opts.type) a = a.filter(x => x.type === opts.type);
    if (opts.tag) a = a.filter(x => x.tags.includes(opts.tag));
    if (opts.search) a = a.filter(x => x.name.toLowerCase().includes(opts.search.toLowerCase()) || x.tags.some(t => t.includes(opts.search.toLowerCase())));
    return a;
  }
  getAsset(id) { return ASSETS.find(a => a.id === id) || null; }
  getCollections() { return COLLECTIONS; }
  getDashboardStats() {
    const totalSizeKb = ASSETS.reduce((s, a) => s + a.sizeKb, 0);
    return { totalAssets: ASSETS.length, totalSizeMb: parseFloat((totalSizeKb / 1024).toFixed(1)), images: ASSETS.filter(a => a.type === 'image').length, videos: ASSETS.filter(a => a.type === 'video').length, documents: ASSETS.filter(a => a.type === 'document').length, collections: COLLECTIONS.length };
  }
  generateAltText(assetId) {
    const a = this.getAsset(assetId);
    if (!a) return { error: 'Asset not found' };
    if (a.type !== 'image') return { error: 'Alt text only available for images' };
    return { assetId, altText: a.tags.join(', ') + ' - ' + a.name.replace(/[_-]/g, ' ').replace(/\.[^.]+$/, ''), generatedAt: new Date().toISOString() };
  }
}
module.exports = new DamEngine();
module.exports.DamEngine = DamEngine;
