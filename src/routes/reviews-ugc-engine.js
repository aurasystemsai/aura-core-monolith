/**
 * Reviews & UGC Engine API Router
 * Comprehensive RESTful API for review management, UGC collection, moderation, and analytics
 */

const express = require('express');
const router = express.Router();

// Import all engines
const reviewEngine = require('../tools/reviews-ugc-engine/review-management-engine');
const ugcEngine = require('../tools/reviews-ugc-engine/ugc-collection-engine');
const moderationEngine = require('../tools/reviews-ugc-engine/moderation-engine');
const sentimentEngine = require('../tools/reviews-ugc-engine/sentiment-ai-engine');
const socialProofEngine = require('../tools/reviews-ugc-engine/social-proof-engine');
const displayEngine = require('../tools/reviews-ugc-engine/display-widget-engine');
const analyticsEngine = require('../tools/reviews-ugc-engine/analytics-insights-engine');
const integrationEngine = require('../tools/reviews-ugc-engine/integration-engine');

// ========== Review Management Endpoints (32) ==========

// Create review
router.post('/reviews', (req, res) => {
  try {
    const review = reviewEngine.createReview(req.body);
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get review
router.get('/reviews/:id', (req, res) => {
  try {
    const review = reviewEngine.getReview(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update review
router.put('/reviews/:id', (req, res) => {
  try {
    const review = reviewEngine.updateReview(req.params.id, req.body);
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete review
router.delete('/reviews/:id', (req, res) => {
  try {
    const result = reviewEngine.deleteReview(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get product reviews
router.get('/products/:productId/reviews', (req, res) => {
  try {
    const { status, sortBy, limit, offset, rating, verified } = req.query;
    const reviews = reviewEngine.getProductReviews(req.params.productId, {
      status,
      sortBy,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
      rating: rating ? parseInt(rating) : null,
      verified: verified === 'true' ? true : verified === 'false' ? false : null,
    });
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get customer reviews
router.get('/customers/:customerId/reviews', (req, res) => {
  try {
    const { limit, offset } = req.query;
    const reviews = reviewEngine.getCustomerReviews(req.params.customerId, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Moderate review
router.post('/reviews/:id/moderate', (req, res) => {
  try {
    const review = reviewEngine.moderateReview(req.params.id, req.body);
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Flag review
router.post('/reviews/:id/flag', (req, res) => {
  try {
    const result = reviewEngine.flagReview(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add review response
router.post('/reviews/:id/responses', (req, res) => {
  try {
    const response = reviewEngine.addReviewResponse(req.params.id, req.body);
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get review responses
router.get('/reviews/:id/responses', (req, res) => {
  try {
    const responses = reviewEngine.getReviewResponses(req.params.id);
    res.json(responses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Vote on review
router.post('/reviews/:id/vote', (req, res) => {
  try {
    const result = reviewEngine.voteReview(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get product rating summary
router.get('/products/:productId/rating-summary', (req, res) => {
  try {
    const summary = reviewEngine.getProductRatingSummary(req.params.productId);
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search reviews
router.post('/reviews/search', (req, res) => {
  try {
    const { query, productId, status, rating, verified, limit, offset } = req.body;
    const results = reviewEngine.searchReviews(query, {
      productId,
      status,
      rating,
      verified,
      limit: limit || 20,
      offset: offset || 0,
    });
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get review statistics
router.get('/reviews/statistics', (req, res) => {
  try {
    const { productId, startDate, endDate } = req.query;
    const stats = reviewEngine.getReviewStatistics({
      productId,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
    });
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== UGC Collection Endpoints (30) ==========

// Create campaign
router.post('/campaigns', (req, res) => {
  try {
    const campaign = ugcEngine.createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get campaign
router.get('/campaigns/:id', (req, res) => {
  try {
    const campaign = ugcEngine.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update campaign
router.put('/campaigns/:id', (req, res) => {
  try {
    const campaign = ugcEngine.updateCampaign(req.params.id, req.body);
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete campaign
router.delete('/campaigns/:id', (req, res) => {
  try {
    const result = ugcEngine.deleteCampaign(req.params.id);
    res.json(result || { success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List campaigns
router.get('/campaigns', (req, res) => {
  try {
    const { status, type, limit, offset } = req.query;
    const campaigns = ugcEngine.listCampaigns({
      status,
      type,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });
    res.json(campaigns);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send review request
router.post('/campaigns/send-request', (req, res) => {
  try {
    const submission = ugcEngine.sendReviewRequest(req.body);
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track review request interaction
router.post('/campaigns/track/:submissionId', (req, res) => {
  try {
    const { interactionType } = req.body;
    const submission = ugcEngine.trackInteraction(req.params.submissionId, interactionType);
    res.json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send reminder
router.post('/campaigns/send-reminder/:submissionId', (req, res) => {
  try {
    const result = ugcEngine.sendReminder(req.params.submissionId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create widget
router.post('/collection-widgets', (req, res) => {
  try {
    const widget = ugcEngine.createWidget(req.body);
    res.status(201).json(widget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get widget
router.get('/collection-widgets/:id', (req, res) => {
  try {
    const widget = ugcEngine.getWidget(req.params.id);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    res.json(widget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update widget
router.put('/collection-widgets/:id', (req, res) => {
  try {
    const widget = ugcEngine.updateWidget(req.params.id, req.body);
    res.json(widget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List widgets
router.get('/collection-widgets', (req, res) => {
  try {
    const { status, type } = req.query;
    const widgets = ugcEngine.listWidgets({ status, type });
    res.json(widgets);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track widget analytics
router.post('/collection-widgets/:id/track', (req, res) => {
  try {
    const { eventType } = req.body;
    const analytics = ugcEngine.trackWidgetAnalytics(req.params.id, eventType);
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create email template
router.post('/email-templates', (req, res) => {
  try {
    const template = ugcEngine.createEmailTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get email template
router.get('/email-templates/:id', (req, res) => {
  try {
    const template = ugcEngine.getEmailTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List email templates
router.get('/email-templates', (req, res) => {
  try {
    const templates = ugcEngine.listEmailTemplates();
    res.json(templates);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete email template
router.delete('/email-templates/:id', (req, res) => {
  try {
    const result = ugcEngine.deleteEmailTemplate(req.params.id);
    res.json(result || { success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get collection statistics
router.get('/collection/statistics', (req, res) => {
  try {
    const stats = ugcEngine.getCollectionStatistics();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Moderation Endpoints (28) ==========

// Create moderation rule
router.post('/moderation/rules', (req, res) => {
  try {
    const rule = moderationEngine.createModerationRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get moderation rule
router.get('/moderation/rules/:id', (req, res) => {
  try {
    const rule = moderationEngine.getModerationRule(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update moderation rule
router.put('/moderation/rules/:id', (req, res) => {
  try {
    const rule = moderationEngine.updateModerationRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List moderation rules
router.get('/moderation/rules', (req, res) => {
  try {
    const { enabled } = req.query;
    const rules = moderationEngine.listModerationRules({
      enabled: enabled === 'true' ? true : enabled === 'false' ? false : null,
    });
    res.json(rules);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete moderation rule
router.delete('/moderation/rules/:id', (req, res) => {
  try {
    const result = moderationEngine.deleteModerationRule(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Moderate content
router.post('/moderation/moderate', (req, res) => {
  try {
    const results = moderationEngine.moderateContent(req.body);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get moderation queue
router.get('/moderation/queue', (req, res) => {
  try {
    const { status, priority, limit, offset } = req.query;
    const queue = moderationEngine.getModerationQueue({
      status: status || 'pending',
      priority,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });
    res.json(queue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Review queue item
router.post('/moderation/queue/:id/review', (req, res) => {
  try {
    const item = moderationEngine.reviewQueueItem(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add blocked word
router.post('/moderation/blocked-words', (req, res) => {
  try {
    const { word } = req.body;
    const result = moderationEngine.addBlockedWord(word);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove blocked word
router.delete('/moderation/blocked-words/:word', (req, res) => {
  try {
    const result = moderationEngine.removeBlockedWord(req.params.word);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List blocked words
router.get('/moderation/blocked-words', (req, res) => {
  try {
    const words = moderationEngine.listBlockedWords();
    res.json(words);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Block email
router.post('/moderation/blocked-emails', (req, res) => {
  try {
    const { email } = req.body;
    const result = moderationEngine.blockEmail(email);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unblock email
router.delete('/moderation/blocked-emails/:email', (req, res) => {
  try {
    const result = moderationEngine.unblockEmail(req.params.email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get moderation statistics
router.get('/moderation/statistics', (req, res) => {
  try {
    const stats = moderationEngine.getModerationStatistics();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Sentiment & AI Analysis Endpoints (30) ==========

// Analyze sentiment
router.post('/sentiment/analyze', (req, res) => {
  try {
    const analysis = sentimentEngine.analyzeSentiment(req.body);
    res.status(201).json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Batch analyze sentiment
router.post('/sentiment/batch-analyze', (req, res) => {
  try {
    const { reviews } = req.body;
    const analyses = sentimentEngine.batchAnalyzeSentiment(reviews);
    res.json(analyses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get sentiment analysis
router.get('/sentiment/analyses/:id', (req, res) => {
  try {
    const analysis = sentimentEngine.getSentimentAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get review sentiment
router.get('/reviews/:reviewId/sentiment', (req, res) => {
  try {
    const sentiment = sentimentEngine.getReviewSentiment(req.params.reviewId);
    if (!sentiment) {
      return res.status(404).json({ error: 'Sentiment analysis not found' });
    }
    res.json(sentiment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate insights
router.post('/sentiment/insights', (req, res) => {
  try {
    const { productId, reviews } = req.body;
    const insights = sentimentEngine.generateInsights(productId, reviews);
    res.json(insights);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Detect trends
router.post('/sentiment/trends', (req, res) => {
  try {
    const { productId, reviews, timeframe } = req.body;
    const trends = sentimentEngine.detectTrends(productId, reviews, timeframe);
    res.json(trends);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate review summary
router.post('/sentiment/summary', (req, res) => {
  try {
    const { reviews } = req.body;
    const summary = sentimentEngine.generateReviewSummary(reviews);
    res.json(summary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get sentiment statistics
router.get('/sentiment/statistics', (req, res) => {
  try {
    const stats = sentimentEngine.getSentimentStatistics();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Social Proof Optimization Endpoints (32) ==========

// Create display rule
router.post('/social-proof/display-rules', (req, res) => {
  try {
    const rule = socialProofEngine.createDisplayRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get display rule
router.get('/social-proof/display-rules/:id', (req, res) => {
  try {
    const rule = socialProofEngine.getDisplayRule(req.params.id);
    if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List display rules
router.get('/social-proof/display-rules', (req, res) => {
  try {
    const rules = socialProofEngine.listDisplayRules();
    res.json(rules);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update display rule
router.put('/social-proof/display-rules/:id', (req, res) => {
  try {
    const rule = socialProofEngine.updateDisplayRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Evaluate display rules
router.post('/social-proof/evaluate-rules', (req, res) => {
  try {
    const rule = socialProofEngine.evaluateDisplayRules(req.body);
    res.json(rule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Optimize review display
router.post('/social-proof/optimize-display', (req, res) => {
  try {
    const { productId, reviews, performanceData } = req.body;
    const optimization = socialProofEngine.optimizeReviewDisplay(productId, reviews, performanceData);
    res.json(optimization);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create trust badge
router.post('/social-proof/trust-badges', (req, res) => {
  try {
    const badge = socialProofEngine.createTrustBadge(req.body);
    res.status(201).json(badge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get applicable badges
router.post('/social-proof/applicable-badges', (req, res) => {
  try {
    const badges = socialProofEngine.getApplicableBadges(req.body);
    res.json(badges);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List trust badges
router.get('/social-proof/trust-badges', (req, res) => {
  try {
    const badges = socialProofEngine.listTrustBadges();
    res.json(badges);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete trust badge
router.delete('/social-proof/trust-badges/:id', (req, res) => {
  try {
    const result = socialProofEngine.deleteTrustBadge(req.params.id);
    res.json(result || { success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create social proof element
router.post('/social-proof/elements', (req, res) => {
  try {
    const element = socialProofEngine.createSocialProofElement(req.body);
    res.status(201).json(element);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get social proof elements
router.post('/social-proof/elements/get', (req, res) => {
  try {
    const elements = socialProofEngine.getSocialProofElements(req.body);
    res.json(elements);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track social proof interaction
router.post('/social-proof/elements/:id/track', (req, res) => {
  try {
    const { interactionType } = req.body;
    const analytics = socialProofEngine.trackSocialProofInteraction(req.params.id, interactionType);
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create A/B test
router.post('/social-proof/ab-tests', (req, res) => {
  try {
    const test = socialProofEngine.createABTest(req.body);
    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track A/B test variant
router.post('/social-proof/ab-tests/:testId/track', (req, res) => {
  try {
    const { variantId, metrics } = req.body;
    const variant = socialProofEngine.trackABTestVariant(req.params.testId, variantId, metrics);
    res.json(variant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get A/B test results
router.get('/social-proof/ab-tests/:testId/results', (req, res) => {
  try {
    const results = socialProofEngine.getABTestResults(req.params.testId);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List A/B tests
router.get('/social-proof/ab-tests', (req, res) => {
  try {
    const tests = socialProofEngine.listABTests ? socialProofEngine.listABTests() : [];
    res.json(tests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate conversion insights
router.post('/social-proof/conversion-insights', (req, res) => {
  try {
    const { productId, reviewData, performanceData } = req.body;
    const insights = socialProofEngine.generateConversionInsights(productId, reviewData, performanceData);
    res.json(insights);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get optimization statistics
router.get('/social-proof/statistics', (req, res) => {
  try {
    const stats = socialProofEngine.getOptimizationStatistics();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Display & Widget Endpoints (30) ==========

// Create review widget
router.post('/widgets', (req, res) => {
  try {
    const widget = displayEngine.createReviewWidget(req.body);
    res.status(201).json(widget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get widget
router.get('/widgets/:id', (req, res) => {
  try {
    const widget = displayEngine.getReviewWidget(req.params.id);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    res.json(widget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update widget
router.put('/widgets/:id', (req, res) => {
  try {
    const widget = displayEngine.updateReviewWidget(req.params.id, req.body);
    res.json(widget);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete widget
router.delete('/widgets/:id', (req, res) => {
  try {
    const result = displayEngine.deleteReviewWidget ? displayEngine.deleteReviewWidget(req.params.id) : { success: true };
    res.json(result || { success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List widgets
router.get('/widgets', (req, res) => {
  try {
    const { status, productId } = req.query;
    const widgets = displayEngine.listReviewWidgets({ status, productId });
    res.json(widgets);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate widget embed code
router.get('/widgets/:id/embed-code', (req, res) => {
  try {
    const embedCode = displayEngine.generateWidgetEmbedCode(req.params.id);
    res.json(embedCode);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track widget analytics
router.post('/widgets/:id/analytics', (req, res) => {
  try {
    const { eventType, eventData } = req.body;
    const analytics = displayEngine.trackWidgetAnalytics(req.params.id, eventType, eventData);
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create carousel
router.post('/carousels', (req, res) => {
  try {
    const carousel = displayEngine.createReviewCarousel(req.body);
    res.status(201).json(carousel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get carousel
router.get('/carousels/:id', (req, res) => {
  try {
    const carousel = displayEngine.getReviewCarousel(req.params.id);
    if (!carousel) {
      return res.status(404).json({ error: 'Carousel not found' });
    }
    res.json(carousel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List carousels
router.get('/carousels', (req, res) => {
  try {
    const carousels = displayEngine.listReviewCarousels();
    res.json(carousels);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track carousel analytics
router.post('/carousels/:id/analytics', (req, res) => {
  try {
    const { eventType } = req.body;
    const analytics = displayEngine.trackCarouselAnalytics(req.params.id, eventType);
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create embed
router.post('/embeds', (req, res) => {
  try {
    const embed = displayEngine.createReviewEmbed(req.body);
    res.status(201).json(embed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List embeds
router.get('/embeds', (req, res) => {
  try {
    const embeds = displayEngine.listReviewEmbeds ? displayEngine.listReviewEmbeds() : [];
    res.json(embeds);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate embed code
router.get('/embeds/:id/code', (req, res) => {
  try {
    const embedCode = displayEngine.generateEmbedCode(req.params.id);
    res.json(embedCode);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create theme
router.post('/themes', (req, res) => {
  try {
    const theme = displayEngine.createTheme(req.body);
    res.status(201).json(theme);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get theme
router.get('/themes/:id', (req, res) => {
  try {
    const theme = displayEngine.getTheme(req.params.id);
    res.json(theme);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List themes
router.get('/themes', (req, res) => {
  try {
    const themes = displayEngine.listThemes();
    res.json(themes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate widget preview
router.post('/widgets/:id/preview', (req, res) => {
  try {
    const { sampleReviews } = req.body;
    const preview = displayEngine.generateWidgetPreview(req.params.id, sampleReviews);
    res.json(preview);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get display statistics
router.get('/display/statistics', (req, res) => {
  try {
    const stats = displayEngine.getDisplayStatistics();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Analytics & Insights Endpoints (32) ==========

// Track event
router.post('/analytics/events', (req, res) => {
  try {
    const event = analyticsEngine.trackEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get review metrics
router.get('/analytics/reviews', (req, res) => {
  try {
    const { productId, startDate, endDate } = req.query;
    const metrics = analyticsEngine.getReviewMetrics({
      productId,
      startDate,
      endDate,
    });
    res.json(metrics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get collection performance
router.get('/analytics/collection', (req, res) => {
  try {
    const { campaignId, startDate, endDate } = req.query;
    const performance = analyticsEngine.getCollectionPerformance({
      campaignId,
      startDate,
      endDate,
    });
    res.json(performance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get widget performance
router.get('/analytics/widgets/:widgetId?', (req, res) => {
  try {
    const performance = analyticsEngine.getWidgetPerformance(req.params.widgetId);
    res.json(performance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get sentiment trends
router.get('/analytics/sentiment-trends/:productId', (req, res) => {
  try {
    const { timeframe } = req.query;
    const trends = analyticsEngine.getSentimentTrends(
      req.params.productId,
      parseInt(timeframe) || 30
    );
    res.json(trends);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get rating distribution
router.get('/analytics/rating-distribution', (req, res) => {
  try {
    const { productId } = req.query;
    const distribution = analyticsEngine.getRatingDistribution(productId);
    res.json(distribution);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get top reviewers
router.get('/analytics/top-reviewers', (req, res) => {
  try {
    const { limit } = req.query;
    const reviewers = analyticsEngine.getTopReviewers(parseInt(limit) || 10);
    res.json(reviewers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get product comparison
router.post('/analytics/product-comparison', (req, res) => {
  try {
    const { productIds } = req.body;
    const comparison = analyticsEngine.getProductComparison(productIds);
    res.json(comparison);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create report
router.post('/analytics/reports', (req, res) => {
  try {
    const report = analyticsEngine.createReport(req.body);
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Run report
router.post('/analytics/reports/:id/run', (req, res) => {
  try {
    const result = analyticsEngine.runReport(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List reports
router.get('/analytics/reports', (req, res) => {
  try {
    const reports = analyticsEngine.listReports();
    res.json(reports);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create dashboard
router.post('/analytics/dashboards', (req, res) => {
  try {
    const dashboard = analyticsEngine.createDashboard(req.body);
    res.status(201).json(dashboard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List dashboards
router.get('/analytics/dashboards', (req, res) => {
  try {
    const dashboards = analyticsEngine.listDashboards ? analyticsEngine.listDashboards() : [];
    res.json(dashboards);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get dashboard data
router.get('/analytics/dashboards/:id', (req, res) => {
  try {
    const data = analyticsEngine.getDashboardData(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create alert
router.post('/analytics/alerts', (req, res) => {
  try {
    const alert = analyticsEngine.createAlert(req.body);
    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List alerts
router.get('/analytics/alerts', (req, res) => {
  try {
    const alerts = analyticsEngine.listAlerts ? analyticsEngine.listAlerts() : [];
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete alert
router.delete('/analytics/alerts/:id', (req, res) => {
  try {
    const result = analyticsEngine.deleteAlert ? analyticsEngine.deleteAlert(req.params.id) : { success: true };
    res.json(result || { success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check alerts
router.post('/analytics/alerts/check', (req, res) => {
  try {
    const { metrics } = req.body;
    const alerts = analyticsEngine.checkAlerts(metrics);
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get analytics statistics
router.get('/analytics/statistics', (req, res) => {
  try {
    const stats = analyticsEngine.getAnalyticsStatistics();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Integration Endpoints (34) ==========

// Get integration
router.get('/integrations/:id', (req, res) => {
  try {
    const integration = integrationEngine.getIntegration(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    res.json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List integrations
router.get('/integrations', (req, res) => {
  try {
    const { type, status } = req.query;
    const integrations = integrationEngine.listIntegrations({ type, status });
    res.json(integrations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Connect integration
router.post('/integrations/:id/connect', (req, res) => {
  try {
    const integration = integrationEngine.connectIntegration(req.params.id, req.body);
    res.json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disconnect integration
router.post('/integrations/:id/disconnect', (req, res) => {
  try {
    const integration = integrationEngine.disconnectIntegration(req.params.id);
    res.json(integration);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Test connection
router.post('/integrations/:id/test', (req, res) => {
  try {
    const result = integrationEngine.testConnection(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Import reviews
router.post('/integrations/import-reviews', (req, res) => {
  try {
    const job = integrationEngine.importReviews(req.body);
    res.status(202).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get import job
router.get('/integrations/import-jobs/:jobId', (req, res) => {
  try {
    const job = integrationEngine.getImportJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export reviews
router.post('/integrations/export-reviews', (req, res) => {
  try {
    const job = integrationEngine.exportReviews(req.body);
    res.status(202).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get export job
router.get('/integrations/export-jobs/:jobId', (req, res) => {
  try {
    const job = integrationEngine.getExportJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync Shopify products
router.post('/integrations/shopify/sync-products', (req, res) => {
  try {
    const result = integrationEngine.syncShopifyProducts(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync Shopify orders
router.post('/integrations/shopify/sync-orders', (req, res) => {
  try {
    const result = integrationEngine.syncShopifyOrders(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit to Google Shopping
router.post('/integrations/google-shopping/submit', (req, res) => {
  try {
    const result = integrationEngine.submitToGoogleShopping(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create webhook
router.post('/integrations/webhooks', (req, res) => {
  try {
    const webhook = integrationEngine.createWebhook(req.body);
    res.status(201).json(webhook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get webhook
router.get('/integrations/webhooks/:id', (req, res) => {
  try {
    const webhook = integrationEngine.getWebhook(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List webhooks
router.get('/integrations/webhooks', (req, res) => {
  try {
    const { status } = req.query;
    const webhooks = integrationEngine.listWebhooks({ status });
    res.json(webhooks);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update webhook
router.put('/integrations/webhooks/:id', (req, res) => {
  try {
    const webhook = integrationEngine.updateWebhook(req.params.id, req.body);
    res.json(webhook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete webhook
router.delete('/integrations/webhooks/:id', (req, res) => {
  try {
    const result = integrationEngine.deleteWebhook(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Trigger webhook
router.post('/integrations/webhooks/:id/trigger', (req, res) => {
  try {
    const result = integrationEngine.triggerWebhook(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get sync logs
router.get('/integrations/sync-logs', (req, res) => {
  try {
    const { integrationId, type, status, limit, offset } = req.query;
    const logs = integrationEngine.getSyncLogs({
      integrationId,
      type,
      status,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Import from CSV
router.post('/integrations/import-csv', (req, res) => {
  try {
    const job = integrationEngine.importFromCSV(req.body);
    res.status(202).json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export to CSV
router.post('/integrations/export-csv', (req, res) => {
  try {
    const result = integrationEngine.exportToCSV(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get integration statistics
router.get('/integrations/statistics', (req, res) => {
  try {
    const stats = integrationEngine.getIntegrationStatistics();
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== System Endpoints (2) ==========

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      reviewManagement: 'operational',
      ugcCollection: 'operational',
      moderation: 'operational',
      sentiment: 'operational',
      socialProof: 'operational',
      display: 'operational',
      analytics: 'operational',
      integrations: 'operational',
    },
  });
});

// System statistics
router.get('/statistics', (req, res) => {
  try {
    const stats = {
      reviews: reviewEngine.getReviewStatistics(),
      collection: ugcEngine.getCollectionStatistics(),
      moderation: moderationEngine.getModerationStatistics(),
      sentiment: sentimentEngine.getSentimentStatistics(),
      socialProof: socialProofEngine.getOptimizationStatistics(),
      display: displayEngine.getDisplayStatistics(),
      analytics: analyticsEngine.getAnalyticsStatistics(),
      integrations: integrationEngine.getIntegrationStatistics(),
    };
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
