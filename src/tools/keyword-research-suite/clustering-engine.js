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
    const { keywords, method = 'semantic', minClusterSize = 5 } = params;
    
    const clustering = {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method,
      totalKeywords: keywords.length,
      clusters: [],
      timestamp: new Date().toISOString()
    };

    // Choose clustering method
    switch (method) {
      case 'semantic':
        clustering.clusters = await this.semanticClustering(keywords, minClusterSize);
        break;
      case 'serp':
        clustering.clusters = await this.serpBasedClustering(keywords, minClusterSize);
        break;
      case 'intent':
        clustering.clusters = await this.intentBasedClustering(keywords, minClusterSize);
        break;
      default:
        clustering.clusters = await this.semanticClustering(keywords, minClusterSize);
    }

    this.clusters.set(clustering.id, clustering);
    return clustering;
  }

  // Semantic clustering (based on word similarity)
  async semanticClustering(keywords, minSize) {
    const clusters = [];
    const processed = new Set();

    keywords.forEach(keyword => {
      if (processed.has(keyword)) return;

      const cluster = {
        id: `semantic_${clusters.length + 1}`,
        name: keyword,
        keywords: [keyword],
        primaryKeyword: keyword,
        totalSearchVolume: 0,
        avgDifficulty: 0
      };

      processed.add(keyword);

      // Find similar keywords
      keywords.forEach(otherKeyword => {
        if (processed.has(otherKeyword)) return;
        
        const similarity = this.calculateSimilarity(keyword, otherKeyword);
        if (similarity > 0.6) {
          cluster.keywords.push(otherKeyword);
          processed.add(otherKeyword);
        }
      });

      if (cluster.keywords.length >= minSize) {
        clusters.push(cluster);
      }
    });

    // Calculate metrics for each cluster
    clusters.forEach(cluster => {
      cluster.totalSearchVolume = cluster.keywords.length * Math.floor(Math.random() * 10000);
      cluster.avgDifficulty = 30 + Math.floor(Math.random() * 40);
    });

    return clusters;
  }

  // SERP-based clustering (keywords with similar SERP results)
  async serpBasedClustering(keywords, minSize) {
    const clusters = [];
    const serpData = new Map();

    // Simulate SERP data for each keyword
    keywords.forEach(kw => {
      serpData.set(kw, {
        topDomains: this.getTopDomains(),
        features: this.getSerpFeatures()
      });
    });

    const processed = new Set();

    keywords.forEach(keyword => {
      if (processed.has(keyword)) return;

      const cluster = {
        id: `serp_${clusters.length + 1}`,
        name: keyword,
        keywords: [keyword],
        primaryKeyword: keyword,
        commonDomains: [],
        commonFeatures: []
      };

      processed.add(keyword);
      const keywordSerp = serpData.get(keyword);

      // Find keywords with similar SERP
      keywords.forEach(otherKeyword => {
        if (processed.has(otherKeyword)) return;
        
        const otherSerp = serpData.get(otherKeyword);
        const overlap = this.calculateSerpOverlap(keywordSerp, otherSerp);
        
        if (overlap > 0.5) {
          cluster.keywords.push(otherKeyword);
          processed.add(otherKeyword);
        }
      });

      if (cluster.keywords.length >= minSize) {
        cluster.commonDomains = keywordSerp.topDomains.slice(0, 3);
        cluster.commonFeatures = keywordSerp.features;
        clusters.push(cluster);
      }
    });

    return clusters;
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
        totalSearchVolume: kwList.length * Math.floor(Math.random() * 5000)
      });
    });

    return clusters;
  }

  // Calculate keyword similarity
  calculateSimilarity(kw1, kw2) {
    const words1 = new Set(kw1.toLowerCase().split(' '));
    const words2 = new Set(kw2.toLowerCase().split(' '));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity
    return intersection.size / union.size;
  }

  // Calculate SERP overlap
  calculateSerpOverlap(serp1, serp2) {
    const domains1 = new Set(serp1.topDomains);
    const domains2 = new Set(serp2.topDomains);
    
    const intersection = new Set([...domains1].filter(d => domains2.has(d)));
    return intersection.size / Math.max(domains1.size, domains2.size);
  }

  // Get top domains (mock)
  getTopDomains() {
    const domains = [
      'wikipedia.org', 'youtube.com', 'reddit.com', 'medium.com',
      'forbes.com', 'nytimes.com', 'techcrunch.com', 'hubspot.com'
    ];
    
    return domains
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
  }

  // Get SERP features (mock)
  getSerpFeatures() {
    const features = [
      'featured_snippet', 'people_also_ask', 'local_pack',
      'video_carousel', 'image_pack', 'knowledge_panel'
    ];
    
    return features.filter(() => Math.random() > 0.6);
  }

  // Classify intent (simple mock)
  classifyIntent(keyword) {
    const lower = keyword.toLowerCase();
    
    if (/^(what|how|why|when)/.test(lower)) return 'informational';
    if (/\b(login|sign in)\b/.test(lower)) return 'navigational';
    if (/\b(best|top|vs|review)\b/.test(lower)) return 'commercial';
    if (/\b(buy|price|purchase)\b/.test(lower)) return 'transactional';
    
    return 'informational';
  }

  // Create topic silos
  async createSilos(params) {
    const { keywords, maxSilos = 10 } = params;
    
    // First cluster keywords
    const clustering = await this.createClusters({ keywords, method: 'semantic' });
    
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
    // Select keyword with highest search volume (simulated)
    return {
      keyword: keywords[0],
      searchVolume: Math.floor(Math.random() * 50000) + 10000,
      difficulty: Math.floor(Math.random() * 100),
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
    const cluster = this.clusters.get(clusterId);
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
      targetWordCount: 3000 + Math.floor(Math.random() * 2000),
      sections: cluster.keywords.slice(0, 10)
    });

    cluster.keywords.slice(0, 5).forEach(kw => {
      suggestions.contentSuggestions.push({
        type: 'supporting_page',
        title: kw,
        targetWordCount: 1500 + Math.floor(Math.random() * 1000),
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
      `Add ${Math.floor(Math.random() * 20) + 10} more related keywords`,
      'Create video content for top 3 keywords',
      'Build interactive tools/calculators'
    ];

    return suggestions;
  }

  // Merge clusters
  async mergeClusters(clusterIds) {
    const clustersToMerge = clusterIds.map(id => this.clusters.get(id)).filter(Boolean);
    
    if (clustersToMerge.length < 2) {
      throw new Error('Need at least 2 clusters to merge');
    }

    const merged = {
      id: `merged_${Date.now()}`,
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
}

module.exports = ClusteringEngine;
