const crypto = require('crypto');

const researchStore = new Map();
const notes = [];

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function createResearch(payload = {}) {
  const researchId = payload.researchId || id('research');
  const record = {
    researchId,
    topic: payload.topic || 'Weekly blog program',
    niche: payload.niche || 'B2B SaaS',
    intent: payload.intent || 'informational',
    audience: payload.audience || 'Content Marketing',
    cadence: payload.cadence || 'Weekly',
    primaryKeyword: payload.primaryKeyword || 'blog content plan',
    stage: payload.stage || 'awareness',
    questions: payload.questions || generateQuestions(payload.topic),
    competitors: payload.competitors || ['Competitor A', 'Competitor B'],
    status: payload.status || 'draft',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    score: 86,
  };
  researchStore.set(researchId, record);
  notes.push({ id: id('note'), researchId, note: `Created research for ${record.topic}`, ts: Date.now(), author: 'system' });
  return record;
}

function getResearch(researchId) {
  if (!researchStore.has(researchId)) {
    throw new Error('Research not found');
  }
  return researchStore.get(researchId);
}

function listResearch() {
  return Array.from(researchStore.values());
}

function scoreIntent(payload = {}) {
  const alignment = 88;
  const depth = 84;
  const authority = 82;
  const score = Math.round(alignment * 0.4 + depth * 0.35 + authority * 0.25);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  return {
    topic: payload.topic || 'weekly blog program',
    primaryKeyword: payload.primaryKeyword || 'blog content plan',
    alignment,
    depth,
    authority,
    score,
    grade,
    recommendations: ['Tighten ICP focus', 'Add proprietary data points', 'Clarify CTA per post'],
  };
}

function generateQuestions(topic = 'weekly blog content') {
  return [
    `What does success look like for ${topic}?`,
    `Which objections should we pre-empt for ${topic}?`,
    `What proof points convert for ${topic}?`,
    `Which channels drive lift for ${topic}?`,
  ];
}

function addNote(researchId, note) {
  const entry = { id: id('note'), researchId, note: note || 'Added note', ts: Date.now(), author: 'analyst' };
  notes.push(entry);
  return entry;
}

function listNotes(researchId) {
  return notes.filter((n) => !researchId || n.researchId === researchId);
}

function serpSnapshot(keyword = 'blog content plan') {
  return {
    keyword,
    difficulty: 51,
    volume: 1900,
    cpc: 2.8,
    competitors: [
      { url: 'https://example.com/blog/weekly-plan', title: 'Weekly Blog Plan', score: 81 },
      { url: 'https://example.com/blog/calendar', title: 'Content Calendar Guide', score: 77 },
    ],
  };
}

function getStats() {
  return {
    totalResearch: researchStore.size,
    intents: Array.from(researchStore.values()).reduce((acc, r) => {
      acc[r.intent] = (acc[r.intent] || 0) + 1;
      return acc;
    }, {}),
    notes: notes.length,
  };
}

module.exports = {
  createResearch,
  getResearch,
  listResearch,
  scoreIntent,
  generateQuestions,
  serpSnapshot,
  addNote,
  listNotes,
  getStats,
};
