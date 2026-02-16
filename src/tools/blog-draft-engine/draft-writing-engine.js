/**
 * Blog Draft Engine - Draft Writing Engine
 * Handles draft creation, AI assistance, revision tracking, content templates
 */

class DraftWritingEngine {
  constructor() {
    this.drafts = new Map();
    this.revisionHistory = new Map();
    this.templates = new Map();
    this.autoSaveInterval = 30000; // 30 seconds
  }

  /**
   * Create new draft from scratch or template
   */
  async createDraft(params) {
    const {
      title = '',
      content = '',
      templateId = null,
      metadata = {},
      userId,
      blogId
    } = params;

    const draft = {
      id: this.generateId(),
      title,
      content,
      templateId,
      metadata: {
        ...metadata,
        wordCount: this.countWords(content),
        readingTime: this.calculateReadingTime(content),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      status: 'draft', // draft, in_review, scheduled, published
      userId,
      blogId,
      version: 1,
      autoSave: true
    };

    // Apply template if specified
    if (templateId && this.templates.has(templateId)) {
      const template = this.templates.get(templateId);
      draft.content = this.applyTemplate(template, draft);
      draft.title = template.defaultTitle || draft.title;
    }

    this.drafts.set(draft.id, draft);
    this.createRevision(draft.id, 'Created', draft.content);

    return {
      success: true,
      draft,
      message: 'Draft created successfully'
    };
  }

  /**
   * Update draft content with auto-save and revision tracking
   */
  async updateDraft(draftId, updates) {
    if (!this.drafts.has(draftId)) {
      return { success: false, error: 'Draft not found' };
    }

    const draft = this.drafts.get(draftId);
    const previousContent = draft.content;

    // Apply updates
    Object.assign(draft, updates, {
      metadata: {
        ...draft.metadata,
        ...updates.metadata,
        wordCount: this.countWords(updates.content || draft.content),
        readingTime: this.calculateReadingTime(updates.content || draft.content),
        updatedAt: new Date().toISOString()
      },
      version: draft.version + 1
    });

    // Track revision if content changed significantly
    if (updates.content && this.hasSignificantChange(previousContent, updates.content)) {
      this.createRevision(draftId, 'Edited', updates.content);
    }

    this.drafts.set(draftId, draft);

    return {
      success: true,
      draft,
      message: 'Draft updated successfully'
    };
  }

  /**
   * AI-powered content generation
   */
  async generateContent(params) {
    const {
      prompt,
      tone = 'professional', // professional, casual, friendly, authoritative, conversational
      style = 'informative', // informative, persuasive, narrative, descriptive, technical
      length = 'medium', // short (300-500), medium (500-1000), long (1000-2000)
      targetAudience = 'general',
      keywords = [],
      model = 'gpt-4',
      temperature = 0.7
    } = params;

    // Construct AI prompt with context
    const aiPrompt = this.buildAIPrompt({
      prompt,
      tone,
      style,
      length,
      targetAudience,
      keywords
    });

    // Simulate AI generation (in production, call actual AI API)
    const generatedContent = await this.callAIModel(model, aiPrompt, temperature);

    return {
      success: true,
      content: generatedContent,
      metadata: {
        model,
        tone,
        style,
        length,
        wordCount: this.countWords(generatedContent),
        keywords: this.extractKeywords(generatedContent),
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * AI content improvement suggestions
   */
  async improveContent(content, options = {}) {
    const {
      focus = 'all', // all, clarity, engagement, seo, readability, grammar
      aggressiveness = 'moderate' // conservative, moderate, aggressive
    } = options;

    const suggestions = [];

    // Clarity improvements
    if (focus === 'all' || focus === 'clarity') {
      suggestions.push(...this.analyzeClarityIssues(content));
    }

    // Engagement improvements
    if (focus === 'all' || focus === 'engagement') {
      suggestions.push(...this.analyzeEngagementIssues(content));
    }

    // SEO improvements
    if (focus === 'all' || focus === 'seo') {
      suggestions.push(...this.analyzeSEOIssues(content));
    }

    // Readability improvements
    if (focus === 'all' || focus === 'readability') {
      suggestions.push(...this.analyzeReadabilityIssues(content));
    }

    // Grammar and style
    if (focus === 'all' || focus === 'grammar') {
      suggestions.push(...this.analyzeGrammarIssues(content));
    }

    // Score and prioritize suggestions
    const scoredSuggestions = this.scoreSuggestions(suggestions, aggressiveness);

    return {
      success: true,
      suggestions: scoredSuggestions,
      summary: {
        total: scoredSuggestions.length,
        critical: scoredSuggestions.filter(s => s.priority === 'critical').length,
        high: scoredSuggestions.filter(s => s.priority === 'high').length,
        medium: scoredSuggestions.filter(s => s.priority === 'medium').length,
        low: scoredSuggestions.filter(s => s.priority === 'low').length
      }
    };
  }

  /**
   * Apply AI suggestion to content
   */
  async applySuggestion(content, suggestion) {
    const {
      type,
      location,
      original,
      replacement,
      explanation
    } = suggestion;

    // Apply the replacement
    let updatedContent = content;
    if (location && location.start !== undefined && location.end !== undefined) {
      updatedContent = 
        content.substring(0, location.start) +
        replacement +
        content.substring(location.end);
    } else {
      // Simple find/replace if no location specified
      updatedContent = content.replace(original, replacement);
    }

    return {
      success: true,
      content: updatedContent,
      applied: {
        type,
        original,
        replacement,
        explanation
      }
    };
  }

  /**
   * Auto-save draft (called periodically)
   */
  async autoSave(draftId) {
    if (!this.drafts.has(draftId)) {
      return { success: false, error: 'Draft not found' };
    }

    const draft = this.drafts.get(draftId);
    
    if (!draft.autoSave) {
      return { success: false, message: 'Auto-save disabled for this draft' };
    }

    // Save to persistent storage (database, etc.)
    await this.persistDraft(draft);

    return {
      success: true,
      message: 'Draft auto-saved',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Revision tracking
   */
  createRevision(draftId, action, content) {
    if (!this.revisionHistory.has(draftId)) {
      this.revisionHistory.set(draftId, []);
    }

    const revisions = this.revisionHistory.get(draftId);
    revisions.push({
      id: this.generateId(),
      action,
      content,
      timestamp: new Date().toISOString(),
      contentHash: this.hashContent(content)
    });

    // Keep only last 50 revisions
    if (revisions.length > 50) {
      revisions.shift();
    }

    this.revisionHistory.set(draftId, revisions);
  }

  /**
   * Get revision history
   */
  getRevisions(draftId) {
    return this.revisionHistory.get(draftId) || [];
  }

  /**
   * Restore from revision
   */
  async restoreRevision(draftId, revisionId) {
    const revisions = this.revisionHistory.get(draftId);
    if (!revisions) {
      return { success: false, error: 'No revisions found' };
    }

    const revision = revisions.find(r => r.id === revisionId);
    if (!revision) {
      return { success: false, error: 'Revision not found' };
    }

    const draft = this.drafts.get(draftId);
    const result = await this.updateDraft(draftId, {
      content: revision.content
    });

    this.createRevision(draftId, `Restored from revision ${revisionId}`, revision.content);

    return {
      success: true,
      draft: result.draft,
      message: `Restored to revision from ${revision.timestamp}`
    };
  }

  /**
   * Template management
   */
  createTemplate(params) {
    const {
      name,
      description,
      content,
      structure,
      defaultTitle = '',
      category = 'general',
      metadata = {}
    } = params;

    const template = {
      id: this.generateId(),
      name,
      description,
      content,
      structure,
      defaultTitle,
      category,
      metadata,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    this.templates.set(template.id, template);

    return {
      success: true,
      template,
      message: 'Template created successfully'
    };
  }

  getTemplates(filters = {}) {
    let templates = Array.from(this.templates.values());

    if (filters.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    return {
      success: true,
      templates,
      total: templates.length
    };
  }

  applyTemplate(template, draft) {
    let content = template.content;

    // Replace placeholders with draft metadata
    content = content.replace(/\{\{title\}\}/g, draft.title || '');
    content = content.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
    
    // Apply structure if defined
    if (template.structure) {
      content = this.applyStructure(content, template.structure);
    }

    return content;
  }

  /**
   * Helper methods
   */
  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  calculateReadingTime(text) {
    const words = this.countWords(text);
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }

  hasSignificantChange(oldContent, newContent) {
    if (!oldContent || !newContent) return true;
    
    const oldWords = this.countWords(oldContent);
    const newWords = this.countWords(newContent);
    const difference = Math.abs(newWords - oldWords);
    
    // Consider significant if >50 words changed or >10% change
    return difference > 50 || (difference / oldWords) > 0.1;
  }

  buildAIPrompt(params) {
    const { prompt, tone, style, length, targetAudience, keywords } = params;

    let aiPrompt = `Write a ${length} blog post with a ${tone} tone in a ${style} style.\n\n`;
    aiPrompt += `Target audience: ${targetAudience}\n\n`;
    
    if (keywords.length > 0) {
      aiPrompt += `Include these keywords naturally: ${keywords.join(', ')}\n\n`;
    }
    
    aiPrompt += `Topic: ${prompt}\n\n`;
    aiPrompt += `Please provide well-structured, engaging content with proper headings and paragraphs.`;

    return aiPrompt;
  }

  async callAIModel(model, prompt, temperature) {
    // In production, call actual AI API (OpenAI, Anthropic, etc.)
    // For now, return placeholder
    return `# Generated Content\n\nThis is AI-generated content based on your prompt.\n\n## Section 1\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n## Section 2\n\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
  }

  extractKeywords(content) {
    // Simple keyword extraction (in production, use NLP)
    const words = content.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 5);
    
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  analyzeClarityIssues(content) {
    const suggestions = [];

    // Check for passive voice
    const passiveMatches = content.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/gi);
    if (passiveMatches && passiveMatches.length > 5) {
      suggestions.push({
        type: 'clarity',
        priority: 'medium',
        message: `Found ${passiveMatches.length} instances of passive voice. Consider using active voice for clarity.`,
        examples: passiveMatches.slice(0, 3)
      });
    }

    // Check for long sentences
    const sentences = content.split(/[.!?]+/);
    const longSentences = sentences.filter(s => this.countWords(s) > 25);
    if (longSentences.length > 0) {
      suggestions.push({
        type: 'clarity',
        priority: 'medium',
        message: `${longSentences.length} sentences are too long (>25 words). Break them up for better readability.`,
        examples: longSentences.slice(0, 2)
      });
    }

    return suggestions;
  }

  analyzeEngagementIssues(content) {
    const suggestions = [];

    // Check for questions (engagement tactic)
    const questions = (content.match(/\?/g) || []).length;
    if (questions < 2) {
      suggestions.push({
        type: 'engagement',
        priority: 'low',
        message: 'Add 2-3 questions to engage readers and encourage interaction.',
        suggestion: 'Questions make content more conversational and engaging.'
      });
    }

    // Check for actionable language
    const actionWords = ['learn', 'discover', 'find', 'explore', 'try', 'start'];
    const hasActionWords = actionWords.some(word => 
      content.toLowerCase().includes(word)
    );
    if (!hasActionWords) {
      suggestions.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Use action-oriented language to motivate readers.',
        examples: actionWords
      });
    }

    return suggestions;
  }

  analyzeSEOIssues(content) {
    const suggestions = [];

    // Check for headings
    const headings = (content.match(/^#{1,6}\s+.+$/gm) || []).length;
    if (headings < 3) {
      suggestions.push({
        type: 'seo',
        priority: 'high',
        message: 'Add more headings (H2, H3) to improve SEO and readability.',
        suggestion: 'Aim for at least 3-5 headings in your content.'
      });
    }

    return suggestions;
  }

  analyzeReadabilityIssues(content) {
    const suggestions = [];

    // Check paragraph length
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    const longParagraphs = paragraphs.filter(p => this.countWords(p) > 100);
    if (longParagraphs.length > 0) {
      suggestions.push({
        type: 'readability',
        priority: 'medium',
        message: `${longParagraphs.length} paragraphs are too long. Keep paragraphs under 100 words.`,
        suggestion: 'Break up long paragraphs for better scannability.'
      });
    }

    return suggestions;
  }

  analyzeGrammarIssues(content) {
    // In production, integrate with grammar checking API
    return [];
  }

  scoreSuggestions(suggestions, aggressiveness) {
    const priorityScores = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    const aggressivenessMultiplier = {
      conservative: 0.7,
      moderate: 1.0,
      aggressive: 1.3
    };

    return suggestions
      .map(s => ({
        ...s,
        score: (priorityScores[s.priority] || 1) * aggressivenessMultiplier[aggressiveness]
      }))
      .sort((a, b) => b.score - a.score);
  }

  applyStructure(content, structure) {
    // Apply predefined structure to content
    // This is a simplified version
    return content;
  }

  async persistDraft(draft) {
    // Save to database (mock implementation)
    return true;
  }

  hashContent(content) {
    // Simple hash for content comparison
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  generateId() {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = DraftWritingEngine;
