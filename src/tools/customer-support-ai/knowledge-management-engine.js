/**
 * Knowledge Management Engine
 * Handles article creation, search, recommendations, content analytics
 */

// In-memory storage (replace with database in production)
const articles = new Map();
const categories = new Map();
const articleVersions = new Map();
const articleViews = new Map();
const articleFeedback = new Map();
const searchHistory = new Map();

/**
 * Create knowledge base category
 */
async function createCategory(categoryData) {
  const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const category = {
    id: categoryId,
    name: categoryData.name,
    description: categoryData.description || '',
    parentId: categoryData.parentId || null,
    icon: categoryData.icon || '📁',
    order: categoryData.order || 0,
    articleCount: 0,
    createdAt: new Date().toISOString()
  };
  
  categories.set(categoryId, category);
  return category;
}

/**
 * Create article
 */
async function createArticle(articleData) {
  const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const article = {
    id: articleId,
    title: articleData.title,
    content: articleData.content,
    summary: articleData.summary || '',
    categoryId: articleData.categoryId,
    tags: articleData.tags || [],
    status: articleData.status || 'draft', // draft, published, archived
    authorId: articleData.authorId,
    visibility: articleData.visibility || 'public', // public, internal, private
    featured: articleData.featured || false,
    version: 1,
    views: 0,
    helpful: 0,
    notHelpful: 0,
    helpfulnessScore: 0,
    relatedArticles: articleData.relatedArticles || [],
    attachments: articleData.attachments || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null
  };
  
  articles.set(articleId, article);
  
  // Create version
  await createArticleVersion(articleId, article);
  
  // Update category count
  if (article.categoryId) {
    const category = categories.get(article.categoryId);
    if (category) {
      category.articleCount++;
      categories.set(article.categoryId, category);
    }
  }
  
  return article;
}

/**
 * Create article version
 */
async function createArticleVersion(articleId, articleData) {
  const versionId = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const version = {
    id: versionId,
    articleId,
    version: articleData.version,
    title: articleData.title,
    content: articleData.content,
    summary: articleData.summary,
    changedBy: articleData.authorId,
    changes: articleData.changes || '',
    createdAt: new Date().toISOString()
  };
  
  articleVersions.set(versionId, version);
  return version;
}

/**
 * Update article
 */
async function updateArticle(articleId, updates) {
  const article = articles.get(articleId);
  if (!article) throw new Error('Article not found');
  
  const newVersion = article.version + 1;
  
  Object.assign(article, updates, {
    version: newVersion,
    updatedAt: new Date().toISOString()
  });
  
  articles.set(articleId, article);
  
  // Create new version
  await createArticleVersion(articleId, article);
  
  return article;
}

/**
 * Publish article
 */
async function publishArticle(articleId) {
  const article = articles.get(articleId);
  if (!article) throw new Error('Article not found');
  
  article.status = 'published';
  article.publishedAt = new Date().toISOString();
  article.updatedAt = new Date().toISOString();
  
  articles.set(articleId, article);
  return article;
}

/**
 * Search articles
 */
async function searchArticles(query, filters = {}) {
  const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let articleList = Array.from(articles.values())
    .filter(a => a.status === 'published' || filters.includeUnpublished);
  
  // Apply filters
  if (filters.categoryId) {
    articleList = articleList.filter(a => a.categoryId === filters.categoryId);
  }
  if (filters.tags && filters.tags.length > 0) {
    articleList = articleList.filter(a => 
      filters.tags.some(tag => a.tags.includes(tag))
    );
  }
  if (filters.visibility) {
    articleList = articleList.filter(a => a.visibility === filters.visibility);
  }
  
  // Search by query
  if (query) {
    const lowerQuery = query.toLowerCase();
    articleList = articleList.filter(a => {
      return a.title.toLowerCase().includes(lowerQuery) ||
             a.content.toLowerCase().includes(lowerQuery) ||
             a.summary.toLowerCase().includes(lowerQuery) ||
             a.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    });
    
    // Calculate relevance score
    articleList = articleList.map(article => {
      let score = 0;
      
      if (article.title.toLowerCase().includes(lowerQuery)) score += 10;
      if (article.summary.toLowerCase().includes(lowerQuery)) score += 5;
      if (article.content.toLowerCase().includes(lowerQuery)) score += 2;
      article.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) score += 3;
      });
      
      // Boost by helpfulness score
      score += article.helpfulnessScore * 0.1;
      
      // Boost featured articles
      if (article.featured) score += 5;
      
      return { ...article, relevanceScore: score };
    });
    
    // Sort by relevance
    articleList.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } else {
    // Sort by views if no query
    articleList.sort((a, b) => b.views - a.views);
  }
  
  // Track search
  const search = {
    id: searchId,
    query,
    filters,
    resultCount: articleList.length,
    timestamp: new Date().toISOString()
  };
  
  searchHistory.set(searchId, search);
  
  return {
    query,
    results: articleList.slice(0, filters.limit || 10),
    totalResults: articleList.length
  };
}

/**
 * Track article view
 */
async function trackArticleView(articleId, viewData = {}) {
  const article = articles.get(articleId);
  if (!article) throw new Error('Article not found');
  
  const viewId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const view = {
    id: viewId,
    articleId,
    userId: viewData.userId,
    source: viewData.source || 'search', // search, related, direct
    referrer: viewData.referrer,
    viewedAt: new Date().toISOString()
  };
  
  articleViews.set(viewId, view);
  
  // Update article view count
  article.views++;
  articles.set(articleId, article);
  
  return view;
}

/**
 * Submit article feedback
 */
async function submitArticleFeedback(feedbackData) {
  const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const feedback = {
    id: feedbackId,
    articleId: feedbackData.articleId,
    userId: feedbackData.userId,
    helpful: feedbackData.helpful, // true or false
    comment: feedbackData.comment || '',
    submittedAt: new Date().toISOString()
  };
  
  articleFeedback.set(feedbackId, feedback);
  
  // Update article helpfulness
  const article = articles.get(feedbackData.articleId);
  if (article) {
    if (feedback.helpful) {
      article.helpful++;
    } else {
      article.notHelpful++;
    }
    
    // Calculate helpfulness score (0-100)
    const total = article.helpful + article.notHelpful;
    article.helpfulnessScore = total > 0 ? 
      (article.helpful / total) * 100 : 0;
    
    articles.set(feedbackData.articleId, article);
  }
  
  return feedback;
}

/**
 * Get recommended articles
 */
async function getRecommendedArticles(context = {}) {
  let articleList = Array.from(articles.values())
    .filter(a => a.status === 'published');
  
  // If tags provided, filter by similar tags
  if (context.tags && context.tags.length > 0) {
    articleList = articleList.map(article => {
      const matchingTags = article.tags.filter(tag => context.tags.includes(tag)).length;
      return { ...article, tagMatches: matchingTags };
    })
    .filter(a => a.tagMatches > 0)
    .sort((a, b) => b.tagMatches - a.tagMatches);
  }
  
  // Sort by helpfulness and views
  articleList.sort((a, b) => {
    const scoreA = a.helpfulnessScore + (a.views * 0.01);
    const scoreB = b.helpfulnessScore + (b.views * 0.01);
    return scoreB - scoreA;
  });
  
  // Prioritize featured articles
  const featured = articleList.filter(a => a.featured);
  const regular = articleList.filter(a => !a.featured);
  
  return [...featured, ...regular].slice(0, 5);
}

/**
 * Get article analytics
 */
async function getArticleAnalytics(articleId) {
  const article = articles.get(articleId);
  if (!article) throw new Error('Article not found');
  
  const views = Array.from(articleViews.values())
    .filter(v => v.articleId === articleId);
  
  const feedback = Array.from(articleFeedback.values())
    .filter(f => f.articleId === articleId);
  
  // View sources
  const sources = {};
  views.forEach(v => {
    sources[v.source] = (sources[v.source] || 0) + 1;
  });
  
  // Views over time (last 30 days)
  const viewsByDay = {};
  views.forEach(v => {
    const day = v.viewedAt.split('T')[0];
    viewsByDay[day] = (viewsByDay[day] || 0) + 1;
  });
  
  return {
    articleId,
    title: article.title,
    totalViews: article.views,
    helpfulCount: article.helpful,
    notHelpfulCount: article.notHelpful,
    helpfulnessScore: Math.round(article.helpfulnessScore),
    feedbackCount: feedback.length,
    viewSources: sources,
    viewsByDay
  };
}

/**
 * Get popular search terms
 */
async function getPopularSearchTerms(limit = 10) {
  const searches = Array.from(searchHistory.values());
  
  const termCounts = {};
  searches.forEach(s => {
    if (s.query) {
      termCounts[s.query] = (termCounts[s.query] || 0) + 1;
    }
  });
  
  return Object.entries(termCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

/**
 * Get knowledge base statistics
 */
async function getKnowledgeBaseStatistics() {
  const articleList = Array.from(articles.values());
  
  return {
    totalArticles: articleList.length,
    publishedArticles: articleList.filter(a => a.status === 'published').length,
    draftArticles: articleList.filter(a => a.status === 'draft').length,
    archivedArticles: articleList.filter(a => a.status === 'archived').length,
    totalCategories: categories.size,
    totalViews: articleList.reduce((sum, a) => sum + a.views, 0),
    totalFeedback: articleFeedback.size,
    averageHelpfulness: articleList.length > 0 ?
      articleList.reduce((sum, a) => sum + a.helpfulnessScore, 0) / articleList.length : 0,
    totalSearches: searchHistory.size
  };
}

module.exports = {
  createCategory,
  createArticle,
  updateArticle,
  publishArticle,
  searchArticles,
  trackArticleView,
  submitArticleFeedback,
  getRecommendedArticles,
  getArticleAnalytics,
  getPopularSearchTerms,
  getKnowledgeBaseStatistics
};
