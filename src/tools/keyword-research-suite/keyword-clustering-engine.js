/**
 * Keyword Clustering Engine
 * Groups keywords into semantic clusters and topic silos for content organization
 */

class KeywordClusteringEngine {
  constructor() {
    this.clusters = new Map(); // Map<clusterId, cluster>
    this.silos = new Map(); // Map<siloId, silo>
  }

  /**
   * Create keyword clusters using semantic similarity
   */
  async clusterKeywords(keywords, params = {}) {
    const {
      method = 'semantic', // semantic, topic, intent
      minClusterSize = 3,
      maxClusters = 20
    } = params;

    const clusterId = `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const clustering = {
      id: clusterId,
      method,
      totalKeywords: keywords.length,
      clusters: [],
      unclustered: [],
      metrics: {
        avgClusterSize: 0,
        silhouetteScore: 0
      },
      timestamp: new Date().toISOString()
    };

    // Create clusters based on method
    if (method === 'semantic') {
      clustering.clusters = this._clusterBySemantic(keywords, maxClusters);
    } else if (method === 'topic') {
      clustering.clusters = this._clusterByTopic(keywords);
    } else if (method === 'intent') {
      clustering.clusters = this._clusterByIntent(keywords);
    }

    // Filter out small clusters
    const validClusters = clustering.clusters.filter(c => c.keywords.length >= minClusterSize);
    const smallClusters = clustering.clusters.filter(c => c.keywords.length < minClusterSize);
    
    clustering.clusters = validClusters;
    clustering.unclustered = smallClusters.flatMap(c => c.keywords);

    // Calculate metrics
    if (clustering.clusters.length > 0) {
      clustering.metrics.avgClusterSize = clustering.clusters.reduce((sum, c) => sum + c.keywords.length, 0) / clustering.clusters.length;
      clustering.metrics.silhouetteScore = this._calculateSilhouetteScore(clustering.clusters);
    }

    this.clusters.set(clusterId, clustering);
    return clustering;
  }

  /**
   * Build content silos from keyword clusters
   */
  async buildContentSilo(clusterIds) {
    const siloId = `silo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const silo = {
      id: siloId,
      pillarPages: [],
      supportingContent: [],
      structure: {},
      internalLinkingPlan: [],
      estimatedContent: {
        pillarPages: 0,
        supportingPages: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString()
    };

    // Process each cluster
    for (const clusterId of clusterIds) {
      const clustering = this.clusters.get(clusterId);
      if (!clustering) continue;

      clustering.clusters.forEach((cluster, index) => {
        // Create pillar page for each cluster
        const pillar = {
          id: `pillar_${siloId}_${index}`,
          topic: cluster.primaryTopic,
          targetKeywords: cluster.keywords.slice(0, 3),
          estimatedWordCount: 3000 + (cluster.keywords.length * 100),
          priority: cluster.volume > 10000 ? 'high' : 'medium',
          cluster: cluster.name
        };

        silo.pillarPages.push(pillar);

        // Create supporting content for remaining keywords
        cluster.keywords.slice(3).forEach((kw, kwIndex) => {
          silo.supportingContent.push({
            id: `support_${siloId}_${index}_${kwIndex}`,
            keyword: kw,
            pillarPageId: pillar.id,
            estimatedWordCount: 1500,
            priority: 'medium'
          });
        });

        // Define internal linking
        cluster.keywords.forEach((kw, kwIndex) => {
          if (kwIndex > 0) {
            silo.internalLinkingPlan.push({
              from: `support_${siloId}_${index}_${kwIndex}`,
              to: pillar.id,
              anchorText: `Learn more about ${cluster.primaryTopic}`,
              type: 'support-to-pillar'
            });
          }
        });
      });
    }

    // Build structure
    silo.structure = this._buildSiloStructure(silo.pillarPages, silo.supportingContent);

    // Calculate estimates
    silo.estimatedContent.pillarPages = silo.pillarPages.length;
    silo.estimatedContent.supportingPages = silo.supportingContent.length;
    silo.estimatedContent.totalPages = silo.pillarPages.length + silo.supportingContent.length;

    this.silos.set(siloId, silo);
    return silo;
  }

  /**
   * Find optimal cluster count
   */
  async findOptimalClusters(keywords, maxK = 15) {
    const analysis = {
      keywords: keywords.length,
      tested: [],
      optimalK: 0,
      optimalScore: 0,
      recommendation: '',
      timestamp: new Date().toISOString()
    };

    // Test different cluster counts
    for (let k = 3; k <= Math.min(maxK, keywords.length / 3); k++) {
      const clustering = await this.clusterKeywords(keywords, { maxClusters: k });
      
      analysis.tested.push({
        k,
        clusters: clustering.clusters.length,
        avgSize: clustering.metrics.avgClusterSize,
        silhouette: clustering.metrics.silhouetteScore
      });

      // Track best score
      if (clustering.metrics.silhouetteScore > analysis.optimalScore) {
        analysis.optimalScore = clustering.metrics.silhouetteScore;
        analysis.optimalK = k;
      }
    }

    analysis.recommendation = `Use ${analysis.optimalK} clusters for optimal grouping (silhouette score: ${analysis.optimalScore.toFixed(3)})`;

    return analysis;
  }

  /**
   * Merge similar clusters
   */
  async mergeClusters(clusterIds, threshold = 0.7) {
    const merged = {
      originalClusters: clusterIds.length,
      mergedClusters: [],
      reductions: 0,
      timestamp: new Date().toISOString()
    };

    const clustersToMerge = clusterIds.map(id => this.clusters.get(id)).filter(Boolean);
    
    // Simple merge based on semantic similarity of primary topics
    const remaining = [...clustersToMerge];
    
    while (remaining.length > 0) {
      const current = remaining.shift();
      const similar = [];

      // Find similar clusters
      for (let i = remaining.length - 1; i >= 0; i--) {
        const similarity = this._calculateClusterSimilarity(current, remaining[i]);
        if (similarity >= threshold) {
          similar.push(remaining.splice(i, 1)[0]);
        }
      }

      // Merge if found similar clusters
      if (similar.length > 0) {
        const mergedCluster = this._mergeClustersData([current, ...similar]);
        merged.mergedClusters.push(mergedCluster);
        merged.reductions += similar.length;
      } else {
        merged.mergedClusters.push(current);
      }
    }

    return merged;
  }

  /**
   * Suggest cluster names
   */
  async suggestClusterNames(cluster) {
    const suggestions = {
      clusterId: cluster.id,
      suggestions: [],
      recommended: '',
      timestamp: new Date().toISOString()
    };

    // Extract common words from cluster keywords
    const wordFrequency = this._extractCommonWords(cluster.keywords);
    const topWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    // Generate name suggestions
    suggestions.suggestions = [
      { name: topWords.join(' '), type: 'word-frequency', score: 90 },
      { name: cluster.primaryTopic || 'Topic Cluster', type: 'primary-topic', score: 85 },
      { name: `${topWords[0]} Resources`, type: 'descriptive', score: 75 },
      { name: `Complete ${topWords[0]} Guide`, type: 'content-angle', score: 70 }
    ];

    suggestions.recommended = suggestions.suggestions[0].name;

    return suggestions;
  }

  /**
   * Analyze cluster quality
   */
  async analyzeClusterQuality(clusterId) {
    const clustering = this.clusters.get(clusterId);
    if (!clustering) {
      throw new Error('Cluster not found');
    }

    const quality = {
      clusterId,
      overallScore: 0,
      metrics: {
        cohesion: 0,
        separation: 0,
        size: 0,
        coverage: 0
      },
      issues: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Evaluate cohesion (how similar keywords in cluster are)
    quality.metrics.cohesion = clustering.metrics.silhouetteScore * 100;

    // Evaluate separation (how distinct clusters are)
    quality.metrics.separation = this._calculateSeparation(clustering.clusters);

    // Evaluate size distribution
    quality.metrics.size = this._evaluateSizeDistribution(clustering.clusters);

    // Evaluate coverage (% of keywords clustered)
    quality.metrics.coverage = ((clustering.totalKeywords - clustering.unclustered.length) / clustering.totalKeywords) * 100;

    // Calculate overall score
    quality.overallScore = (
      quality.metrics.cohesion * 0.3 +
      quality.metrics.separation * 0.2 +
      quality.metrics.size * 0.2 +
      quality.metrics.coverage * 0.3
    );

    // Identify issues
    if (quality.metrics.cohesion < 50) {
      quality.issues.push({ type: 'low-cohesion', message: 'Clusters lack internal similarity' });
    }
    if (quality.metrics.coverage < 80) {
      quality.issues.push({ type: 'low-coverage', message: `${clustering.unclustered.length} keywords unclustered` });
    }

    // Generate recommendations
    if (quality.issues.length > 0) {
      quality.recommendations.push({
        action: 'Adjust clustering parameters',
        priority: 'medium',
        details: 'Try different methods or cluster counts'
      });
    }

    return quality;
  }

  /**
   * Export clusters to content calendar
   */
  async exportToContentCalendar(siloId, startDate, publishingFrequency = 'weekly') {
    const silo = this.silos.get(siloId);
    if (!silo) {
      throw new Error('Silo not found');
    }

    const calendar = {
      siloId,
      entries: [],
      timeline: {
        start: startDate,
        estimatedCompletion: null,
        totalWeeks: 0
      },
      timestamp: new Date().toISOString()
    };

    const start = new Date(startDate);
    let currentDate = new Date(start);
    const daysIncrement = publishingFrequency === 'daily' ? 1 : publishingFrequency === 'weekly' ? 7 : 30;

    // Schedule pillar pages first
    silo.pillarPages.forEach((pillar, index) => {
      calendar.entries.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        type: 'pillar',
        contentId: pillar.id,
        topic: pillar.topic,
        keywords: pillar.targetKeywords,
        estimatedWordCount: pillar.estimatedWordCount,
        priority: pillar.priority
      });
      currentDate.setDate(currentDate.getDate() + daysIncrement);
    });

    // Schedule supporting content
    silo.supportingContent.forEach((support, index) => {
      calendar.entries.push({
        date: new Date(currentDate).toISOString().split('T')[0],
        type: 'supporting',
        contentId: support.id,
        keyword: support.keyword,
        pillarPageId: support.pillarPageId,
        estimatedWordCount: support.estimatedWordCount,
        priority: support.priority
      });
      currentDate.setDate(currentDate.getDate() + daysIncrement);
    });

    calendar.timeline.estimatedCompletion = new Date(currentDate).toISOString().split('T')[0];
    calendar.timeline.totalWeeks = Math.ceil((currentDate - start) / (1000 * 60 * 60 * 24 * 7));

    return calendar;
  }

  // === Helper Methods ===

  _clusterBySemantic(keywords, maxClusters) {
    const clusters = [];
    const wordGroups = {};

    // Group by common words (simplified semantic clustering)
    keywords.forEach(kw => {
      const words = kw.toLowerCase().split(' ');
      const mainWord = words[0]; // Simplified - use first word as key

      if (!wordGroups[mainWord]) {
        wordGroups[mainWord] = [];
      }
      wordGroups[mainWord].push(kw);
    });

    // Convert to cluster format
    let clusterIndex = 0;
    Object.entries(wordGroups).forEach(([word, kws]) => {
      if (clusterIndex >= maxClusters) return;
      
      clusters.push({
        id: `cluster_${clusterIndex}`,
        name: `${word} cluster`,
        primaryTopic: word,
        keywords: kws,
        volume: kws.length * 1000, // Simplified volume
        avgDifficulty: 50
      });
      clusterIndex++;
    });

    return clusters.slice(0, maxClusters);
  }

  _clusterByTopic(keywords) {
    // Simplified topic-based clustering
    const topics = ['basics', 'advanced', 'tools', 'guides', 'reviews'];
    const clusters = topics.map((topic, index) => ({
      id: `topic_cluster_${index}`,
      name: `${topic} cluster`,
      primaryTopic: topic,
      keywords: keywords.filter(kw => Math.random() > 0.7),
      volume: Math.floor(Math.random() * 10000) + 1000,
      avgDifficulty: Math.floor(Math.random() * 50) + 30
    })).filter(c => c.keywords.length > 0);

    return clusters;
  }

  _clusterByIntent(keywords) {
    const intents = ['informational', 'commercial', 'transactional'];
    const clusters = intents.map((intent, index) => ({
      id: `intent_cluster_${index}`,
      name: `${intent} cluster`,
      primaryTopic: intent,
      keywords: keywords.filter(() => Math.random() > 0.6),
      volume: Math.floor(Math.random() * 8000) + 2000,
      avgDifficulty: Math.floor(Math.random() * 40) + 40
    })).filter(c => c.keywords.length > 0);

    return clusters;
  }

  _calculateSilhouetteScore(clusters) {
    // Simplified silhouette calculation
    // Real implementation would calculate actual cohesion/separation
    if (clusters.length === 0) return 0;
    
    const avgSize = clusters.reduce((sum, c) => sum + c.keywords.length, 0) / clusters.length;
    const sizeVariance = clusters.reduce((sum, c) => {
      return sum + Math.pow(c.keywords.length - avgSize, 2);
    }, 0) / clusters.length;

    // Lower variance = better clustering
    const score = Math.max(0, 1 - (sizeVariance / (avgSize * avgSize)));
    return score;
  }

  _buildSiloStructure(pillarPages, supportingContent) {
    const structure = {
      levels: {
        pillar: pillarPages.length,
        supporting: supportingContent.length
      },
      hierarchy: {}
    };

    pillarPages.forEach(pillar => {
      structure.hierarchy[pillar.id] = {
        title: pillar.topic,
        children: supportingContent
          .filter(s => s.pillarPageId === pillar.id)
          .map(s => s.id)
      };
    });

    return structure;
  }

  _calculateClusterSimilarity(cluster1, cluster2) {
    // Simplified similarity calculation
    const words1 = new Set(cluster1.keywords.flatMap(kw => kw.toLowerCase().split(' ')));
    const words2 = new Set(cluster2.keywords.flatMap(kw => kw.toLowerCase().split(' ')));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  _mergeClustersData(clusters) {
    const merged = {
      id: `merged_${Date.now()}`,
      name: clusters[0].name,
      primaryTopic: clusters[0].primaryTopic,
      keywords: [],
      volume: 0,
      avgDifficulty: 0
    };

    clusters.forEach(c => {
      merged.keywords.push(...c.keywords);
      merged.volume += c.volume;
    });

    merged.avgDifficulty = merged.volume / clusters.length;

    return merged;
  }

  _extractCommonWords(keywords) {
    const frequency = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

    keywords.forEach(kw => {
      const words = kw.toLowerCase().split(' ');
      words.forEach(word => {
        if (!stopWords.has(word) && word.length > 2) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });
    });

    return frequency;
  }

  _calculateSeparation(clusters) {
    // Simplified - measures how distinct cluster topics are
    if (clusters.length < 2) return 100;

    const topics = clusters.map(c => c.primaryTopic);
    const uniqueTopics = new Set(topics);
    
    return (uniqueTopics.size / topics.length) * 100;
  }

  _evaluateSizeDistribution(clusters) {
    if (clusters.length === 0) return 0;

    const sizes = clusters.map(c => c.keywords.length);
    const avg = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
    const variance = sizes.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / sizes.length;
    
    // Lower variance = more balanced = higher score
    const coefficientOfVariation = Math.sqrt(variance) / avg;
    return Math.max(0, 100 - (coefficientOfVariation * 50));
  }
}

module.exports = KeywordClusteringEngine;
