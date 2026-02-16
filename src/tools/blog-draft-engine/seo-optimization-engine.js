/**
 * Blog Draft Engine - SEO Optimization Engine
 * Handles SEO analysis, keyword optimization, meta tags, schema markup
 */

class SEOOptimizationEngine {
  constructor() {
    this.seoScores = new Map();
    this.keywordData = new Map();
    this.competitorData = new Map();
  }

  /**
   * Comprehensive SEO analysis
   */
  async analyzeSEO(draftId, content, metadata = {}) {
    const analysis = {
      draftId,
      timestamp: new Date().toISOString(),
      overallScore: 0,
      sections: {}
    };

    // Analyze each SEO aspect
    analysis.sections.keywords = await this.analyzeKeywords(content, metadata.targetKeywords || []);
    analysis.sections.metadata = await this.analyzeMetadata(metadata);
    analysis.sections.headings = await this.analyzeHeadings(content);
    analysis.sections.links = await this.analyzeLinks(content);
    analysis.sections.images = await this.analyzeImages(content, metadata);
    analysis.sections.readability = await this.analyzeReadability(content);
    analysis.sections.schema = await this.analyzeSchema(metadata);

    // Calculate overall score (0-100)
    analysis.overallScore = this.calculateOverallSEOScore(analysis.sections);

    this.seoScores.set(draftId, analysis);

    return {
      success: true,
      analysis,
      recommendations: this.generateRecommendations(analysis)
    };
  }

  /**
   * Keyword optimization analysis
   */
  async analyzeKeywords(content, targetKeywords) {
    const results = {
      score: 0,
      targetKeywords: [],
      keywordDensity: {},
      keywordPositions: {},
      issues: [],
      suggestions: []
    };

    for (const keyword of targetKeywords) {
      const density = this.calculateKeywordDensity(content, keyword);
      const positions = this.findKeywordPositions(content, keyword);

      results.keywordDensity[keyword] = density;
      results.keywordPositions[keyword] = positions;

      // Check if keyword appears in important positions
      const inTitle = content.toLowerCase().includes(keyword.toLowerCase()) && content.indexOf(keyword) < 100;
      const inFirstParagraph = positions.some(pos => pos < 300);
      const inHeadings = this.checkKeywordInHeadings(content, keyword);

      results.targetKeywords.push({
        keyword,
        density,
        positions: positions.length,
        inTitle,
        inFirstParagraph,
        inHeadings,
        score: this.scoreKeywordUsage(density, inTitle, inFirstParagraph, inHeadings)
      });

      // Generate issues and suggestions
      if (density < 0.5) {
        results.issues.push(`:keyword "${keyword}" appears too rarely (${density}%). Aim for 1-2%.`);
        results.suggestions.push(`Add "${keyword}" naturally 2-3 more times throughout the content.`);
      } else if (density > 3) {
        results.issues.push(`Keyword "${keyword}" appears too often (${density}%). Risk of keyword stuffing.`);
        results.suggestions.push(`Reduce usage of "${keyword}" to maintain natural flow.`);
      }

      if (!inFirstParagraph) {
        results.suggestions.push(`Include "${keyword}" in the first paragraph for better SEO.`);
      }

      if (!inHeadings) {
        results.suggestions.push(`Use "${keyword}" in at least one heading (H2 or H3).`);
      }
    }

    // Calculate keyword section score
    const avgKeywordScore = results.targetKeywords.reduce((sum, kw) => sum + kw.score, 0) / targetKeywords.length;
    results.score = Math.round(avgKeywordScore);

    return results;
  }

  /**
   * Metadata analysis (title, description, URL)
   */
  async analyzeMetadata(metadata) {
    const results = {
      score: 0,
      title: {},
      description: {},
      url: {},
      issues: [],
      suggestions: []
    };

    // Title analysis
    if (metadata.title) {
      const titleLength = metadata.title.length;
      results.title = {
        length: titleLength,
        optimal: titleLength >= 50 && titleLength <= 60,
        hasNumber: /\d/.test(metadata.title),
        hasPowerWords: this.containsPowerWords(metadata.title),
        score: this.scoreTitleSEO(metadata.title)
      };

      if (titleLength < 50) {
        results.issues.push(`Title too short (${titleLength} chars). Aim for 50-60 characters.`);
        results.suggestions.push('Expand title with descriptive keywords.');
      } else if (titleLength > 60) {
        results.issues.push(`Title too long (${titleLength} chars). May be truncated in search results.`);
        results.suggestions.push('Shorten title to 50-60 characters.');
      }

      if (!results.title.hasNumber) {
        results.suggestions.push('Consider adding a number to title (e.g., "10 Ways to...") for higher CTR.');
      }
    } else {
      results.issues.push('Missing SEO title.');
      results.suggestions.push('Add an optimized title (50-60 characters) for better search visibility.');
    }

    // Description analysis
    if (metadata.description) {
      const descLength = metadata.description.length;
      results.description = {
        length: descLength,
        optimal: descLength >= 150 && descLength <= 160,
        hasCTA: this.containsCTA(metadata.description),
        score: this.scoreDescriptionSEO(metadata.description)
      };

      if (descLength < 150) {
        results.issues.push(`Meta description too short (${descLength} chars). Aim for 150-160.`);
        results.suggestions.push('Expand description to provide more context and include keywords.');
      } else if (descLength > 160) {
        results.issues.push(`Meta description too long (${descLength} chars). Will be truncated.`);
        results.suggestions.push('Shorten description to 150-160 characters.');
      }

      if (!results.description.hasCTA) {
        results.suggestions.push('Add a call-to-action to meta description (e.g., "Learn more", "Discover how").');
      }
    } else {
      results.issues.push('Missing meta description.');
      results.suggestions.push('Add a compelling meta description (150-160 characters) with target keywords.');
    }

    // URL analysis
    if (metadata.url || metadata.slug) {
      const url = metadata.url || metadata.slug;
      results.url = {
        length: url.length,
        hasKeywords: this.urlContainsKeywords(url, metadata.targetKeywords || []),
        hasStopWords: this.urlContainsStopWords(url),
        score: this.scoreURLSEO(url)
      };

      if (url.length > 60) {
        results.issues.push(`URL too long (${url.length} chars). Keep under 60 characters.`);
        results.suggestions.push('Shorten URL to core keywords only.');
      }

      if (results.url.hasStopWords) {
        results.suggestions.push('Remove stop words from URL (a, an, the, of, etc.).');
      }

      if (!results.url.hasKeywords) {
        results.suggestions.push('Include target keyword in URL for better SEO.');
      }
    }

    // Calculate metadata section score
    results.score = Math.round(
      (results.title.score + results.description.score + results.url.score) / 3
    );

    return results;
  }

  /**
   * Heading structure analysis
   */
  async analyzeHeadings(content) {
    const results = {
      score: 0,
      structure: [],
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      issues: [],
      suggestions: []
    };

    // Extract all headings
    const headingMatches = content.match(/^(#{1,6})\s+(.+)$/gm) || [];
    
    headingMatches.forEach(heading => {
      const level = heading.match(/^#{1,6}/)[0].length;
      const text = heading.replace(/^#{1,6}\s+/, '');
      
      results.structure.push({ level, text });
      
      if (level === 1) results.h1Count++;
      if (level === 2) results.h2Count++;
      if (level === 3) results.h3Count++;
    });

    // Analyze heading structure
    if (results.h1Count === 0) {
      results.issues.push('Missing H1 heading. Every post should have one main H1.');
      results.suggestions.push('Add an H1 heading at the top of your content.');
    } else if (results.h1Count > 1) {
      results.issues.push(`Multiple H1 headings found (${results.h1Count}). Use only one H1 per post.`);
      results.suggestions.push('Convert additional H1s to H2 or H3.');
    }

    if (results.h2Count < 3) {
      results.issues.push(`Only ${results.h2Count} H2 headings found. Use more for better structure.`);
      results.suggestions.push('Add 3-5 H2 headings to organize your content.');
    }

    // Check for heading hierarchy
    const hasProperHierarchy = this.checkHeadingHierarchy(results.structure);
    if (!hasProperHierarchy) {
      results.issues.push('Heading hierarchy is broken (e.g., H1 → H3 without H2).');
      results.suggestions.push('Maintain proper heading hierarchy (H1 → H2 → H3).');
    }

    // Calculate score
    results.score = this.scoreHeadingStructure(results);

    return results;
  }

  /**
   * Internal and external links analysis
   */
  async analyzeLinks(content) {
    const results = {
      score: 0,
      internal: [],
      external: [],
      total: 0,
      issues: [],
      suggestions: []
    };

    // Extract all markdown links
    const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    
    linkMatches.forEach(link => {
      const url = link.match(/\(([^)]+)\)/)[1];
      const text = link.match(/\[([^\]]+)\]/)[1];
      
      const isExternal = url.startsWith('http://') || url.startsWith('https://');
      
      if (isExternal) {
        results.external.push({ url, text });
      } else {
        results.internal.push({ url, text });
      }
    });

    results.total = results.internal.length + results.external.length;

    // Analyze link distribution
    if (results.internal.length < 2) {
      results.issues.push(`Only ${results.internal.length} internal links. Add more for better SEO.`);
      results.suggestions.push('Add 3-5 internal links to related content on your site.');
    }

    if (results.external.length < 1) {
      results.suggestions.push('Add 1-2 external links to authoritative sources for credibility.');
    }

    // Check for link text quality
    const hasGenericLinkText = results.internal.concat(results.external)
      .some(link => /click here|read more|this|here/i.test(link.text));
    
    if (hasGenericLinkText) {
      results.issues.push('Some links use generic anchor text ("click here", "read more").');
      results.suggestions.push('Use descriptive anchor text that includes keywords.');
    }

    // Calculate score
    results.score = this.scoreLinkStructure(results);

    return results;
  }

  /**
   * Image optimization analysis
   */
  async analyzeImages(content, metadata) {
    const results = {
      score: 0,
      images: [],
      total: 0,
      issues: [],
      suggestions: []
    };

    // Extract image references
    const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
    
    imageMatches.forEach(img => {
      const alt = img.match(/!\[([^\]]*)\]/)[1];
      const src = img.match(/\(([^)]+)\)/)[1];
      
      results.images.push({
        src,
        alt,
        hasAlt: alt.length > 0,
        altLength: alt.length
      });
    });

    results.total = results.images.length;

    // Analyze image SEO
    const imagesWithoutAlt = results.images.filter(img => !img.hasAlt);
    if (imagesWithoutAlt.length > 0) {
      results.issues.push(`${imagesWithoutAlt.length} images missing alt text.`);
      results.suggestions.push('Add descriptive alt text to all images for accessibility and SEO.');
    }

    const imagesWithShortAlt = results.images.filter(img => img.hasAlt && img.altLength < 10);
    if (imagesWithShortAlt.length > 0) {
      results.issues.push(`${imagesWithShortAlt.length} images have very short alt text.`);
      results.suggestions.push('Use descriptive alt text (125 characters recommended).');
    }

    if (results.total < 1) {
      results.suggestions.push('Add at least one image to improve engagement and SEO.');
    }

    // Calculate score
    results.score = this.scoreImageSEO(results);

    return results;
  }

  /**
   * Readability analysis for SEO
   */
  async analyzeReadability(content) {
    const results = {
      score: 0,
      metrics: {},
      issues: [],
      suggestions: []
    };

    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const syllables = this.countSyllables(content);

    //Flesch Reading Ease
    const flesch = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    results.metrics.flesch = Math.round(flesch);
    results.metrics.grade = this.fleschToGradeLevel(flesch);

    // Checks
    if (flesch < 60) {
      results.issues.push(`Content is difficult to read (Flesch score: ${results.metrics.flesch}).`);
      results.suggestions.push('Use shorter sentences and simpler words to improve readability.');
    }

    results.score = Math.min(100, Math.max(0, results.metrics.flesch));

    return results;
  }

  /**
   * Schema markup analysis
   */
  async analyzeSchema(metadata) {
    const results = {
      score: 0,
      hasSchema: false,
      types: [],
      issues: [],
      suggestions: []
    };

    if (metadata.schema) {
      results.hasSchema = true;
      results.types = metadata.schema.types || [];
      results.score = 100;
    } else {
      results.issues.push('No schema markup defined.');
      results.suggestions.push('Add Article or BlogPosting schema markup for rich snippets.');
      results.score = 0;
    }

    return results;
  }

  /**
   * Helper methods
   */
  calculateKeywordDensity(content, keyword) {
    const total Words = content.split(/\s+/).length;
    const keywordMatches = (content.match(new RegExp(keyword, 'gi')) || []).length;
    return ((keywordMatches / totalWords) * 100).toFixed(2);
  }

  findKeywordPositions(content, keyword) {
    const positions = [];
    let index = content.toLowerCase().indexOf(keyword.toLowerCase());
    while (index !== -1) {
      positions.push(index);
      index = content.toLowerCase().indexOf(keyword.toLowerCase(), index + 1);
    }
    return positions;
  }

  checkKeywordInHeadings(content, keyword) {
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    return headings.some(h => h.toLowerCase().includes(keyword.toLowerCase()));
  }

  scoreKeywordUsage(density, inTitle, inFirstParagraph, inHeadings) {
    let score = 0;
    
    // Density score (50 points)
    if (density >= 1 && density <= 2) score += 50;
    else if (density >= 0.5 && density <= 3) score += 30;
    else score += 10;
    
    // Position bonuses
    if (inTitle) score += 20;
    if (inFirstParagraph) score += 15;
    if (inHeadings) score += 15;
    
    return Math.min(100, score);
  }

  containsPowerWords(text) {
    const powerWords = ['ultimate', 'complete', 'essential', 'proven', 'amazing', 'secret', 'best', 'top'];
    return powerWords.some(word => text.toLowerCase().includes(word));
  }

  containsCTA(text) {
    const ctas = ['learn', 'discover', 'find out', 'get', 'download', 'try', 'start'];
    return ctas.some(cta => text.toLowerCase().includes(cta));
  }

  urlContainsKeywords(url, keywords) {
    return keywords.some(kw => url.toLowerCase().includes(kw.toLowerCase()));
  }

  urlContainsStopWords(url) {
    const stopWords = ['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for'];
    return stopWords.some(word => url.toLowerCase().includes(`-${word}-`) || url.toLowerCase().includes(`_${word}_`));
  }

  scoreTitleSEO(title) {
    let score = 0;
    const length = title.length;
    
    if (length >= 50 && length <= 60) score += 40;
    else if (length >= 40 && length <= 70) score += 25;
    else score += 10;
    
    if (/\d/.test(title)) score += 20;
    if (this.containsPowerWords(title)) score += 20;
    if (title.split(' ').length >= 6) score += 20;
    
    return Math.min(100, score);
  }

  scoreDescriptionSEO(description) {
    let score = 0;
    const length = description.length;
    
    if (length >= 150 && length <= 160) score += 50;
    else if (length >= 140 && length <= 170) score += 30;
    else score += 10;
    
    if (this.containsCTA(description)) score += 50;
    
    return Math.min(100, score);
  }

  scoreURLSEO(url) {
    let score = 100;
    
    if (url.length > 60) score -= 30;
    if (this.urlContainsStopWords(url)) score -= 20;
    if (!/[a-z0-9-]/.test(url)) score -= 20;
    
    return Math.max(0, score);
  }

  checkHeadingHierarchy(structure) {
    for (let i = 1; i < structure.length; i++) {
      const prevLevel = structure[i - 1].level;
      const currLevel = structure[i].level;
      
      // Can't jump more than one level
      if (currLevel > prevLevel + 1) {
        return false;
      }
    }
    return true;
  }

  scoreHeadingStructure(results) {
    let score = 0;
    
    if (results.h1Count === 1) score += 30;
    if (results.h2Count >= 3 && results.h2Count <= 8) score += 40;
    else if (results.h2Count > 0) score += 20;
    
    if (results.h3Count > 0) score += 15;
    if (this.checkHeadingHierarchy(results.structure)) score += 15;
    
    return Math.min(100, score);
  }

  scoreLinkStructure(results) {
    let score = 0;
    
    if (results.internal.length >= 3) score += 50;
    else if (results.internal.length > 0) score += 25;
    
    if (results.external.length >= 1) score += 30;
    if (results.external.length >= 3) score += 20;
    
    return Math.min(100, score);
  }

  scoreImageSEO(results) {
    if (results.total === 0) return 50;
    
    const withAlt = results.images.filter(img => img.hasAlt).length;
    const percentage = (withAlt / results.total) * 100;
    
    return Math.round(percentage);
  }

  countSyllables(text) {
    // Simplified syllable counting
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    
    words.forEach(word => {
      const vowels = word.match(/[aeiouy]+/g);
      count += vowels ? vowels.length : 1;
    });
    
    return count;
  }

  fleschToGradeLevel(score) {
    if (score >= 90) return '5th grade';
    if (score >= 80) return '6th grade';
    if (score >= 70) return '7th grade';
    if (score >= 60) return '8th-9th grade';
    if (score >= 50) return '10th-12th grade';
    if (score >= 30) return 'College';
    return 'College graduate';
  }

  calculateOverallSEOScore(sections) {
    const weights = {
      keywords: 0.25,
      metadata: 0.20,
      headings: 0.15,
      links: 0.15,
      images: 0.10,
      readability: 0.10,
      schema: 0.05
    };

    let totalScore = 0;
    Object.keys(weights).forEach(section => {
      if (sections[section]) {
        totalScore += sections[section].score * weights[section];
      }
    });

    return Math.round(totalScore);
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    Object.values(analysis.sections).forEach(section => {
      if (section.issues) {
        recommendations.push(...section.issues.map(issue => ({
          type: 'issue',
          message: issue,
          priority: 'high'
        })));
      }
      if (section.suggestions) {
        recommendations.push(...section.suggestions.map(suggestion => ({
          type: 'suggestion',
          message: suggestion,
          priority: 'medium'
        })));
      }
    });

    return recommendations;
  }
}

module.exports = SEOOptimizationEngine;
