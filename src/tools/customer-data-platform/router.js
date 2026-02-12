const router = require('express').Router();
const profiles = require('./profiles');
const events = require('./events');
const segments = require('./segments');
const enrichment = require('./enrichment');
const privacy = require('./privacy');

/**
 * Customer Data Platform - Main Router
 * Complete API for customer profiles, events, segments, enrichment, and privacy
 */

// ============================================================================
// PROFILES
// ============================================================================

/**
 * Create a new customer profile
 */
router.post('/profiles', async (req, res) => {
  try {
    const profile = profiles.createProfile(req.body);
    res.status(201).json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get profile by ID
 */
router.get('/profiles/:id', (req, res) => {
  const profile = profiles.getProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

/**
 * Update profile
 */
router.put('/profiles/:id', async (req, res) => {
  try {
    const profileEvents = events.getProfileEvents(req.params.id);
    const profile = profiles.updateProfile(req.params.id, req.body, profileEvents);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Delete profile (GDPR)
 */
router.delete('/profiles/:id', (req, res) => {
  const deleted = profiles.deleteProfile(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json({ success: true, message: 'Profile deleted' });
});

/**
 * Search profiles
 */
router.post('/profiles/search', (req, res) => {
  const { filters, options } = req.body;
  const results = profiles.searchProfiles(filters, options);
  res.json(results);
});

/**
 * Merge two profiles
 */
router.post('/profiles/merge', async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;
    
    if (!primaryId || !secondaryId) {
      return res.status(400).json({ error: 'Both primaryId and secondaryId required' });
    }
    
    const merged = profiles.mergeProfiles(primaryId, secondaryId);
    res.json(merged);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get profile timeline
 */
router.get('/profiles/:id/timeline', (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0,
    eventType: req.query.eventType,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };
  
  const timeline = events.getProfileTimeline(req.params.id, options);
  res.json(timeline);
});

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Track a single event
 */
router.post('/events', async (req, res) => {
  try {
    const event = events.trackEvent(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Track events in batch
 */
router.post('/events/batch', async (req, res) => {
  try {
    const { events: eventData } = req.body;
    
    if (!Array.isArray(eventData)) {
      return res.status(400).json({ error: 'events must be an array' });
    }
    
    const results = events.trackEventsBatch(eventData);
    res.status(201).json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Query events
 */
router.post('/events/query', (req, res) => {
  const { filters, options } = req.body;
  const results = events.queryEvents(filters, options);
  res.json(results);
});

/**
 * Get event statistics
 */
router.get('/events/stats', (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };
  
  const stats = events.getEventStats(filters);
  res.json(stats);
});

/**
 * Calculate funnel
 */
router.post('/events/funnel', (req, res) => {
  try {
    const { steps, filters } = req.body;
    
    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'steps must be an array' });
    }
    
    const funnel = events.calculateFunnel(steps, filters);
    res.json(funnel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get session
 */
router.get('/sessions/:id', (req, res) => {
  const session = events.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

/**
 * Get profile sessions
 */
router.get('/profiles/:id/sessions', (req, res) => {
  const sessions = events.getProfileSessions(req.params.id);
  res.json({ sessions });
});

// ============================================================================
// SEGMENTS
// ============================================================================

/**
 * Create a new segment
 */
router.post('/segments', async (req, res) => {
  try {
    const segment = segments.createSegment(req.body);
    res.status(201).json(segment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get all segments
 */
router.get('/segments', (req, res) => {
  const allSegments = segments.getAllSegments();
  res.json({ segments: allSegments });
});

/**
 * Get segment by ID
 */
router.get('/segments/:id', (req, res) => {
  const segment = segments.getSegment(req.params.id);
  if (!segment) {
    return res.status(404).json({ error: 'Segment not found' });
  }
  res.json(segment);
});

/**
 * Update segment
 */
router.put('/segments/:id', async (req, res) => {
  try {
    const segment = segments.updateSegment(req.params.id, req.body);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.json(segment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Delete segment
 */
router.delete('/segments/:id', (req, res) => {
  const deleted = segments.deleteSegment(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Segment not found' });
  }
  res.json({ success: true, message: 'Segment deleted' });
});

/**
 * Get segment members
 */
router.get('/segments/:id/members', (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0,
  };
  
  const results = segments.getSegmentMembers(req.params.id, options);
  res.json(results);
});

/**
 * Get segment size
 */
router.get('/segments/:id/size', (req, res) => {
  const size = segments.getSegmentSize(req.params.id);
  res.json({ segmentId: req.params.id, size });
});

/**
 * Calculate segment overlap
 */
router.get('/segments/:id1/overlap/:id2', (req, res) => {
  try {
    const overlap = segments.calculateSegmentOverlap(req.params.id1, req.params.id2);
    res.json(overlap);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Recompute segment membership
 */
router.post('/segments/:id/recompute', async (req, res) => {
  try {
    segments.computeSegmentMembership(req.params.id);
    const segment = segments.getSegment(req.params.id);
    res.json(segment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Recompute all segments
 */
router.post('/segments/recompute-all', async (req, res) => {
  try {
    const result = segments.recomputeAllSegments();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Add profile to segment manually
 */
router.post('/segments/:id/members/:profileId', async (req, res) => {
  try {
    segments.addProfileToSegment(req.params.profileId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Remove profile from segment
 */
router.delete('/segments/:id/members/:profileId', async (req, res) => {
  try {
    segments.removeProfileFromSegment(req.params.profileId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// ENRICHMENT
// ============================================================================

/**
 * Get enrichment providers
 */
router.get('/enrichment/providers', (req, res) => {
  const providers = enrichment.getProviders();
  res.json({ providers });
});

/**
 * Enrich a single profile
 */
router.post('/enrichment/profiles/:id', async (req, res) => {
  try {
    const result = await enrichment.enrichProfile(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Enrich profiles in batch
 */
router.post('/enrichment/batch', async (req, res) => {
  try {
    const { profileIds, ...options } = req.body;
    
    if (!Array.isArray(profileIds)) {
      return res.status(400).json({ error: 'profileIds must be an array' });
    }
    
    const results = await enrichment.enrichProfilesBatch(profileIds, options);
    res.json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// PRIVACY & CONSENT
// ============================================================================

/**
 * Update consent
 */
router.post('/consent/:profileId', async (req, res) => {
  try {
    const result = privacy.updateConsent(req.params.profileId, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get consent status
 */
router.get('/consent/:profileId', (req, res) => {
  try {
    const consent = privacy.getConsent(req.params.profileId);
    res.json(consent);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * Export customer data (GDPR)
 */
router.post('/gdpr/export/:profileId', async (req, res) => {
  try {
    const result = privacy.exportCustomerData(req.params.profileId);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * Delete customer data (GDPR)
 */
router.post('/gdpr/delete/:profileId', async (req, res) => {
  try {
    const result = privacy.deleteCustomerData(req.params.profileId, req.body);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * Get GDPR request status
 */
router.get('/gdpr/requests/:requestId', (req, res) => {
  const request = privacy.getGDPRRequestStatus(req.params.requestId);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json(request);
});

/**
 * List GDPR requests
 */
router.get('/gdpr/requests', (req, res) => {
  const filters = {
    profileId: req.query.profileId,
    type: req.query.type,
    status: req.query.status,
  };
  
  const requests = privacy.listGDPRRequests(filters);
  res.json({ requests });
});

/**
 * Anonymize profile
 */
router.post('/gdpr/anonymize/:profileId', async (req, res) => {
  try {
    const result = privacy.anonymizeProfile(req.params.profileId);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * Get compliance report
 */
router.get('/privacy/compliance', (req, res) => {
  const report = privacy.getComplianceReport();
  res.json(report);
});

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get analytics overview
 */
router.get('/analytics/overview', (req, res) => {
  const allProfiles = profiles.getAllProfiles();
  const allSegments = segments.getAllSegments();
  
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };
  
  const eventStats = events.getEventStats(filters);
  const complianceReport = privacy.getComplianceReport();
  
  const overview = {
    profiles: {
      total: allProfiles.length,
      withEmail: allProfiles.filter(p => p.attributes.email).length,
      withPhone: allProfiles.filter(p => p.attributes.phone).length,
      customers: allProfiles.filter(p => (p.computed.purchaseCount || 0) > 0).length,
    },
    segments: {
      total: allSegments.length,
    },
    events: eventStats,
    compliance: complianceReport.consent,
    timestamp: new Date().toISOString(),
  };
  
  res.json(overview);
});

/**
 * Calculate RFM for a profile
 */
router.get('/analytics/rfm/:profileId', (req, res) => {
  const profile = profiles.getProfile(req.params.profileId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  const profileEvents = events.getProfileEvents(req.params.profileId);
  const rfm = segments.calculateRFM(profile, profileEvents);
  
  res.json({ profileId: req.params.profileId, rfm });
});

// ============================================================================
// HEALTH & STATUS
// ============================================================================

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'customer-data-platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
