'use strict';
const VIDEOS = [
  {id:'v1',title:'How We Make Our Eco Hoodies',platform:'youtube',views:28420,watchTimeMin:142840,avgDuration:'5:12',seoScore:84,thumbnailCtr:0.068,rank:'#3 for "eco hoodie making process"',publishedAt:'2026-07-01T10:00:00Z'},
  {id:'v2',title:'Summer Collection 2026 Lookbook',platform:'youtube',views:12840,watchTimeMin:38420,avgDuration:'3:48',seoScore:72,thumbnailCtr:0.054,rank:'#8 for "summer fashion lookbook 2026"',publishedAt:'2026-07-10T09:00:00Z'},
  {id:'v3',title:'Sustainable Fashion Tips #shorts',platform:'youtube',views:84200,watchTimeMin:42100,avgDuration:'0:30',seoScore:91,thumbnailCtr:0.112,rank:'#1 for "sustainable fashion tips short"',publishedAt:'2026-07-15T12:00:00Z'},
  {id:'p1',title:'The Eco Brand Podcast Ep.12',platform:'podcast',plays:4820,completionRate:0.72,avgListenMin:38,seoScore:68,publishedAt:'2026-07-08T08:00:00Z'},
];
class VideoPodcastSeoEngine {
  getVideos(opts = {}) { let v = VIDEOS; if (opts.platform) v = v.filter(x => x.platform === opts.platform); return v; }
  getVideo(id) { return VIDEOS.find(v => v.id === id) || null; }
  getDashboardStats() {
    const yt = VIDEOS.filter(v => v.platform === 'youtube');
    const pc = VIDEOS.filter(v => v.platform === 'podcast');
    return { totalContent: VIDEOS.length, youtubeVideos: yt.length, podcasts: pc.length, totalViews: yt.reduce((s, v) => s + v.views, 0), totalPlays: pc.reduce((s, p) => s + p.plays, 0), avgSeoScore: Math.round(VIDEOS.reduce((s, v) => s + v.seoScore, 0) / VIDEOS.length), avgThumbnailCtr: parseFloat((yt.reduce((s, v) => s + v.thumbnailCtr, 0) / yt.length).toFixed(3)) };
  }
  generateDescription(videoId, keywords = []) {
    const v = this.getVideo(videoId);
    if (!v) return { error: 'Video not found' };
    return { videoId, title: v.title, description: v.title + '. ' + keywords.slice(0, 3).join(', ') + '. Watch to discover how our team creates sustainable products.\n\n#EcoFashion #Sustainable', chapters: ['0:00 Intro', '1:20 The Process', '3:40 Materials', '5:05 Outro'], tags: [...keywords, 'eco', 'sustainable', 'fashion'], generatedAt: new Date().toISOString() };
  }
  analyzeTranscript(videoId) {
    return { videoId, transcript: null, message: 'Upload video to generate transcript', wordCount: 0, keywordsFound: [], chaptersGenerated: 0 };
  }
}
module.exports = new VideoPodcastSeoEngine();
module.exports.VideoPodcastSeoEngine = VideoPodcastSeoEngine;
