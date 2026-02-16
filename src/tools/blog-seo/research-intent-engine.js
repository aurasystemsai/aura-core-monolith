const crypto = require('crypto');

const researchStore = new Map();
const researchNotes = [];

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function createResearch(payload = {}) {
  const id = payload.id || createId('research');
  const record = {
    id,
    topic: payload.topic || 'Untitled blog topic',
    intent: payload.intent || 'informational',
    primaryKeyword: payload.primaryKeyword || 'blog seo',
    audience: payload.audience || 'Content Marketing',
    stage: payload.stage || 'consideration',
    persona: payload.persona || 'Content Lead',
    serp: payload.serp || serpOverview(payload.primaryKeyword || 'blog seo'),
    questions: payload.questions || generateQuestions(payload.topic || 'blog seo'),
    status: payload.status || 'draft',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  researchStore.set(id, record);
  researchNotes.push({ id: createId('note'), researchId: id, note: `Created research for ${record.topic}`, ts: Date.now(), author: 'system' });
  return record;
}

function getResearch(id) {
  if (!researchStore.has(id)) {
    throw new Error('Research not found');
  }
  return researchStore.get(id);
}

function listResearch() {
  return Array.from(researchStore.values());
}

function scoreIntent(payload = {}) {
  const alignment = Math.max(60, Math.min(100, 70 + Math.round(Math.random() * 25)));
  const depth = Math.max(55, Math.min(100, 65 + Math.round(Math.random() * 25)));
  const authority = Math.max(50, Math.min(100, 60 + Math.round(Math.random() * 30)));
  const total = Math.round(alignment * 0.4 + depth * 0.35 + authority * 0.25);
  const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : 'C';
  return {
    topic: payload.topic || 'blog seo',
    primaryKeyword: payload.primaryKeyword || 'blog seo',
    alignment,
    depth,
    authority,
    score: total,
    grade,
    recommendations: [
      'Tighten search intent alignment to subtopics',
      'Add proprietary proof points and benchmarks',
      'Address objections and conversion blockers',
    ],
  };
}

function generateQuestions(topic = 'blog seo') {
  return [
    `What makes ${topic} unique for our ICP?`,
    `Which objections prevent conversion for ${topic}?`,
    `What metrics prove value for ${topic}?`,
    `Which distribution channels win for ${topic}?`,
  ];
}

function serpOverview(keyword = 'blog seo') {
  return {
    keyword,
    difficulty: 52,
    volume: 2400,
    cpc: 3.2,
    competitors: [
      { url: 'https://example.com/blog-seo-guide', title: 'Comprehensive Blog SEO Guide', score: 82 },
      { url: 'https://example.com/blog-seo-checklist', title: 'Blog SEO Checklist', score: 78 },
      { url: 'https://example.com/blog-seo-tools', title: 'Tools for Blog SEO', score: 74 },
    ],
  };
}

function addNote(researchId, note) {
  const entry = { id: createId('note'), researchId, note: note || 'Added note', ts: Date.now(), author: 'analyst' };
  researchNotes.push(entry);
  return entry;
}

function listNotes(researchId) {
  return researchNotes.filter((n) => !researchId || n.researchId === researchId);
}

function getStats() {
  return {
    totalResearch: researchStore.size,
    intents: Array.from(researchStore.values()).reduce((acc, r) => {
      acc[r.intent] = (acc[r.intent] || 0) + 1;
      return acc;
    }, {}),
    notes: researchNotes.length,
  };
}

module.exports = {
  createResearch,
  getResearch,
  listResearch,
  scoreIntent,
  generateQuestions,
  serpOverview,
  addNote,
  listNotes,
  getStats,
};
