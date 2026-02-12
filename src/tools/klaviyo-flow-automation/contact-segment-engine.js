// ================================================================
// KLAVIYO FLOW AUTOMATION - CONTACT & SEGMENT ENGINE
// ================================================================
// Handles contact management, segmentation, audiences, list building
// ================================================================

const crypto = require('crypto');

// In-memory stores
const contacts = new Map();
const segments = new Map();
const lists = new Map();
const audiences = new Map();
const importJobs = new Map();

// ================================================================
// CONTACT MANAGEMENT
// ================================================================

function listContacts(filter = {}) {
  let results = Array.from(contacts.values());
  
  if (filter.status) {
    results = results.filter(c => c.status === filter.status);
  }
  if (filter.tags) {
    results = results.filter(c => c.tags && c.tags.some(tag => filter.tags.includes(tag)));
  }
  if (filter.listId) {
    const list = lists.get(filter.listId);
    if (list) {
      results = results.filter(c => list.contactIds.includes(c.id));
    }
  }
  if (filter.search) {
    const search = filter.search.toLowerCase();
    results = results.filter(c => 
      c.email?.toLowerCase().includes(search) ||
      c.firstName?.toLowerCase().includes(search) ||
      c.lastName?.toLowerCase().includes(search)
    );
  }
  
  return results;
}

function createContact(data) {
  const contact = {
    id: `CONTACT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    email: data.email || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone || null,
    status: data.status || 'subscribed',
    tags: data.tags || [],
    customProperties: data.customProperties || {},
    source: data.source || 'manual',
    optedInAt: data.optedInAt || Date.now(),
    lastEngagedAt: null,
    totalSpent: 0,
    orderCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  contacts.set(contact.id, contact);
  return contact;
}

function getContact(id) {
  return contacts.get(id);
}

function getContactByEmail(email) {
  return Array.from(contacts.values()).find(c => c.email === email);
}

function updateContact(id, updates) {
  const contact = contacts.get(id);
  if (!contact) return null;
  
  Object.assign(contact, updates, { updatedAt: Date.now() });
  contacts.set(id, contact);
  return contact;
}

function deleteContact(id) {
  // Remove from all lists
  lists.forEach(list => {
    const index = list.contactIds.indexOf(id);
    if (index > -1) {
      list.contactIds.splice(index, 1);
    }
  });
  
  return contacts.delete(id);
}

function enrichContact(id, data) {
  const contact = contacts.get(id);
  if (!contact) return null;
  
  contact.customProperties = {
    ...contact.customProperties,
    ...data
  };
  contact.updatedAt = Date.now();
  contacts.set(id, contact);
  return contact;
}

function subscribeContact(id) {
  return updateContact(id, { 
    status: 'subscribed', 
    optedInAt: Date.now() 
  });
}

function unsubscribeContact(id) {
  return updateContact(id, { 
    status: 'unsubscribed', 
    optedOutAt: Date.now() 
  });
}

// ================================================================
// SEGMENTATION
// ================================================================

function listSegments(filter = {}) {
  let results = Array.from(segments.values());
  
  if (filter.type) {
    results = results.filter(s => s.type === filter.type);
  }
  
  return results;
}

function createSegment(data) {
  const segment = {
    id: `SEG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Segment',
    type: data.type || 'dynamic',
    conditions: data.conditions || [],
    contactIds: [],
    autoUpdate: data.autoUpdate !== false,
    lastComputedAt: null,
    stats: {
      totalContacts: 0,
      growthRate: 0,
      averageValue: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  segments.set(segment.id, segment);
  
  // Compute segment if dynamic
  if (segment.type === 'dynamic') {
    computeSegment(segment.id);
  }
  
  return segment;
}

function getSegment(id) {
  return segments.get(id);
}

function updateSegment(id, updates) {
  const segment = segments.get(id);
  if (!segment) return null;
  
  Object.assign(segment, updates, { updatedAt: Date.now() });
  segments.set(id, segment);
  
  // Recompute if dynamic
  if (segment.type === 'dynamic') {
    computeSegment(id);
  }
  
  return segment;
}

function deleteSegment(id) {
  return segments.delete(id);
}

function computeSegment(id) {
  const segment = segments.get(id);
  if (!segment) return null;
  
  // Evaluate conditions
  const matchingContacts = Array.from(contacts.values()).filter(contact => {
    return evaluateConditions(contact, segment.conditions);
  });
  
  segment.contactIds = matchingContacts.map(c => c.id);
  segment.stats.totalContacts = matchingContacts.length;
  segment.lastComputedAt = Date.now();
  
  segments.set(id, segment);
  return segment;
}

function evaluateConditions(contact, conditions) {
  if (!conditions || conditions.length === 0) return true;
  
  return conditions.every(condition => {
    const { field, operator, value } = condition;
    const contactValue = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], contact)
      : contact[field];
    
    switch (operator) {
      case 'equals':
        return contactValue === value;
      case 'not_equals':
        return contactValue !== value;
      case 'contains':
        return String(contactValue).includes(value);
      case 'greater_than':
        return Number(contactValue) > Number(value);
      case 'less_than':
        return Number(contactValue) < Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(contactValue);
      default:
        return true;
    }
  });
}

function addContactsToSegment(segmentId, contactIds) {
  const segment = segments.get(segmentId);
  if (!segment || segment.type !== 'static') return null;
  
  segment.contactIds = [...new Set([...segment.contactIds, ...contactIds])];
  segment.stats.totalContacts = segment.contactIds.length;
  segment.updatedAt = Date.now();
  
  segments.set(segmentId, segment);
  return segment;
}

function removeContactsFromSegment(segmentId, contactIds) {
  const segment = segments.get(segmentId);
  if (!segment || segment.type !== 'static') return null;
  
  segment.contactIds = segment.contactIds.filter(id => !contactIds.includes(id));
  segment.stats.totalContacts = segment.contactIds.length;
  segment.updatedAt = Date.now();
  
  segments.set(segmentId, segment);
  return segment;
}

// ================================================================
// LIST MANAGEMENT
// ================================================================

function listLists(filter = {}) {
  let results = Array.from(lists.values());
  
  if (filter.type) {
    results = results.filter(l => l.type === filter.type);
  }
  
  return results;
}

function createList(data) {
  const list = {
    id: `LIST-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled List',
    type: data.type || 'standard',
    description: data.description || '',
    contactIds: [],
    settings: {
      doubleOptIn: data.doubleOptIn !== false,
      welcomeEmail: data.welcomeEmail || null,
      confirmationPage: data.confirmationPage || null
    },
    stats: {
      totalContacts: 0,
      subscribedContacts: 0,
      unsubscribedContacts: 0,
      growthRate: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  lists.set(list.id, list);
  return list;
}

function getList(id) {
  return lists.get(id);
}

function updateList(id, updates) {
  const list = lists.get(id);
  if (!list) return null;
  
  Object.assign(list, updates, { updatedAt: Date.now() });
  lists.set(id, list);
  return list;
}

function deleteList(id) {
  return lists.delete(id);
}

function addContactsToList(listId, contactIds) {
  const list = lists.get(listId);
  if (!list) return null;
  
  list.contactIds = [...new Set([...list.contactIds, ...contactIds])];
  list.stats.totalContacts = list.contactIds.length;
  list.updatedAt = Date.now();
  
  lists.set(listId, list);
  return list;
}

function removeContactsFromList(listId, contactIds) {
  const list = lists.get(listId);
  if (!list) return null;
  
  list.contactIds = list.contactIds.filter(id => !contactIds.includes(id));
  list.stats.totalContacts = list.contactIds.length;
  list.updatedAt = Date.now();
  
  lists.set(listId, list);
  return list;
}

// ================================================================
// AUDIENCE BUILDER
// ================================================================

function listAudiences(filter = {}) {
  return Array.from(audiences.values());
}

function createAudience(data) {
  const audience = {
    id: `AUD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Audience',
    segmentIds: data.segmentIds || [],
    listIds: data.listIds || [],
    rules: data.rules || [],
    contactIds: [],
    estimatedReach: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  audiences.set(audience.id, audience);
  computeAudience(audience.id);
  return audience;
}

function getAudience(id) {
  return audiences.get(id);
}

function updateAudience(id, updates) {
  const audience = audiences.get(id);
  if (!audience) return null;
  
  Object.assign(audience, updates, { updatedAt: Date.now() });
  audiences.set(id, audience);
  computeAudience(id);
  return audience;
}

function deleteAudience(id) {
  return audiences.delete(id);
}

function computeAudience(id) {
  const audience = audiences.get(id);
  if (!audience) return null;
  
  let allContacts = new Set();
  
  // Add contacts from segments
  audience.segmentIds.forEach(segId => {
    const segment = segments.get(segId);
    if (segment) {
      segment.contactIds.forEach(cid => allContacts.add(cid));
    }
  });
  
  // Add contacts from lists
  audience.listIds.forEach(listId => {
    const list = lists.get(listId);
    if (list) {
      list.contactIds.forEach(cid => allContacts.add(cid));
    }
  });
  
  audience.contactIds = Array.from(allContacts);
  audience.estimatedReach = audience.contactIds.length;
  audiences.set(id, audience);
  return audience;
}

// ================================================================
// DATA IMPORT/EXPORT
// ================================================================

function createImportJob(data) {
  const job = {
    id: `IMPORT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    type: data.type || 'contacts',
    source: data.source || 'csv',
    fileName: data.fileName || 'import.csv',
    listId: data.listId || null,
    mapping: data.mapping || {},
    status: 'pending',
    progress: 0,
    stats: {
      total: 0,
      processed: 0,
      imported: 0,
      failed: 0,
      duplicates: 0
    },
    errors: [],
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null
  };
  
  importJobs.set(job.id, job);
  return job;
}

function getImportJob(id) {
  return importJobs.get(id);
}

function processImport(id, data) {
  const job = importJobs.get(id);
  if (!job) return null;
  
  job.status = 'processing';
  job.startedAt = Date.now();
  job.stats.total = data.length;
  
  data.forEach((row, index) => {
    try {
      const contactData = {};
      Object.entries(job.mapping).forEach(([csvField, contactField]) => {
        contactData[contactField] = row[csvField];
      });
      
      // Check for duplicate
      const existing = getContactByEmail(contactData.email);
      if (existing) {
        job.stats.duplicates++;
      } else {
        const contact = createContact(contactData);
        if (job.listId) {
          addContactsToList(job.listId, [contact.id]);
        }
        job.stats.imported++;
      }
      
      job.stats.processed++;
      job.progress = (job.stats.processed / job.stats.total * 100).toFixed(2);
    } catch (error) {
      job.stats.failed++;
      job.errors.push({ row: index, error: error.message });
    }
  });
  
  job.status = 'completed';
  job.completedAt = Date.now();
  importJobs.set(id, job);
  return job;
}

function exportContacts(filter = {}) {
  const contactsToExport = listContacts(filter);
  
  return {
    count: contactsToExport.length,
    data: contactsToExport.map(c => ({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      status: c.status,
      tags: c.tags.join(','),
      createdAt: new Date(c.createdAt).toISOString()
    })),
    exportedAt: Date.now()
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Contact Management
  listContacts,
  createContact,
  getContact,
  getContactByEmail,
  updateContact,
  deleteContact,
  enrichContact,
  subscribeContact,
  unsubscribeContact,
  
  // Segmentation
  listSegments,
  createSegment,
  getSegment,
  updateSegment,
  deleteSegment,
  computeSegment,
  addContactsToSegment,
  removeContactsFromSegment,
  
  // Lists
  listLists,
  createList,
  getList,
  updateList,
  deleteList,
  addContactsToList,
  removeContactsFromList,
  
  // Audiences
  listAudiences,
  createAudience,
  getAudience,
  updateAudience,
  deleteAudience,
  computeAudience,
  
  // Import/Export
  createImportJob,
  getImportJob,
  processImport,
  exportContacts
};
