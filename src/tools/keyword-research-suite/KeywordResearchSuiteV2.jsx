/**
 * Keyword Research Suite V2 - React Frontend
 * 42-tab enterprise interface across 7 categories
 */

import React, { useState, useEffect } from 'react';
import './KeywordResearchSuite.css';

const KeywordResearchSuiteV2 = () => {
  // ==================== STATE MANAGEMENT ====================
  const [activeCategory, setActiveCategory] = useState('manage');
  const [activeTab, setActiveTab] = useState('keywords');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data state
  const [keywords, setKeywords] = useState([]);
  const [searches, setSearches] = useState([]);
  const [serpAnalyses, setSerpAnalyses] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [scores, setScores] = useState([]);
  const [trackings, setTrackings] = useState([]);
  const [gapAnalyses, setGapAnalyses] = useState([]);

  // Form state
  const [seedKeyword, setSeedKeyword] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [yourDomain, setYourDomain] = useState('');

  // ==================== CATEGORIES & TABS ====================
  const categories = [
    {
      id: 'manage',
      label: 'Manage',
      icon: '🔍',
      tabs: ['keywords', 'research', 'lists', 'tracking', 'bulk', 'settings']
    },
    {
      id: 'optimize',
      label: 'Optimize',
      icon: '🎯',
      tabs: ['difficulty', 'volume', 'intent', 'clustering', 'scoring', 'gaps']
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: '⚡',
      tabs: ['serp-analysis', 'competitors', 'forecasting', 'recommendations', 'ai-insights', 'automation']
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: '🛠️',
      tabs: ['import-export', 'api', 'integrations', 'scripts', 'reports', 'scheduler']
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: '📊',
      tabs: ['rankings', 'trends', 'alerts', 'competitors-monitor', 'performance', 'sla']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      tabs: ['sources', 'filters', 'preferences', 'team', 'integrations-settings', 'backup']
    },
    {
      id: 'world-class',
      label: 'World-Class',
      icon: '🌟',
      tabs: ['ai-classification', 'predictive-volume', 'competitive-intelligence', 'market-insights', 'custom-algorithms', 'white-label']
    }
  ];

  const activeConfig = categories.find(c => c.id === activeCategory);

  // ==================== API CALLS ====================
  const apiBase = '/api/keyword-research-suite/v2';

  const apiCall = async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${apiBase}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Keyword Discovery
  const discoverKeywords = async () => {
    const result = await apiCall('/discovery/discover', {
      method: 'POST',
      body: JSON.stringify({
        seedKeyword,
        country: 'US',
        language: 'en',
        includeRelated: true,
        includeQuestions: true,
        includeLongTail: true,
        maxResults: 100
      })
    });
    setKeywords(result.keywords);
    setSearches(prev => [...prev, result]);
    return result;
  };

  const getKeywordVolume = async (keyword) => {
    return await apiCall('/discovery/volume', {
      method: 'POST',
      body: JSON.stringify({ keyword, timeRange: '12months' })
    });
  };

  const getKeywordDifficulty = async (keyword) => {
    return await apiCall('/discovery/difficulty', {
      method: 'POST',
      body: JSON.stringify({ keyword })
    });
  };

  // SERP Analysis
  const analyzeSERP = async (keyword) => {
    const result = await apiCall('/serp/analyze', {
      method: 'POST',
      body: JSON.stringify({ keyword, location: 'US', device: 'desktop', depth: 20 })
    });
    setSerpAnalyses(prev => [...prev, result]);
    return result;
  };

  const identifyContentGaps = async (keyword) => {
    return await apiCall('/serp/content-gaps', {
      method: 'POST',
      body: JSON.stringify({ keyword })
    });
  };

  // Competitor Research
  const addCompetitor = async (domain, name, industry) => {
    const result = await apiCall('/competitor/add', {
      method: 'POST',
      body: JSON.stringify({ domain, name, industry })
    });
    setCompetitors(prev => [...prev, result]);
    return result;
  };

  const analyzeCompetitorKeywords = async (competitorId) => {
    return await apiCall(`/competitor/${competitorId}/analyze-keywords`, {
      method: 'POST',
      body: JSON.stringify({ limit: 100 })
    });
  };

  const identifyGaps = async () => {
    return await apiCall('/competitor/identify-gaps', {
      method: 'POST',
      body: JSON.stringify({
        yourDomain,
        competitorIds: competitors.map(c => c.id)
      })
    });
  };

  // Search Intent
  const classifyIntent = async (keyword) => {
    return await apiCall('/intent/classify', {
      method: 'POST',
      body: JSON.stringify({ keyword })
    });
  };

  const bulkClassifyIntent = async (keywords) => {
    return await apiCall('/intent/bulk-classify', {
      method: 'POST',
      body: JSON.stringify({ keywords })
    });
  };

  // Keyword Clustering
  const createClusters = async (keywords, method = 'semantic') => {
    const result = await apiCall('/cluster/create', {
      method: 'POST',
      body: JSON.stringify({
        keywords,
        method,
        minClusterSize: 3,
        maxClusters: 20
      })
    });
    setClusters(result.clusters);
    return result;
  };

  const buildContentSilo = async (clusterIds) => {
    return await apiCall('/cluster/build-silo', {
      method: 'POST',
      body: JSON.stringify({ clusterIds })
    });
  };

  // Opportunity Scoring
  const scoreKeywords = async (keywords) => {
    const result = await apiCall('/scoring/score-and-rank', {
      method: 'POST',
      body: JSON.stringify({ keywords })
    });
    setScores(result.ranked);
    return result;
  };

  const findQuickWins = async (keywords) => {
    return await apiCall('/scoring/quick-wins', {
      method: 'POST',
      body: JSON.stringify({
        keywords,
        minVolume: 500,
        maxDifficulty: 40,
        minRelevance: 70
      })
    });
  };

  // Rank Tracking
  const startTracking = async (keywords) => {
    const result = await apiCall('/tracking/start', {
      method: 'POST',
      body: JSON.stringify({
        keywords,
        domain: yourDomain,
        location: 'US',
        device: 'desktop',
        frequency: 'daily'
      })
    });
    setTrackings(prev => [...prev, result]);
    return result;
  };

  const getRankingAlerts = async (trackingId) => {
    return await apiCall(`/tracking/${trackingId}/alerts`, {
      method: 'POST',
      body: JSON.stringify({
        significantDrop: 5,
        significantRise: 5,
        checkPeriod: 7
      })
    });
  };

  // Content Gap Analysis
  const analyzeGaps = async () => {
    const result = await apiCall('/gap/analyze', {
      method: 'POST',
      body: JSON.stringify({
        yourDomain,
        competitorDomains: competitors.map(c => c.domain),
        minVolume: 100,
        maxDifficulty: 70
      })
    });
    setGapAnalyses(prev => [...prev, result]);
    return result;
  };

  const generateContentCalendar = async (gapAnalysisId) => {
    return await apiCall(`/gap/${gapAnalysisId}/calendar`, {
      method: 'POST',
      body: JSON.stringify({
        startDate: new Date().toISOString(),
        frequency: 'weekly',
        maxPieces: 52
      })
    });
  };

  // ==================== LOAD DATA ====================
  useEffect(() => {
    loadData();
  }, [activeCategory, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'keywords') {
        const data = await apiCall('/discovery/searches');
        setSearches(data);
      } else if (activeTab === 'serp-analysis') {
        const data = await apiCall('/serp/analyses');
        setSerpAnalyses(data);
      } else if (activeTab === 'competitors') {
        const data = await apiCall('/competitor/list');
        setCompetitors(data);
      } else if (activeTab === 'clustering') {
        const data = await apiCall('/cluster/list');
        setClusters(data);
      } else if (activeTab === 'scoring') {
        const data = await apiCall('/scoring/scores');
        setScores(data);
      } else if (activeTab === 'rankings') {
        const data = await apiCall('/tracking/list');
        setTrackings(data);
      } else if (activeTab === 'gaps') {
        const data = await apiCall('/gap/list');
        setGapAnalyses(data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== TAB RENDERERS ====================
  const renderKeywordsTab = () => (
    <div className="tab-content">
      <div className="action-bar">
        <input
          type="text"
          placeholder="Enter seed keyword..."
          value={seedKeyword}
          onChange={(e) => setSeedKeyword(e.target.value)}
          className="keyword-input"
        />
        <button onClick={discoverKeywords} className="btn-primary" disabled={!seedKeyword}>
          Discover Keywords
        </button>
        <button onClick={() => setKeywords([])} className="btn-secondary">Clear</button>
      </div>

      {keywords.length > 0 && (
        <div className="keywords-grid">
          {keywords.map((kw, idx) => (
            <div key={idx} className="keyword-card">
              <div className="keyword-header">
                <h3>{kw.keyword}</h3>
                <span className={`keyword-type ${kw.type}`}>{kw.type}</span>
              </div>
              <div className="keyword-metrics">
                <div className="metric">
                  <span className="metric-label">Volume</span>
                  <span className="metric-value">{kw.volume?.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Difficulty</span>
                  <span className="metric-value difficulty-score">{kw.difficulty}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">CPC</span>
                  <span className="metric-value">${kw.cpc.toFixed(2)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Competition</span>
                  <span className="metric-value">{kw.competition}</span>
                </div>
              </div>
              <div className="keyword-actions">
                <button className="btn-icon" title="Analyze SERP">🔍</button>
                <button className="btn-icon" title="Check Intent">🎯</button>
                <button className="btn-icon" title="Track Rankings">📊</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {keywords.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No keywords yet</h3>
          <p>Enter a seed keyword to discover opportunities</p>
        </div>
      )}
    </div>
  );

  const renderSERPAnalysisTab = () => (
    <div className="tab-content">
      <div className="action-bar">
        <input
          type="text"
          placeholder="Enter keyword to analyze..."
          className="keyword-input"
        />
        <button className="btn-primary">Analyze SERP</button>
      </div>

      {serpAnalyses.length > 0 && (
        <div className="serp-results">
          {serpAnalyses.map((analysis, idx) => (
            <div key={idx} className="serp-analysis-card">
              <h3>SERP Analysis: {analysis.keyword}</h3>
              
              <div className="serp-features">
                <h4>SERP Features</h4>
                <div className="feature-badges">
                  {analysis.features?.map((feature, fidx) => (
                    <span key={fidx} className={`feature-badge ${feature.impact}`}>
                      {feature.type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="serp-top-results">
                <h4>Top Results</h4>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Domain</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Words</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.results?.slice(0, 10).map((result, ridx) => (
                      <tr key={ridx}>
                        <td>{result.position}</td>
                        <td>{result.domain}</td>
                        <td>{result.title?.substring(0, 50)}...</td>
                        <td>{result.contentType}</td>
                        <td>{result.wordCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {analysis.contentGaps && (
                <div className="content-gaps">
                  <h4>Content Gaps</h4>
                  <ul>
                    {analysis.contentGaps.missingTopics?.slice(0, 5).map((topic, tidx) => (
                      <li key={tidx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompetitorsTab = () => (
    <div className="tab-content">
      <div className="action-bar">
        <input
          type="text"
          placeholder="Competitor domain..."
          value={competitorDomain}
          onChange={(e) => setCompetitorDomain(e.target.value)}
          className="keyword-input"
        />
        <button
          onClick={() => addCompetitor(competitorDomain, competitorDomain, 'general')}
          className="btn-primary"
          disabled={!competitorDomain}
        >
          Add Competitor
        </button>
      </div>

      {competitors.length > 0 && (
        <div className="competitors-grid">
          {competitors.map((comp, idx) => (
            <div key={idx} className="competitor-card">
              <div className="competitor-header">
                <h3>{comp.name}</h3>
                <span className="competitor-domain">{comp.domain}</span>
              </div>
              <div className="competitor-metrics">
                <div className="metric">
                  <span className="metric-label">Est. Traffic</span>
                  <span className="metric-value">{comp.metrics?.estimatedTraffic?.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Domain Authority</span>
                  <span className="metric-value">{comp.metrics?.domainAuthority}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Top Keywords</span>
                  <span className="metric-value">{comp.metrics?.topKeywords}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Content Count</span>
                  <span className="metric-value">{comp.metrics?.contentCount}</span>
                </div>
              </div>
              <div className="competitor-actions">
                <button className="btn-small" onClick={() => analyzeCompetitorKeywords(comp.id)}>
                  Analyze Keywords
                </button>
                <button className="btn-small">View Strategy</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {competitors.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No competitors tracked</h3>
          <p>Add competitors to identify keyword gaps and opportunities</p>
        </div>
      )}
    </div>
  );

  const renderClusteringTab = () => (
    <div className="tab-content">
      <div className="action-bar">
        <select className="method-select">
          <option value="semantic">Semantic Clustering</option>
          <option value="topic">Topic Clustering</option>
          <option value="intent">Intent Clustering</option>
        </select>
        <button className="btn-primary" onClick={() => createClusters(keywords)}>
          Create Clusters
        </button>
        <button className="btn-secondary">Find Optimal K</button>
      </div>

      {clusters.length > 0 && (
        <div className="clusters-grid">
          {clusters.map((cluster, idx) => (
            <div key={idx} className="cluster-card">
              <div className="cluster-header">
                <h3>{cluster.primaryTopic}</h3>
                <span className="keyword-count">{cluster.keywords?.length} keywords</span>
              </div>
              <div className="cluster-metrics">
                <div className="metric">
                  <span className="metric-label">Total Volume</span>
                  <span className="metric-value">{cluster.totalVolume?.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Avg Difficulty</span>
                  <span className="metric-value">{cluster.avgDifficulty}</span>
                </div>
              </div>
              <div className="cluster-keywords">
                <h4>Top Keywords:</h4>
                <div className="keyword-pills">
                  {cluster.keywords?.slice(0, 10).map((kw, kidx) => (
                    <span key={kidx} className="keyword-pill">{kw}</span>
                  ))}
                </div>
              </div>
              <div className="cluster-actions">
                <button className="btn-small">Build Silo</button>
                <button className="btn-small">Analyze Quality</button>
                <button className="btn-small">Export</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderScoringTab = () => (
    <div className="tab-content">
      <div className="action-bar">
        <button className="btn-primary" onClick={() => scoreKeywords(keywords)}>
          Score All Keywords
        </button>
        <button className="btn-secondary" onClick={() => findQuickWins(keywords)}>
          Find Quick Wins
        </button>
      </div>

      {scores.length > 0 && (
        <>
          <div className="distribution-chart">
            <h3>Opportunity Distribution</h3>
            <div className="priority-bars">
              <div className="priority-bar quick-win">
                <span>Quick Wins</span>
                <div className="bar" style={{ width: `${(scores.filter(s => s.priority === 'quick-win').length / scores.length) * 100}%` }}></div>
                <span>{scores.filter(s => s.priority === 'quick-win').length}</span>
              </div>
              <div className="priority-bar high">
                <span>High Priority</span>
                <div className="bar" style={{ width: `${(scores.filter(s => s.priority === 'high').length / scores.length) * 100}%` }}></div>
                <span>{scores.filter(s => s.priority === 'high').length}</span>
              </div>
              <div className="priority-bar medium">
                <span>Medium Priority</span>
                <div className="bar" style={{ width: `${(scores.filter(s => s.priority === 'medium').length / scores.length) * 100}%` }}></div>
                <span>{scores.filter(s => s.priority === 'medium').length}</span>
              </div>
              <div className="priority-bar low">
                <span>Low Priority</span>
                <div className="bar" style={{ width: `${(scores.filter(s => s.priority === 'low').length / scores.length) * 100}%` }}></div>
                <span>{scores.filter(s => s.priority === 'low').length}</span>
              </div>
            </div>
          </div>

          <table className="scores-table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Overall Score</th>
                <th>Priority</th>
                <th>Volume</th>
                <th>Difficulty</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, idx) => (
                <tr key={idx} className={`priority-${score.priority}`}>
                  <td>{score.keyword}</td>
                  <td>
                    <div className="score-circle" data-score={score.overallScore}>
                      {score.overallScore}
                    </div>
                  </td>
                  <td><span className={`priority-badge ${score.priority}`}>{score.priority}</span></td>
                  <td>{score.components?.volume}</td>
                  <td>{score.components?.difficulty}</td>
                  <td>{score.roi?.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );

  const renderRankingsTab = () => (
    <div className="tab-content">
      <div className="action-bar">
        <input
          type="text"
          placeholder="Your domain..."
          value={yourDomain}
          onChange={(e) => setYourDomain(e.target.value)}
          className="keyword-input"
        />
        <button
          className="btn-primary"
          onClick={() => startTracking(selectedKeywords)}
          disabled={!yourDomain || selectedKeywords.length === 0}
        >
          Start Tracking
        </button>
      </div>

      {trackings.length > 0 && (
        <div className="trackings-list">
          {trackings.map((tracking, idx) => (
            <div key={idx} className="tracking-card">
              <div className="tracking-header">
                <h3>{tracking.domain}</h3>
                <span className="tracking-frequency">{tracking.frequency} tracking</span>
              </div>
              <table className="rankings-table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Current</th>
                    <th>Previous</th>
                    <th>Change</th>
                    <th>Best</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(tracking.keywords || {}).map(([keyword, data], kidx) => {
                    const change = data.previous - data.current;
                    return (
                      <tr key={kidx}>
                        <td>{keyword}</td>
                        <td><span className="position-badge">{data.current || '-'}</span></td>
                        <td>{data.previous || '-'}</td>
                        <td>
                          <span className={`change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
                            {change > 0 ? '+' : ''}{change}
                          </span>
                        </td>
                        <td>{data.best || '-'}</td>
                        <td>
                          <span className="trend-indicator">
                            {change > 3 ? '📈' : change < -3 ? '📉' : '➡️'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="tracking-actions">
                <button className="btn-small">Take Snapshot</button>
                <button className="btn-small">View History</button>
                <button className="btn-small">Get Alerts</button>
                <button className="btn-small">Forecast</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGapsTab = () => (
    <div className="tab-content">
      <div className="action-bar">
        <input
          type="text"
          placeholder="Your domain..."
          value={yourDomain}
          onChange={(e) => setYourDomain(e.target.value)}
          className="keyword-input"
        />
        <button
          className="btn-primary"
          onClick={analyzeGaps}
          disabled={!yourDomain || competitors.length === 0}
        >
          Analyze Gaps
        </button>
      </div>

      {gapAnalyses.length > 0 && (
        <div className="gaps-results">
          {gapAnalyses.map((gap, idx) => (
            <div key={idx} className="gap-analysis-card">
              <div className="gap-summary">
                <div className="gap-metric">
                  <h4>Keyword Gaps</h4>
                  <span className="gap-count">{gap.keywordGaps?.length || 0}</span>
                </div>
                <div className="gap-metric">
                  <h4>Topic Gaps</h4>
                  <span className="gap-count">{gap.topicGaps?.length || 0}</span>
                </div>
                <div className="gap-metric">
                  <h4>Format Gaps</h4>
                  <span className="gap-count">{gap.formatGaps?.length || 0}</span>
                </div>
                <div className="gap-metric">
                  <h4>Intent Gaps</h4>
                  <span className="gap-count">{gap.intentGaps?.length || 0}</span>
                </div>
              </div>

              <div className="gap-opportunities">
                <h4>High Priority Opportunities</h4>
                <table className="opportunities-table">
                  <thead>
                    <tr>
                      <th>Keyword</th>
                      <th>Type</th>
                      <th>Volume</th>
                      <th>Difficulty</th>
                      <th>Opportunity Score</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gap.opportunities?.filter(o => o.priority === 'high').slice(0, 15).map((opp, oidx) => (
                      <tr key={oidx}>
                        <td>{opp.keyword}</td>
                        <td>{opp.type}</td>
                        <td>{opp.volume?.toLocaleString()}</td>
                        <td>{opp.difficulty}</td>
                        <td>
                          <div className="score-circle" data-score={opp.opportunityScore}>
                            {opp.opportunityScore}
                          </div>
                        </td>
                        <td><span className="priority-badge high">{opp.priority}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="gap-actions">
                <button className="btn-primary" onClick={() => generateContentCalendar(gap.id)}>
                  Generate Content Calendar
                </button>
                <button className="btn-secondary">Export Report</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {gapAnalyses.length === 0 && competitors.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Add competitors first</h3>
          <p>You need to add competitors before analyzing content gaps</p>
        </div>
      )}
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div className="keyword-research-suite-v2">
      <header className="suite-header">
        <h1>Keyword Research Suite V2</h1>
        <div className="header-actions">
          <button className="btn-icon" title="Refresh">🔄</button>
          <button className="btn-icon" title="Settings">⚙️</button>
          <button className="btn-icon" title="Help">❓</button>
        </div>
      </header>

      <nav className="category-nav">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.id);
              setActiveTab(cat.tabs[0]);
            }}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </nav>

      <div className="tabs-container">
        <div className="tabs">
          {activeConfig?.tabs.map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <main className="suite-main">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'keywords' && renderKeywordsTab()}
            {activeTab === 'serp-analysis' && renderSERPAnalysisTab()}
            {activeTab === 'competitors' && renderCompetitorsTab()}
            {activeTab === 'clustering' && renderClusteringTab()}
            {activeTab === 'scoring' && renderScoringTab()}
            {activeTab === 'rankings' && renderRankingsTab()}
            {activeTab === 'gaps' && renderGapsTab()}
            
            {/* Default render for unimplemented tabs */}
            {!['keywords', 'serp-analysis', 'competitors', 'clustering', 'scoring', 'rankings', 'gaps'].includes(activeTab) && (
              <div className="tab-content">
                <div className="coming-soon">
                  <h3>{activeTab.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  <p>This feature is under development</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default KeywordResearchSuiteV2;
