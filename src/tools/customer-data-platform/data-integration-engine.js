/**
 * DATA INTEGRATION ENGINE
 * ETL pipelines, source connectors, data transformation,
 * sync scheduling, and destination mapping
 */

// In-memory stores
const sources = new Map();
const destinations = new Map();
const syncJobs = new Map();
const transformations = new Map();
const mappings = new Map();

let syncCounter = 0;

// ================================================================
// SOURCE CONNECTORS
// ================================================================

function createSource({ name, type, config, credentials }) {
  const id = `src_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const source = {
    id,
    name,
    type, // 'shopify', 'salesforce', 'stripe', 'zendesk', 'hubspot', 'database', 'api'
    config,
    credentials,
    status: 'inactive',
    lastSync: null,
    recordCount: 0,
    errorCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  sources.set(id, source);
  return source;
}

function getSource(id) {
  return sources.get(id) || null;
}

function listSources({ type, status, limit = 100 }) {
  let results = Array.from(sources.values());
  
  if (type) {
    results = results.filter(s => s.type === type);
  }
  
  if (status) {
    results = results.filter(s => s.status === status);
  }
  
  return results.slice(0, limit);
}

function updateSource(id, updates) {
  const source = sources.get(id);
  if (!source) return null;
  
  Object.assign(source, updates);
  source.updatedAt = new Date().toISOString();
  sources.set(id, source);
  
  return source;
}

function deleteSource(id) {
  // Cancel any active syncs
  const activeSyncs = Array.from(syncJobs.values())
    .filter(job => job.sourceId === id && job.status === 'running');
  
  activeSyncs.forEach(job => {
    cancelSync(job.id);
  });
  
  return sources.delete(id);
}

function testSourceConnection(id) {
  const source = sources.get(id);
  if (!source) return { success: false, error: 'Source not found' };
  
  // Simulate connection test
  return {
    success: true,
    sourceId: id,
    type: source.type,
    recordsAvailable: Math.floor(Math.random() * 10000) + 1000,
    latency: Math.floor(Math.random() * 100) + 10,
    testedAt: new Date().toISOString()
  };
}

// ================================================================
// DESTINATION CONNECTORS
// ================================================================

function createDestination({ name, type, config, credentials }) {
  const id = `dest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const destination = {
    id,
    name,
    type, // 'cdp', 'warehouse', 'analytics', 'marketing'
    config,
    credentials,
    status: 'inactive',
    lastSync: null,
    recordCount: 0,
    errorCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  destinations.set(id, destination);
  return destination;
}

function getDestination(id) {
  return destinations.get(id) || null;
}

function listDestinations({ type, status, limit = 100 }) {
  let results = Array.from(destinations.values());
  
  if (type) {
    results = results.filter(d => d.type === type);
  }
  
  if (status) {
    results = results.filter(d => d.status === status);
  }
  
  return results.slice(0, limit);
}

function updateDestination(id, updates) {
  const destination = destinations.get(id);
  if (!destination) return null;
  
  Object.assign(destination, updates);
  destination.updatedAt = new Date().toISOString();
  destinations.set(id, destination);
  
  return destination;
}

function deleteDestination(id) {
  return destinations.delete(id);
}

// ================================================================
// SYNC JOBS
// ================================================================

function createSyncJob({ sourceId, destinationId, mode = 'full', schedule, transformations: transformIds = [] }) {
  const id = `sync_${Date.now()}_${++syncCounter}`;
  
  const job = {
    id,
    sourceId,
    destinationId,
    mode, // 'full', 'incremental'
    schedule, // cron expression or null for manual
    transformations: transformIds,
    status: 'pending',
    progress: {
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      percentage: 0
    },
    startedAt: null,
    completedAt: null,
    duration: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  syncJobs.set(id, job);
  
  // Start job if no schedule (manual)
  if (!schedule) {
    startSync(id);
  }
  
  return job;
}

function getSyncJob(id) {
  return syncJobs.get(id) || null;
}

function listSyncJobs({ sourceId, destinationId, status, limit = 100 }) {
  let results = Array.from(syncJobs.values());
  
  if (sourceId) {
    results = results.filter(j => j.sourceId === sourceId);
  }
  
  if (destinationId) {
    results = results.filter(j => j.destinationId === destinationId);
  }
  
  if (status) {
    results = results.filter(j => j.status === status);
  }
  
  return results
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function startSync(jobId) {
  const job = syncJobs.get(jobId);
  if (!job) return null;
  
  job.status = 'running';
  job.startedAt = new Date().toISOString();
  syncJobs.set(jobId, job);
  
  // Simulate sync process
  performSync(jobId);
  
  return job;
}

function performSync(jobId) {
  const job = syncJobs.get(jobId);
  if (!job) return;
  
  const source = sources.get(job.sourceId);
  const destination = destinations.get(job.destinationId);
  
  if (!source || !destination) {
    job.status = 'failed';
    job.error = 'Source or destination not found';
    job.completedAt = new Date().toISOString();
    syncJobs.set(jobId, job);
    return;
  }
  
  // Simulate data extraction
  const records = extractFromSource(source, job.mode);
  job.progress.totalRecords = records.length;
  
  // Apply transformations
  let transformedRecords = records;
  job.transformations.forEach(transformId => {
    const transform = transformations.get(transformId);
    if (transform) {
      transformedRecords = applyTransformation(transformedRecords, transform);
    }
  });
  
  // Load to destination
  const loadResult = loadToDestination(destination, transformedRecords);
  
  job.progress.processedRecords = loadResult.success;
  job.progress.failedRecords = loadResult.failed;
  job.progress.percentage = 100;
  job.status = loadResult.failed > 0 ? 'completed_with_errors' : 'completed';
  job.completedAt = new Date().toISOString();
  
  const duration = new Date(job.completedAt) - new Date(job.startedAt);
  job.duration = Math.floor(duration / 1000); // seconds
  
  // Update source/destination stats
  source.lastSync = job.completedAt;
  source.recordCount += loadResult.success;
  source.errorCount += loadResult.failed;
  sources.set(source.id, source);
  
  destination.lastSync = job.completedAt;
  destination.recordCount += loadResult.success;
  destination.errorCount += loadResult.failed;
  destinations.set(destination.id, destination);
  
  syncJobs.set(jobId, job);
}

function extractFromSource(source, mode) {
  // Simulate data extraction
  const recordCount = mode === 'full' ? 10000 : 500;
  
  const records = [];
  for (let i = 0; i < recordCount; i++) {
    records.push({
      id: `rec_${i}`,
      sourceId: source.id,
      sourceType: source.type,
      data: {
        email: `user${i}@example.com`,
        name: `User ${i}`,
        value: Math.floor(Math.random() * 1000)
      },
      extractedAt: new Date().toISOString()
    });
  }
  
  return records;
}

function loadToDestination(destination, records) {
  // Simulate data loading
  const successRate = 0.98;
  const success = Math.floor(records.length * successRate);
  const failed = records.length - success;
  
  return { success, failed };
}

function cancelSync(jobId) {
  const job = syncJobs.get(jobId);
  if (!job || job.status !== 'running') return null;
  
  job.status = 'cancelled';
  job.completedAt = new Date().toISOString();
  syncJobs.set(jobId, job);
  
  return job;
}

function retrySync(jobId) {
  const job = syncJobs.get(jobId);
  if (!job) return null;
  
  // Create new job with same config
  return createSyncJob({
    sourceId: job.sourceId,
    destinationId: job.destinationId,
    mode: job.mode,
    schedule: null,
    transformations: job.transformations
  });
}

// ================================================================
// DATA TRANSFORMATIONS
// ================================================================

function createTransformation({ name, type, config }) {
  const id = `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const transformation = {
    id,
    name,
    type, // 'map', 'filter', 'enrich', 'aggregate', 'custom'
    config,
    createdAt: new Date().toISOString()
  };
  
  transformations.set(id, transformation);
  return transformation;
}

function getTransformation(id) {
  return transformations.get(id) || null;
}

function listTransformations({ type, limit = 100 }) {
  let results = Array.from(transformations.values());
  
  if (type) {
    results = results.filter(t => t.type === type);
  }
  
  return results.slice(0, limit);
}

function applyTransformation(records, transformation) {
  const { type, config } = transformation;
  
  switch (type) {
    case 'map':
      return records.map(r => mapRecord(r, config.mapping));
    
    case 'filter':
      return records.filter(r => evaluateFilter(r, config.condition));
    
    case 'enrich':
      return records.map(r => enrichRecord(r, config.enrichment));
    
    case 'aggregate':
      return aggregateRecords(records, config.groupBy, config.aggregations);
    
    case 'custom':
      // Execute custom JavaScript function
      return records.map(r => config.function(r));
    
    default:
      return records;
  }
}

function mapRecord(record, mapping) {
  const mapped = { ...record };
  
  Object.keys(mapping).forEach(targetField => {
    const sourceField = mapping[targetField];
    mapped.data[targetField] = getNestedValue(record.data, sourceField);
  });
  
  return mapped;
}

function evaluateFilter(record, condition) {
  // Simple condition evaluation
  const { field, operator, value } = condition;
  const fieldValue = getNestedValue(record.data, field);
  
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'contains':
      return String(fieldValue).includes(value);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    default:
      return true;
  }
}

function enrichRecord(record, enrichment) {
  // Add additional fields
  const enriched = { ...record };
  enriched.data = { ...record.data, ...enrichment };
  return enriched;
}

function aggregateRecords(records, groupBy, aggregations) {
  const groups = {};
  
  records.forEach(record => {
    const groupKey = getNestedValue(record.data, groupBy);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(record);
  });
  
  return Object.keys(groups).map(groupKey => {
    const groupRecords = groups[groupKey];
    const aggregated = { group: groupKey };
    
    Object.keys(aggregations).forEach(aggField => {
      const aggType = aggregations[aggField];
      const values = groupRecords.map(r => getNestedValue(r.data, aggField));
      
      switch (aggType) {
        case 'count':
          aggregated[aggField] = values.length;
          break;
        case 'sum':
          aggregated[aggField] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggregated[aggField] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'min':
          aggregated[aggField] = Math.min(...values);
          break;
        case 'max':
          aggregated[aggField] = Math.max(...values);
          break;
      }
    });
    
    return aggregated;
  });
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function deleteTransformation(id) {
  return transformations.delete(id);
}

// ================================================================
// FIELD MAPPINGS
// ================================================================

function createMapping({ name, sourceId, destinationId, fields }) {
  const id = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const mapping = {
    id,
    name,
    sourceId,
    destinationId,
    fields, // { destField: 'sourceField' }
    createdAt: new Date().toISOString()
  };
  
  mappings.set(id, mapping);
  return mapping;
}

function getMapping(id) {
  return mappings.get(id) || null;
}

function listMappings({ sourceId, destinationId, limit = 100 }) {
  let results = Array.from(mappings.values());
  
  if (sourceId) {
    results = results.filter(m => m.sourceId === sourceId);
  }
  
  if (destinationId) {
    results = results.filter(m => m.destinationId === destinationId);
  }
  
  return results.slice(0, limit);
}

function deleteMapping(id) {
  return mappings.delete(id);
}

// ================================================================
// SYNC ANALYTICS
// ================================================================

function getSyncMetrics({ startDate, endDate }) {
  let jobs = Array.from(syncJobs.values());
  
  if (startDate) {
    jobs = jobs.filter(j => new Date(j.createdAt) >= new Date(startDate));
  }
  
  if (endDate) {
    jobs = jobs.filter(j => new Date(j.createdAt) <= new Date(endDate));
  }
  
  const completed = jobs.filter(j => j.status === 'completed');
  const failed = jobs.filter(j => j.status === 'failed');
  
  const totalRecords = jobs.reduce((sum, j) => sum + j.progress.processedRecords, 0);
  const totalErrors = jobs.filter(j => j.progress.failedRecords, 0);
  
  return {
    totalJobs: jobs.length,
    completed: completed.length,
    failed: failed.length,
    running: jobs.filter(j => j.status === 'running').length,
    totalRecords,
    totalErrors,
    avgDuration: completed.length > 0
      ? completed.reduce((sum, j) => sum + (j.duration || 0), 0) / completed.length
      : 0,
    successRate: jobs.length > 0 ? (completed.length / jobs.length) * 100 : 0
  };
}

function getSourcePerformance(sourceId) {
  const source = sources.get(sourceId);
  if (!source) return null;
  
  const jobs = Array.from(syncJobs.values()).filter(j => j.sourceId === sourceId);
  const completed = jobs.filter(j => j.status === 'completed');
  
  return {
    sourceId,
    sourceName: source.name,
    sourceType: source.type,
    totalSyncs: jobs.length,
    completedSyncs: completed.length,
    totalRecords: source.recordCount,
    totalErrors: source.errorCount,
    lastSync: source.lastSync,
    avgDuration: completed.length > 0
      ? completed.reduce((sum, j) => sum + (j.duration || 0), 0) / completed.length
      : 0
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Sources
  createSource,
  getSource,
  listSources,
  updateSource,
  deleteSource,
  testSourceConnection,
  
  // Destinations
  createDestination,
  getDestination,
  listDestinations,
  updateDestination,
  deleteDestination,
  
  // Sync Jobs
  createSyncJob,
  getSyncJob,
  listSyncJobs,
  startSync,
  cancelSync,
  retrySync,
  
  // Transformations
  createTransformation,
  getTransformation,
  listTransformations,
  applyTransformation,
  deleteTransformation,
  
  // Mappings
  createMapping,
  getMapping,
  listMappings,
  deleteMapping,
  
  // Analytics
  getSyncMetrics,
  getSourcePerformance,
  
  // Data stores
  sources,
  destinations,
  syncJobs,
  transformations,
  mappings
};
