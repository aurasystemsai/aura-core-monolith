/**
 * AI SUPPORT ASSISTANT - KNOWLEDGE BASE ENGINE
 * Manages knowledge articles, search, and retrieval-augmented generation (RAG)
 */

const crypto = require('crypto');

// In-memory storage
const articles = new Map();
const categories = new Map();
const articleViews = new Map();
const articleFeedback = new Map();

/**
 * Create knowledge article
 */
function createArticle({ title, content, category, tags = [], metadata = {} }) {
  const article = {
    id: `kb_${crypto.randomBytes(8).toString('hex')}`,
    title,
    content,
    category,
    tags,
    metadata,
    status: 'published', // draft, published, archived
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  articles.set(article.id, article);
  return article;
}

/**
 * Get article by ID
 */
function getArticle(articleId) {
  const article = articles.get(articleId);
  if (article) {
    article.views++;
    articleViews.set(articleId, (articleViews.get(articleId) || 0) + 1);
  }
  return article;
}

/**
 * Update article
 */
function updateArticle(articleId, updates) {
  const article = articles.get(articleId);
  if (!article) return null;

  Object.assign(article, updates);
  article.updatedAt = new Date().toISOString();
  return article;
}

/**
 * Delete article
 */
function deleteArticle(articleId) {
  articleViews.delete(articleId);
  articleFeedback.delete(articleId);
  return articles.delete(articleId);
}

/**
 * List articles
 */
function listArticles({ category, status, tags, limit = 50, offset = 0 } = {}) {
  let filtered = Array.from(articles.values());

  if (category) filtered = filtered.filter(a => a.category === category);
  if (status) filtered = filtered.filter(a => a.status === status);
  if (tags && tags.length > 0) {
    filtered = filtered.filter(a => tags.some(tag => a.tags.includes(tag)));
  }

  filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return {
    articles: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

/**
 * Search articles with semantic search
 */
function searchArticles(query, { limit = 10 } = {}) {
  const lowerQuery = query.toLowerCase();
  const queryTerms = lowerQuery.split(' ').filter(term => term.length > 2);

  const scored = Array.from(articles.values())
    .filter(article => article.status === 'published')
    .map(article => {
      let score = 0;
      const lowerTitle = article.title.toLowerCase();
      const lowerContent = article.content.toLowerCase();
      const lowerTags = article.tags.join(' ').toLowerCase();

      // Exact match in title
      if (lowerTitle.includes(lowerQuery)) score += 50;
      
      // Exact match in content
      if (lowerContent.includes(lowerQuery)) score += 30;

      // Term matching
      queryTerms.forEach(term => {
        if (lowerTitle.includes(term)) score += 10;
        if (lowerContent.includes(term)) score += 5;
        if (lowerTags.includes(term)) score += 15;
      });

      // Boost by popularity
      score += Math.log(article.views + 1) * 2;
      score += (article.helpful - article.notHelpful) * 0.5;

      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ article, score }) => ({
    ...article,
    relevanceScore: score,
  }));
}

/**
 * Get similar articles
 */
function getSimilarArticles(articleId, { limit = 5 } = {}) {
  const article = articles.get(articleId);
  if (!article) return [];

  const scored = Array.from(articles.values())
    .filter(a => a.id !== articleId && a.status === 'published')
    .map(a => {
      let score = 0;

      // Same category
      if (a.category === article.category) score += 20;

      // Shared tags
      const sharedTags = a.tags.filter(tag => article.tags.includes(tag));
      score += sharedTags.length * 10;

      return { article: a, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ article }) => article);
}

/**
 * Get article by query (RAG-style retrieval)
 */
function retrieveContext(query, { limit = 3 } = {}) {
  const results = searchArticles(query, { limit });
  
  return results.map(article => ({
    id: article.id,
    title: article.title,
    content: article.content.substring(0, 500), // Truncate for context
    relevanceScore: article.relevanceScore,
  }));
}

/**
 * Get augmented prompt with context
 */
function getAugmentedPrompt(userQuery, { contextLimit = 3 } = {}) {
  const context = retrieveContext(userQuery, { limit: contextLimit });
  
  let prompt = 'Relevant knowledge base articles:\n\n';
  
  context.forEach((ctx, index) => {
    prompt += `Article ${index + 1}: ${ctx.title}\n${ctx.content}\n\n`;
  });

  prompt += `User Question: ${userQuery}\n\nProvide a helpful answer based on the knowledge base articles above.`;

  return {
    prompt,
    context,
  };
}

/**
 * Category management
 */
function createCategory({ name, description, parentId = null }) {
  const category = {
    id: `cat_${crypto.randomBytes(4).toString('hex')}`,
    name,
    description,
    parentId,
    articleCount: 0,
    createdAt: new Date().toISOString(),
  };

  categories.set(category.id, category);
  return category;
}

function getCategory(categoryId) {
  return categories.get(categoryId);
}

function listCategories() {
  const categoriesArray = Array.from(categories.values());
  
  // Update article counts
  categoriesArray.forEach(cat => {
    cat.articleCount = Array.from(articles.values())
      .filter(a => a.category === cat.id)
      .length;
  });

  return categoriesArray;
}

function deleteCategory(categoryId) {
  return categories.delete(categoryId);
}

/**
 * Article feedback
 */
function submitFeedback(articleId, { helpful, comment }) {
  const article = articles.get(articleId);
  if (!article) return null;

  if (helpful) {
    article.helpful++;
  } else {
    article.notHelpful++;
  }

  const feedback = {
    id: `fb_${crypto.randomBytes(4).toString('hex')}`,
    articleId,
    helpful,
    comment,
    createdAt: new Date().toISOString(),
  };

  const feedbackList = articleFeedback.get(articleId) || [];
  feedbackList.push(feedback);
  articleFeedback.set(articleId, feedbackList);

  return feedback;
}

function getArticleFeedback(articleId) {
  return articleFeedback.get(articleId) || [];
}

/**
 * Get popular articles
 */
function getPopularArticles({ limit = 10, timeframe = 'all' } = {}) {
  return Array.from(articles.values())
    .filter(a => a.status === 'published')
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/**
 * Get most helpful articles
 */
function getMostHelpfulArticles({ limit = 10 } = {}) {
  return Array.from(articles.values())
    .filter(a => a.status === 'published')
    .sort((a, b) => {
      const scoreA = a.helpful - a.notHelpful;
      const scoreB = b.helpful - b.notHelpful;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/**
 * Get trending articles
 */
function getTrendingArticles({ limit = 10 } = {}) {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  return Array.from(articles.values())
    .filter(a => a.status === 'published')
    .map(article => {
      const age = (now - new Date(article.publishedAt).getTime()) / dayInMs;
      const decayFactor = Math.exp(-age / 7); // 7-day half-life
      const trendScore = article.views * decayFactor;
      
      return { article, trendScore };
    })
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit)
    .map(({ article }) => article);
}

/**
 * Get knowledge base statistics
 */
function getKnowledgeBaseStats() {
  const allArticles = Array.from(articles.values());
  
  return {
    totalArticles: allArticles.length,
    publishedArticles: allArticles.filter(a => a.status === 'published').length,
    draftArticles: allArticles.filter(a => a.status === 'draft').length,
    totalViews: allArticles.reduce((sum, a) => sum + a.views, 0),
    totalFeedback: allArticles.reduce((sum, a) => sum + a.helpful + a.notHelpful, 0),
    totalCategories: categories.size,
    avgViewsPerArticle: allArticles.length > 0 
      ? (allArticles.reduce((sum, a) => sum + a.views, 0) / allArticles.length).toFixed(2)
      : 0,
  };
}

/**
 * Export knowledge base
 */
function exportKnowledgeBase() {
  return {
    articles: Array.from(articles.values()),
    categories: Array.from(categories.values()),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import knowledge base
 */
function importKnowledgeBase({ articles: importArticles, categories: importCategories }) {
  importCategories?.forEach(cat => categories.set(cat.id, cat));
  importArticles?.forEach(art => articles.set(art.id, art));

  return {
    articlesImported: importArticles?.length || 0,
    categoriesImported: importCategories?.length || 0,
  };
}

module.exports = {
  createArticle,
  getArticle,
  updateArticle,
  deleteArticle,
  listArticles,
  searchArticles,
  getSimilarArticles,
  retrieveContext,
  getAugmentedPrompt,
  createCategory,
  getCategory,
  listCategories,
  deleteCategory,
  submitFeedback,
  getArticleFeedback,
  getPopularArticles,
  getMostHelpfulArticles,
  getTrendingArticles,
  getKnowledgeBaseStats,
  exportKnowledgeBase,
  importKnowledgeBase,
};
