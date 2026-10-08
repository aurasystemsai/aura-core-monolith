/**
 * Keyword Clustering Engine
 * Groups keywords into semantic clusters and topic silos
 */

class ClusteringEngine {
  constructor() {
    this.clusters = new Map();
    this.siloes = new Map();
  }

  // Create keyword clusters
  async createClusters(params) {
    const { keywords, method = 'semantic', minClusterSize = 5, serpData = {} } = params || {};
    if (!Array.isArray(keywords) || !keywords.length || keywords.some(keyword => typeof keyword !== 'string' || !keyword.trim())) {
      throw new Error('keywords must be a non-empty array of non-empty strings');
    }
    if (!Number.isInteger(minClusterSize) || minClusterSize < 1) {
      throw new Error('minClusterSize must be a positive integer');
    }
    if (!['semantic', 'serp', 'intent'].includes(method)) {
      throw new Error(`Unsupported clustering method: ${method}`);
    }

    const uniqueKeywords = [...new Map(keywords.map(keyword => [this.normalizeKeyword(keyword), keyword.trim()])).values()];
    if (method === 'serp' && uniqueKeywords.some(keyword => {
      const data = serpData[this.normalizeKeyword(keyword)];
      return !Array.isArray(data?.topDomains) || data.topDomains.length === 0;
    })) {
      throw new Error('SERP clustering requires real SERP data for every keyword');
    }

    const clustering = {
      id: `cluster_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      method,
      totalKeywords: uniqueKeywords.length,
      clusters: [],
      unclusteredKeywords: [],
      timestamp: new Date().toISOString()
    };

    // Choose clustering method
    switch (method) {
      case 'semantic':
        clustering.clusters = await this.semanticClustering(uniqueKeywords, minClusterSize);
        break;
      case 'serp':
        clustering.clusters = await this.serpBasedClustering(uniqueKeywords, minClusterSize, serpData);
        break;
      case 'intent':
        clustering.clusters = await this.intentBasedClustering(uniqueKeywords, minClusterSize);
        break;
    }

    clustering.clusters.forEach(cluster => {
      cluster.id = `${clustering.id}_${cluster.id}`;
    });
    const clustered = new Set(clustering.clusters.flatMap(cluster => cluster.keywords));
    clustering.unclusteredKeywords = uniqueKeywords.filter(keyword => !clustered.has(keyword));
    this.clusters.set(clustering.id, clustering);
    return clustering;
  }

  // Semantic clustering (based on word similarity)
  async semanticClustering(keywords, minSize) {
    const components = this.connectedComponents(keywords, (a, b) => this.calculateSimilarity(a, b) > 0.6);
    return components
      .filter(component => component.length >= minSize)
      .map((component, index) => ({
        id: `semantic_${index + 1}`,
        name: this.selectRepresentativeKeyword(component),
        keywords: component,
        primaryKeyword: this.selectRepresentativeKeyword(component),
        totalSearchVolume: null,
        avgDifficulty: null,
        clusterSize: component.length,
      }));
  }

  // SERP-based clustering (keywords with similar SERP results)
  async serpBasedClustering(keywords, minSize, serpData) {
    const components = this.connectedComponents(keywords, (a, b) => {
      const resultA = serpData[this.normalizeKeyword(a)];
      const resultB = serpData[this.normalizeKeyword(b)];
      return this.calculateSerpOverlap(resultA, resultB) > 0.5;
    });
    return components
      .filter(component => component.length >= minSize)
      .map((component, index) => {
        const first = serpData[this.normalizeKeyword(component[0])];
        const sharedDomains = component.slice(1).reduce((domains, keyword) => {
          const otherDomains = new Set(serpData[this.normalizeKeyword(keyword)].topDomains || []);
          return domains.filter(domain => otherDomains.has(domain));
        }, [...(first.topDomains || [])]);
        const sharedFeatures = component.slice(1).reduce((features, keyword) => {
          const otherFeatures = new Set(serpData[this.normalizeKeyword(keyword)].features || []);
          return features.filter(feature => otherFeatures.has(feature));
        }, [...(first.features || [])]);
        return {
          id: `serp_${index + 1}`,
          name: this.selectRepresentativeKeyword(component),
          keywords: component,
          primaryKeyword: this.selectRepresentativeKeyword(component),
          commonDomains: sharedDomains,
          commonFeatures: sharedFeatures,
          clusterSize: component.length,
        };
      });
  }

  // Intent-based clustering
  async intentBasedClustering(keywords, minSize) {
    const intentGroups = {
      informational: [],
      navigational: [],
      commercial: [],
      transactional: []
    };

    // Group by intent (mock classification)
    keywords.forEach(kw => {
      const intent = this.classifyIntent(kw);
      intentGroups[intent].push(kw);
    });

    const clusters = [];

    // Create clusters per intent
    Object.entries(intentGroups).forEach(([intent, kwList]) => {
      if (kwList.length < minSize) return;

      clusters.push({
        id: `intent_${intent}`,
        name: `${intent} keywords`,
        intent,
        keywords: kwList,
        primaryKeyword: kwList[0],
        totalSearchVolume: null,
        clusterSize: kwList.length,
      });
    });

    return clusters;
  }

  // Calculate keyword similarity
  calculateSimilarity(kw1, kw2) {
    const words1 = new Set(this.normalizeKeyword(kw1).split(' ').filter(Boolean));
    const words2 = new Set(this.normalizeKeyword(kw2).split(' ').filter(Boolean));
    if (!words1.size || !words2.size) return 0;
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity
    return intersection.size / union.size;
  }

  // Calculate SERP overlap
  calculateSerpOverlap(serp1, serp2) {
    const domains1 = new Set(serp1?.topDomains || []);
    const domains2 = new Set(serp2?.topDomains || []);
    if (!domains1.size || !domains2.size) return 0;
    
    const intersection = new Set([...domains1].filter(d => domains2.has(d)));
    return intersection.size / Math.max(domains1.size, domains2.size);
  }

  normalizeKeyword(keyword) {
    return keyword.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  connectedComponents(keywords, areRelated) {
    const visited = new Set();
    const components = [];
    for (const keyword of keywords) {
      if (visited.has(keyword)) continue;
      const component = [];
      const queue = [keyword];
      visited.add(keyword);
      while (queue.length) {
        const current = queue.shift();
        component.push(current);
        for (const candidate of keywords) {
          if (!visited.has(candidate) && areRelated(current, candidate)) {
            visited.add(candidate);
            queue.push(candidate);
          }
        }
      }
      components.push(component);
    }
    return components;
  }

  selectRepresentativeKeyword(keywords) {
    return [...keywords].sort((a, b) => {
      const wordCount = this.normalizeKeyword(a).split(' ').length - this.normalizeKeyword(b).split(' ').length;
      return wordCount || a.localeCompare(b);
    })[0];
  }

  classifyIntent(keyword) {
    const lower = this.normalizeKeyword(keyword);
    
    if (/\b(login|log in|sign in|official site|website)\b/.test(lower)) return 'navigational';
    if (/\b(buy|price|purchase|order|shop|discount|coupon|for sale)\b/.test(lower)) return 'transactional';
    if (/\b(best|top|vs|versus|review|comparison|compare)\b/.test(lower)) return 'commercial';
    if (/^(what|how|why|when|where|who|which|guide|tutorial)\b/.test(lower) || /\b(meaning|definition|examples)\b/.test(lower)) return 'informational';
    
    return 'informational';
  }

  // Create topic silos
  async createSilos(params) {
    const { keywords, maxSilos = 10, minClusterSize = 2 } = params || {};
    if (!Number.isInteger(maxSilos) || maxSilos < 1) throw new Error('maxSilos must be a positive integer');
    
    // First cluster keywords
    const clustering = await this.createClusters({ keywords, method: 'semantic', minClusterSize });
    
    const siloStructure = {
      id: `silo_${Date.now()}`,
      silos: [],
      timestamp: new Date().toISOString()
    };

    // Convert clusters to silos
    clustering.clusters.slice(0, maxSilos).forEach(cluster => {
      const silo = {
        id: cluster.id,
        name: cluster.name,
        pillarPage: this.selectPillarKeyword(cluster.keywords),
        supportingPages: cluster.keywords.filter(kw => kw !== cluster.primaryKeyword),
        internalLinkingStrategy: this.generateLinkingStrategy(cluster.keywords),
        contentHierarchy: this.buildContentHierarchy(cluster.keywords)
      };
      
      siloStructure.silos.push(silo);
    });

    this.siloes.set(siloStructure.id, siloStructure);
    return siloStructure;
  }

  // Select pillar keyword
  selectPillarKeyword(keywords) {
    return {
      keyword: keywords[0],
      searchVolume: null,
      difficulty: null,
      role: 'pillar'
    };
  }

  // Generate internal linking strategy
  generateLinkingStrategy(keywords) {
    return {
      pillarToSupporting: 'Link from pillar page to all supporting pages',
      supportingToPillar: 'All supporting pages link back to pillar',
      supportingToSupporting: 'Cross-link related supporting pages',
      recommendedAnchorText: 'Use partial match and LSI keywords',
      linksPerPage: Math.floor(keywords.length / 3) + 3
    };
  }

  // Build content hierarchy
  buildContentHierarchy(keywords) {
    const hierarchy = {
      level1: [], // Pillar
      level2: [], // Main topics
      level3: []  // Subtopics
    };

    hierarchy.level1.push(keywords[0]);
    
    const remaining = keywords.slice(1);
    const mid = Math.ceil(remaining.length / 2);
    
    hierarchy.level2 = remaining.slice(0, mid);
    hierarchy.level3 = remaining.slice(mid);

    return hierarchy;
  }

  // Get cluster suggestions
  async getClusterSuggestions(clusterId) {
    const cluster = this.getCluster(clusterId);
    if (!cluster) throw new Error('Cluster not found');

    const suggestions = {
      clusterId,
      contentSuggestions: [],
      linkingSuggestions: [],
      expansionOpportunities: []
    };

    // Content suggestions
    suggestions.contentSuggestions.push({
      type: 'pillar_page',
      title: `Complete guide to ${cluster.name}`,
      targetWordCount: 4000,
      sections: cluster.keywords.slice(0, 10)
    });

    cluster.keywords.slice(0, 5).forEach(kw => {
      suggestions.contentSuggestions.push({
        type: 'supporting_page',
        title: kw,
        targetWordCount: 2000,
        keywordFocus: kw
      });
    });

    // Linking suggestions
    suggestions.linkingSuggestions.push({
      from: 'pillar_page',
      to: 'all_supporting_pages',
      anchorText: 'Related keyword variations',
      priority: 'high'
    });

    // Expansion opportunities
    suggestions.expansionOpportunities = [
      'Research additional related keywords using the keyword discovery workflow',
      'Create video content for top 3 keywords',
      'Build interactive tools/calculators'
    ];

    return suggestions;
  }

  // Merge clusters
  async mergeClusters(clusterIds) {
    if (!Array.isArray(clusterIds) || clusterIds.length < 2) {
      throw new Error('Need at least 2 cluster IDs to merge');
    }
    const clustersToMerge = clusterIds.map(id => this.getCluster(id)).filter(Boolean);
    
    if (clustersToMerge.length < 2) {
      throw new Error('Need at least 2 clusters to merge');
    }

    const merged = {
      id: `merged_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: clustersToMerge[0].name,
      keywords: [],
      sourceClusters: clusterIds,
      timestamp: new Date().toISOString()
    };

    clustersToMerge.forEach(cluster => {
      merged.keywords.push(...cluster.keywords);
    });

    // Remove duplicates
    merged.keywords = [...new Set(merged.keywords)];

    this.clusters.set(merged.id, merged);
    return merged;
  }

  getCluster(clusterId) {
    const direct = this.clusters.get(clusterId);
    if (direct && Array.isArray(direct.keywords)) return direct;
    for (const clustering of this.clusters.values()) {
      const cluster = clustering.clusters?.find(item => item.id === clusterId);
      if (cluster) return cluster;
    }
    return null;
  }
}

module.exports = ClusteringEngine;
