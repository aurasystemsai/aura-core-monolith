const crypto = require('crypto');

const collabs = new Map();

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function createTask(payload = {}) {
  const briefId = payload.briefId || id('brief');
  const entry = collabs.get(briefId) || { tasks: [], comments: [], reviewers: [], activities: [] };
  const task = { taskId: id('task'), title: payload.title || 'Add CTA', status: payload.status || 'open', owner: payload.owner || 'Content' };
  entry.tasks.push(task);
  entry.activities.push({ id: id('act'), text: `Task created: ${task.title}`, ts: Date.now() });
  collabs.set(briefId, entry);
  return task;
}

function addComment(payload = {}) {
  const briefId = payload.briefId || id('brief');
  const entry = collabs.get(briefId) || { tasks: [], comments: [], reviewers: [], activities: [] };
  const comment = { commentId: id('cmt'), author: payload.author || 'Reviewer', text: payload.text || 'Comment', ts: Date.now() };
  entry.comments.push(comment);
  entry.activities.push({ id: id('act'), text: `Comment by ${comment.author}`, ts: Date.now() });
  collabs.set(briefId, entry);
  return comment;
}

function assignReviewer(briefId, reviewer) {
  const entry = collabs.get(briefId) || { tasks: [], comments: [], reviewers: [], activities: [] };
  const reviewers = Array.from(new Set([...(entry.reviewers || []), reviewer || 'Reviewer']));
  entry.reviewers = reviewers;
  entry.activities.push({ id: id('act'), text: `Reviewer added: ${reviewer}`, ts: Date.now() });
  collabs.set(briefId, entry);
  return { briefId, reviewers, tasks: entry.tasks, comments: entry.comments, activities: entry.activities };
}

function updateStatus(briefId, status) {
  const entry = collabs.get(briefId) || { tasks: [], comments: [], reviewers: [], activities: [] };
  entry.status = status || 'draft';
  entry.activities.push({ id: id('act'), text: `Status updated: ${status}`, ts: Date.now() });
  collabs.set(briefId, entry);
  return entry;
}

function getCollaboration(briefId) {
  return collabs.get(briefId) || { tasks: [], comments: [], reviewers: [], activities: [] };
}

function listActivities(briefId) {
  return (collabs.get(briefId) || { activities: [] }).activities;
}

function getStats() {
  return {
    briefs: collabs.size,
    totalTasks: Array.from(collabs.values()).reduce((acc, c) => acc + (c.tasks?.length || 0), 0),
  };
}

module.exports = {
  createTask,
  addComment,
  assignReviewer,
  updateStatus,
  getCollaboration,
  listActivities,
  getStats,
};
