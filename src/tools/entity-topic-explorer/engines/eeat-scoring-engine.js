'use strict';
/**
 * E-E-A-T Scoring Engine
 * Experience, Expertise, Authoritativeness, Trustworthiness scoring
 * per Google Quality Rater Guidelines
 */

const SIGNAL_DEFINITIONS = {
  experience: {
    description: 'Demonstrated first-hand experience with the topic',
    googleWeight: 0.22,
    signals: [
      { id: 'exp1', name: 'Product reviews with photos', present: true, weight: 15, evidence: '284 verified reviews' },
      { id: 'exp2', name: 'Video demonstrations', present: false, weight: 18, evidence: null },
      { id: 'exp3', name: 'Case studies', present: false, weight: 20, evidence: null },
      { id: 'exp4', name: 'Original research / data', present: false, weight: 22, evidence: null },
      { id: 'exp5', name: 'Expert testing / lab reports', present: false, weight: 25, evidence: null },
    ],
  },
  expertise: {
    description: 'Demonstrated knowledge and skills in the topic area',
    googleWeight: 0.26,
    signals: [
      { id: 'exp6', name: 'Author bylines with credentials', present: false, weight: 20, evidence: null },
      { id: 'exp7', name: 'About page with team bios', present: true, weight: 15, evidence: '4 team members listed' },
      { id: 'exp8', name: 'Certifications / accreditations', present: true, weight: 18, evidence: 'GOTS certification' },
      { id: 'exp9', name: 'Published in industry journals', present: false, weight: 25, evidence: null },
      { id: 'exp10', name: 'Speaking/conference appearances', present: false, weight: 22, evidence: null },
    ],
  },
  authoritativeness: {
    description: 'Recognition and authority from peers and relevant institutions',
    googleWeight: 0.28,
    signals: [
      { id: 'auth1', name: 'Wikipedia article', present: false, weight: 28, evidence: null },
      { id: 'auth2', name: 'Wikidata entity', present: false, weight: 25, evidence: null },
      { id: 'auth3', name: 'Google Knowledge Panel', present: false, weight: 30, evidence: null },
      { id: 'auth4', name: 'Press mentions (tier 1)', present: true, weight: 15, evidence: '3 mentions in eco-fashion blogs' },
      { id: 'auth5', name: 'Industry awards', present: false, weight: 20, evidence: null },
      { id: 'auth6', name: 'High-authority backlinks', present: true, weight: 18, evidence: 'DA 60+ links from 8 domains' },
    ],
  },
  trustworthiness: {
    description: 'Accuracy, transparency, and safety of the site and content',
    googleWeight: 0.24,
    signals: [
      { id: 'trust1', name: 'SSL / HTTPS', present: true, weight: 10, evidence: 'Valid SSL certificate' },
      { id: 'trust2', name: 'Clear contact information', present: true, weight: 12, evidence: 'Contact page with email + address' },
      { id: 'trust3', name: 'Privacy policy', present: true, weight: 12, evidence: 'GDPR-compliant policy' },
      { id: 'trust4', name: 'Return / refund policy', present: true, weight: 15, evidence: '30-day returns' },
      { id: 'trust5', name: 'Verified customer reviews', present: true, weight: 18, evidence: '4.7/5 on Trustpilot (284 reviews)' },
      { id: 'trust6', name: 'Security badges / seals', present: false, weight: 14, evidence: null },
      { id: 'trust7', name: 'BBB or equivalent accreditation', present: false, weight: 19, evidence: null },
    ],
  },
};

class EeatScoringEngine {
  constructor(config = {}) {
    this.config = { updateFrequency: 'monthly', aiEnhancement: true, ...config };
  }

  getFullAnalysis(domain) {
    const scores = this._calcScores();
    const overall = this._calcOverall(scores);
    return {
      domain,
      overall,
      grade: this._getGrade(overall),
      scores,
      signalBreakdown: SIGNAL_DEFINITIONS,
      topQuickWins: this._getQuickWins(),
      competitorComparison: this._getCompetitorComparison(overall),
      improvementRoadmap: this._getRoadmap(scores),
      timestamp: new Date().toISOString(),
    };
  }

  _calcScores() {
    const scores = {};
    for (const [factor, def] of Object.entries(SIGNAL_DEFINITIONS)) {
      const presentSignals = def.signals.filter(s => s.present);
      const maxScore = def.signals.reduce((s, sig) => s + sig.weight, 0);
      const earned = presentSignals.reduce((s, sig) => s + sig.weight, 0);
      scores[factor] = {
        score: Math.round(earned / maxScore * 100),
        earned,
        maxScore,
        presentCount: presentSignals.length,
        totalCount: def.signals.length,
        googleWeight: def.googleWeight,
      };
    }
    return scores;
  }

  _calcOverall(scores) {
    return Math.round(Object.entries(scores).reduce((s, [factor, data]) => {
      return s + data.score * SIGNAL_DEFINITIONS[factor].googleWeight;
    }, 0));
  }

  _getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  _getQuickWins() {
    const wins = [];
    for (const [factor, def] of Object.entries(SIGNAL_DEFINITIONS)) {
      for (const signal of def.signals) {
        if (!signal.present && signal.weight <= 18) {
          wins.push({ factor, signal: signal.name, effort: 'low', scoreImpact: '+' + signal.weight + ' ' + factor + ' points' });
        }
      }
    }
    return wins.sort((a, b) => parseInt(b.scoreImpact) - parseInt(a.scoreImpact)).slice(0, 5);
  }

  _getCompetitorComparison(myScore) {
    return [
      { name: 'EcoFashionCo', eeatScore: 84, gap: myScore - 84 },
      { name: 'EarthWear', eeatScore: 78, gap: myScore - 78 },
      { name: 'GreenThread', eeatScore: 71, gap: myScore - 71 },
      { name: 'You', eeatScore: myScore, gap: 0 },
    ].sort((a, b) => b.eeatScore - a.eeatScore);
  }

  _getRoadmap(scores) {
    return [
      { month: 1, actions: ['Add author bylines with credentials', 'Create video product demonstrations'], eeatLift: '+8 points' },
      { month: 2, actions: ['Create Wikidata entity', 'Publish original industry research'], eeatLift: '+14 points' },
      { month: 3, actions: ['Pursue Wikipedia article', 'Add BBB accreditation', 'Speak at fashion sustainability conference'], eeatLift: '+18 points' },
    ];
  }

  getSignalDefinitions() { return SIGNAL_DEFINITIONS; }

  updateSignal(signalId, present, evidence) {
    for (const def of Object.values(SIGNAL_DEFINITIONS)) {
      const signal = def.signals.find(s => s.id === signalId);
      if (signal) {
        signal.present = present;
        signal.evidence = evidence;
        return { ok: true, signal: { ...signal, updatedAt: new Date().toISOString() } };
      }
    }
    return { ok: false, error: 'Signal not found: ' + signalId };
  }
}

module.exports = new EeatScoringEngine();
module.exports.EeatScoringEngine = EeatScoringEngine;
