/**
 * Audience & Segmentation - Contacts, segments, lists, behavioral targeting
 * Part of Email Automation Builder enterprise upgrade
 */

const { v4: uuidv4 } = require('uuid');

const contacts = new Map();
const segments = new Map();
const lists = new Map();
const behavioralEvents = new Map();

//=============================================================================
// CONTACTS
//=============================================================================

function listContacts(query = {}) {
  const { segment, list, limit = 100, offset = 0 } = query;
  let contactList = Array.from(contacts.values());
  
  if (segment) {
    const seg = segments.get(segment);
    if (seg) contactList = contactList.filter(c => _matchesSegment(c, seg));
  }
  
  if (list) {
    const lst = lists.get(list);
    if (lst) contactList = contactList.filter(c => lst.contactIds.includes(c.id));
  }
  
  return {
    contacts: contactList.slice(offset, offset + limit),
    total: contactList.length
  };
}

function getContact(id) {
  return contacts.get(id) || null;
}

function createContact(data) {
  const contact = {
    id: uuidv4(),
    email: data.email,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone || '',
    tags: data.tags || [],
    customFields: data.customFields || {},
    score: 0,
    status: 'subscribed', // subscribed, unsubscribed, bounced
    source: data.source || 'manual',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    lastEngagement: null,
    stats: {
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      purchases: 0,
      totalSpent: 0
    }
  };
  
  contacts.set(contact.id, contact);
  return contact;
}

function updateContact(id, updates) {
  const contact = contacts.get(id);
  if (!contact) return null;
  
  const updated = {
    ...contact,
    ...updates,
    id: contact.id,
    created: contact.created,
    updated: new Date().toISOString(),
    stats: contact.stats
  };
  
  contacts.set(id, updated);
  return updated;
}

function deleteContact(id) {
  return contacts.delete(id);
}

function calculateContactScore(id) {
  const contact = contacts.get(id);
  if (!contact) return null;
  
  let score = 0;
  score += contact.stats.emailsOpened * 2;
  score += contact.stats.emailsClicked * 5;  score += contact.stats.purchases * 20;
  score += Math.min(contact.stats.totalSpent / 10, 50);
  
  const updated = updateContact(id, { score });
  return updated;
}

//=============================================================================
// SEGMENTS
//=============================================================================

function listSegments(query = {}) {
  const { limit = 100, offset = 0 } = query;
  const list = Array.from(segments.values());
  
  return {
    segments: list.slice(offset, offset + limit).map(s => ({
      ...s,
      contactCount: _countSegmentContacts(s)
    })),
    total: list.length
  };
}

function getSegment(id) {
  const segment = segments.get(id);
  if (!segment) return null;
  
  return {
    ...segment,
    contactCount: _countSegmentContacts(segment)
  };
}

function createSegment(data) {
  const segment = {
    id: uuidv4(),
    name: data.name || 'Untitled Segment',
    description: data.description || '',
    type: data.type || 'static', // static, dynamic, behavioral, predictive
    rules: data.rules || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: data.createdBy || 'system'
  };
  
  segments.set(segment.id, segment);
  return segment;
}

function updateSegment(id, updates) {
  const segment = segments.get(id);
  if (!segment) return null;
  
  const updated = {
    ...segment,
    ...updates,
    id: segment.id,
    created: segment.created,
    updated: new Date().toISOString()
  };
  
  segments.set(id, updated);
  return updated;
}

function deleteSegment(id) {
  return segments.delete(id);
}

function getSegmentContacts(id) {
  const segment = segments.get(id);
  if (!segment) return [];
  
  const contactList = Array.from(contacts.values());
  return contactList.filter(c => _matchesSegment(c, segment));
}

function _matchesSegment(contact, segment) {
  if (segment.type === 'static') return true;
  
  // Simple rule matching
  return segment.rules.every(rule => {
    const value = contact[rule.field] || contact.stats[rule.field] || contact.customFields[rule.field];
    
    switch (rule.operator) {
      case '>': return value > rule.value;
      case '<': return value < rule.value;
      case '=': return value === rule.value;
      case 'contains': return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
      default: return false;
    }
  });
}

function _countSegmentContacts(segment) {
  return getSegmentContacts(segment.id).length;
}

function refreshSegment(id) {
  const segment = segments.get(id);
  if (!segment || segment.type !== 'dynamic') return null;
  
  return updateSegment(id, { updated: new Date().toISOString() });
}

//=============================================================================
// LISTS
//=============================================================================

function listLists() {
  return Array.from(lists.values()).map(l => ({
    ...l,
    contactCount: l.contactIds.length
  }));
}

function getList(id) {
  const list = lists.get(id);
  if (!list) return null;
  
  return {
    ...list,
    contactCount: list.contactIds.length
  };
}

function createList(data) {
  const list = {
    id: uuidv4(),
    name: data.name || 'Untitled List',
    description: data.description || '',
    contactIds: data.contactIds || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: data.createdBy || 'system'
  };
  
  lists.set(list.id, list);
  return list;
}

function updateList(id, updates) {
  const list = lists.get(id);
  if (!list) return null;
  
  const updated = {
    ...list,
    ...updates,
    id: list.id,
    created: list.created,
    updated: new Date().toISOString()
  };
  
  lists.set(id, updated);
  return updated;
}

function deleteList(id) {
  return lists.delete(id);
}

function addContactsToList(listId, contactIds = []) {
  const list = lists.get(listId);
  if (!list) return null;
  
  const uniqueIds = [...new Set([...list.contactIds, ...contactIds])];
  return updateList(listId, { contactIds: uniqueIds });
}

function removeContactsFromList(listId, contactIds = []) {
  const list = lists.get(listId);
  if (!list) return null;
  
  const filtered = list.contactIds.filter(id => !contactIds.includes(id));
  return updateList(listId, { contactIds: filtered });
}

//=============================================================================
// BEHAVIORAL TRACKING
//=============================================================================

function trackBehavioralEvent(data) {
  const event = {
    id: uuidv4(),
    contactId: data.contactId,
    event: data.event,
    properties: data.properties || {},
    timestamp: new Date().toISOString()
  };
  
  if (!behavioralEvents.has(data.contactId)) {
    behavioralEvents.set(data.contactId, []);
  }
  
  behavioralEvents.get(data.contactId).push(event);
  
  // Keep only last 1000 events per contact
  const events = behavioralEvents.get(data.contactId);
  if (events.length > 1000) events.shift();
  
  return event;
}

function getContactBehavior(contactId) {
  return behavioralEvents.get(contactId) || [];
}

function listBehavioralEvents() {
  return [
    { id: 'page_view', name: 'Page View' },
    { id: 'product_view', name: 'Product View' },
    { id: 'add_to_cart', name: 'Add to Cart' },
    { id: 'purchase', name: 'Purchase' },
    { id: 'email_open', name: 'Email Open' },
    { id: 'email_click', name: 'Email Click' }
  ];
}

//=============================================================================
// BULK OPERATIONS
//=============================================================================

function bulkImportContacts(data = []) {
  const imported = data.map(item => createContact(item));
  return {
    imported: imported.length,
    contacts: imported
  };
}

function bulkUpdateContacts(updates = []) {
  const results = updates.map(({ id, ...data }) => updateContact(id, data)).filter(Boolean);
  return {
    updated: results.length,
    contacts: results
  };
}

//=============================================================================
// SEED DATA
//=============================================================================

function _seedDemoData() {
  // Create demo contacts
  createContact({
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    tags: ['vip', 'newsletter'],
    source: 'signup-form'
  });
  
  createContact({
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    tags: ['newsletter'],
    source: 'import'
  });
  
  // Create demo segment
  createSegment({
    name: 'Engaged Users',
    description: 'Users who have opened at least 3 emails',
    type: 'dynamic',
    rules: [{ field: 'emailsOpened', operator: '>', value: 3 }]
  });
  
  // Create demo list
  createList({
    name: 'Newsletter Subscribers',
    description: 'Monthly newsletter list',
    contactIds: []
  });
}

_seedDemoData();

module.exports = {
  // Contacts
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  calculateContactScore,
  bulkImportContacts,
  bulkUpdateContacts,
  
  // Segments
  listSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
  getSegmentContacts,
  refreshSegment,
  
  // Lists
  listLists,
  getList,
  createList,
  updateList,
  deleteList,
  addContactsToList,
  removeContactsFromList,
  
  // Behavioral
  trackBehavioralEvent,
  getContactBehavior,
  listBehavioralEvents
};
