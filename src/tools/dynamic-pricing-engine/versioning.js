// Rule versioning and history tracking for compliance and audit

let ruleHistory = new Map(); // ruleId -> version history array
let currentVersions = new Map(); // ruleId -> current version number

// Save a new version of a rule
const saveVersion = (ruleId, ruleData, changeType = 'update', changedBy = 'system') => {
  // Ensure ruleId is a number
  ruleId = Number(ruleId);
  
  if (!ruleHistory.has(ruleId)) {
    ruleHistory.set(ruleId, []);
    currentVersions.set(ruleId, 0);
  }

  const versionNumber = currentVersions.get(ruleId) + 1;
  currentVersions.set(ruleId, versionNumber);

  const version = {
    version: versionNumber,
    ruleId,
    changeType, // 'create', 'update', 'publish', 'rollback', 'delete'
    changedBy,
    changedAt: new Date().toISOString(),
    snapshot: JSON.parse(JSON.stringify(ruleData)), // Deep copy
    changes: null // Will be populated with diff
  };

  // If not the first version, calculate diff from previous
  const history = ruleHistory.get(ruleId);
  if (history.length > 0) {
    const previousVersion = history[history.length - 1];
    version.changes = calculateDiff(previousVersion.snapshot, ruleData);
  }

  history.push(version);
  ruleHistory.set(ruleId, history);

  return version;
};

// Calculate diff between two rule snapshots
const calculateDiff = (oldRule, newRule) => {
  const changes = [];

  // Check each field for changes
  const fields = new Set([
    ...Object.keys(oldRule || {}),
    ...Object.keys(newRule || {})
  ]);

  for (const field of fields) {
    const oldValue = oldRule?.[field];
    const newValue = newRule?.[field];

    // Skip nested comparison for now, just detect change
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field,
        oldValue,
        newValue,
        type: oldValue === undefined ? 'added' : newValue === undefined ? 'removed' : 'modified'
      });
    }
  }

  return changes;
};

// Get version history for a rule
const getHistory = (ruleId, options = {}) => {
  const history = ruleHistory.get(ruleId) || [];
  
  let filtered = history;

  // Filter by change type
  if (options.changeType) {
    filtered = filtered.filter(v => v.changeType === options.changeType);
  }

  // Filter by date range
  if (options.startDate) {
    filtered = filtered.filter(v => new Date(v.changedAt) >= new Date(options.startDate));
  }
  if (options.endDate) {
    filtered = filtered.filter(v => new Date(v.changedAt) <= new Date(options.endDate));
  }

  // Limit results
  if (options.limit) {
    filtered = filtered.slice(-options.limit);
  }

  return filtered;
};

// Get a specific version
const getVersion = (ruleId, versionNumber) => {
  const history = ruleHistory.get(ruleId) || [];
  return history.find(v => v.version === versionNumber);
};

// Get the latest version
const getLatestVersion = (ruleId) => {
  const history = ruleHistory.get(ruleId) || [];
  return history.length > 0 ? history[history.length - 1] : null;
};

// Compare two versions
const compareVersions = (ruleId, version1, version2) => {
  const v1 = getVersion(ruleId, version1);
  const v2 = getVersion(ruleId, version2);

  if (!v1 || !v2) {
    return { error: 'Version not found' };
  }

  return {
    version1: {
      version: v1.version,
      changeType: v1.changeType,
      changedBy: v1.changedBy,
      changedAt: v1.changedAt
    },
    version2: {
      version: v2.version,
      changeType: v2.changeType,
      changedBy: v2.changedBy,
      changedAt: v2.changedAt
    },
    diff: calculateDiff(v1.snapshot, v2.snapshot)
  };
};

// Revert to a previous version
const revertToVersion = (ruleId, versionNumber, changedBy = 'system') => {
  const targetVersion = getVersion(ruleId, versionNumber);
  if (!targetVersion) {
    return { error: 'Version not found' };
  }

  // Create a new version with the old snapshot
  const revertedRule = JSON.parse(JSON.stringify(targetVersion.snapshot));
  const newVersion = saveVersion(ruleId, revertedRule, 'rollback', changedBy);

  return {
    ok: true,
    version: newVersion,
    revertedTo: versionNumber
  };
};

// Get all rules with version counts
const getAllRulesVersionCounts = () => {
  const counts = [];
  for (const [ruleId, history] of ruleHistory.entries()) {
    counts.push({
      ruleId,
      versionCount: history.length,
      currentVersion: currentVersions.get(ruleId),
      latestChange: history[history.length - 1]?.changedAt,
      latestChangeBy: history[history.length - 1]?.changedBy
    });
  }
  return counts;
};

// Get recent changes across all rules
const getRecentChanges = (limit = 10) => {
  const allChanges = [];
  
  for (const [ruleId, history] of ruleHistory.entries()) {
    for (const version of history) {
      allChanges.push({
        ruleId,
        version: version.version,
        changeType: version.changeType,
        changedBy: version.changedBy,
        changedAt: version.changedAt,
        changes: version.changes
      });
    }
  }

  // Sort by date descending
  allChanges.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

  return allChanges.slice(0, limit);
};

// Clear version history (for testing)
const clear = () => {
  ruleHistory.clear();
  currentVersions.clear();
};

module.exports = {
  saveVersion,
  getHistory,
  getVersion,
  getLatestVersion,
  compareVersions,
  revertToVersion,
  getAllRulesVersionCounts,
  getRecentChanges,
  calculateDiff,
  clear
};
