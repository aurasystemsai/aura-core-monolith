/**
 * Team Performance Engine
 * Handles agent productivity, performance dashboards, leaderboards, goals
 */

// In-memory storage (replace with database in production)
const agentMetrics = new Map();
const performanceGoals = new Map();
const achievements = new Map();
const leaderboards = new Map();
const productivityReports = new Map();

/**
 * Track agent metrics
 */
async function trackAgentMetrics(metricsData) {
  const metricId = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const metric = {
    id: metricId,
    agentId: metricsData.agentId,
    date: metricsData.date || new Date().toISOString().split('T')[0],
    ticketsResolved: metricsData.ticketsResolved || 0,
    ticketsCreated: metricsData.ticketsCreated || 0,
    averageResponseTime: metricsData.averageResponseTime || 0, // minutes
    averageResolutionTime: metricsData.averageResolutionTime || 0, // minutes
    csatScore: metricsData.csatScore || 0,
    qaScore: metricsData.qaScore || 0,
    firstContactResolution: metricsData.firstContactResolution || 0,
    customerReplies: metricsData.customerReplies || 0,
    activeTime: metricsData.activeTime || 0, // minutes
    idleTime: metricsData.idleTime || 0, // minutes
    createdAt: new Date().toISOString()
  };
  
  agentMetrics.set(metricId, metric);
  return metric;
}

/**
 * Get agent performance
 */
async function getAgentPerformance(agentId, period = 'week') {
  const now = new Date();
  let startDate = new Date();
  
  if (period === 'day') {
    startDate.setDate(now.getDate() - 1);
  } else if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === 'quarter') {
    startDate.setMonth(now.getMonth() - 3);
  }
  
  const metrics = Array.from(agentMetrics.values())
    .filter(m => m.agentId === agentId)
    .filter(m => new Date(m.date) >= startDate);
  
  if (metrics.length === 0) {
    return {
      agentId,
      period,
      noData: true
    };
  }
  
  const totals = {
    ticketsResolved: 0,
    ticketsCreated: 0,
    customerReplies: 0,
    activeTime: 0,
    idleTime: 0
  };
  
  const averages = {
    responseTime: 0,
    resolutionTime: 0,
    csatScore: 0,
    qaScore: 0,
    firstContactResolution: 0
  };
  
  metrics.forEach(m => {
    totals.ticketsResolved += m.ticketsResolved;
    totals.ticketsCreated += m.ticketsCreated;
    totals.customerReplies += m.customerReplies;
    totals.activeTime += m.activeTime;
    totals.idleTime += m.idleTime;
    
    averages.responseTime += m.averageResponseTime;
    averages.resolutionTime += m.averageResolutionTime;
    averages.csatScore += m.csatScore;
    averages.qaScore += m.qaScore;
    averages.firstContactResolution += m.firstContactResolution;
  });
  
  const count = metrics.length;
  Object.keys(averages).forEach(key => {
    averages[key] = Math.round((averages[key] / count) * 10) / 10;
  });
  
  // Calculate productivity score
  const productivityScore = calculateProductivityScore(totals, averages, period);
  
  // Get goal progress
  const goalProgress = await getGoalProgress(agentId);
  
  return {
    agentId,
    period,
    totals,
    averages,
    productivityScore,
    utilizationRate: totals.activeTime + totals.idleTime > 0 ? 
      (totals.activeTime / (totals.activeTime + totals.idleTime)) * 100 : 0,
    goalProgress,
    trend: calculateTrend(metrics)
  };
}

/**
 * Calculate productivity score
 */
function calculateProductivityScore(totals, averages, period) {
  let score = 0;
  
  // Tickets resolved (30%)
  const ticketsPerDay = period === 'week' ? totals.ticketsResolved / 7 : 
                        period === 'month' ? totals.ticketsResolved / 30 : totals.ticketsResolved;
  score += Math.min((ticketsPerDay / 20) * 30, 30); // 20 tickets/day = 100%
  
  // CSAT (25%)
  score += (averages.csatScore / 5) * 25; // Max 5 = 25 points
  
  // QA Score (25%)
  score += (averages.qaScore / 100) * 25;
  
  // First Contact Resolution (10%)
  score += (averages.firstContactResolution / 100) * 10;
  
  // Response time (10%) - inverse (lower is better)
  const responseScore = Math.max(0, 1 - (averages.responseTime / 120));
  score += responseScore * 10;
  
  return Math.round(score * 10) / 10;
}

/**
 * Calculate trend
 */
function calculateTrend(metrics) {
  if (metrics.length < 2) return 'stable';
  
  const sorted = metrics.sort((a, b) => new Date(a.date) - new Date(b.date));
  const midPoint = Math.floor(sorted.length / 2);
  
  const firstHalf = sorted.slice(0, midPoint);
  const secondHalf = sorted.slice(midPoint);
  
  const firstAvg = firstHalf.reduce((sum, m) => sum + m.ticketsResolved, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, m) => sum + m.ticketsResolved, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg * 1.1) return 'improving';
  if (secondAvg < firstAvg * 0.9) return 'declining';
  return 'stable';
}

/**
 * Create performance goal
 */
async function createPerformanceGoal(goalData) {
  const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const goal = {
    id: goalId,
    agentId: goalData.agentId,
    teamId: goalData.teamId,
    type: goalData.type, // individual, team
    metric: goalData.metric, // tickets_resolved, csat_score, qa_score, response_time
    target: goalData.target,
    currentValue: 0,
    period: goalData.period || 'month',
    startDate: goalData.startDate || new Date().toISOString(),
    endDate: goalData.endDate,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  performanceGoals.set(goalId, goal);
  return goal;
}

/**
 * Get goal progress
 */
async function getGoalProgress(agentId) {
  const goals = Array.from(performanceGoals.values())
    .filter(g => g.agentId === agentId && g.status === 'active');
  
  return goals.map(goal => {
    const progress = (goal.currentValue / goal.target) * 100;
    
    return {
      ...goal,
      progress: Math.min(progress, 100),
      status: progress >= 100 ? 'achieved' : 
              progress >= 80 ? 'on_track' :
              progress >= 50 ? 'at_risk' : 'behind'
    };
  });
}

/**
 * Update goal progress
 */
async function updateGoalProgress(goalId, currentValue) {
  const goal = performanceGoals.get(goalId);
  if (!goal) throw new Error('Goal not found');
  
  goal.currentValue = currentValue;
  
  // Check if achieved
  if (currentValue >= goal.target && goal.status === 'active') {
    goal.status = 'achieved';
    
    // Create achievement
    await createAchievement({
      agentId: goal.agentId,
      type: 'goal_achieved',
      title: `${goal.metric} goal achieved`,
      description: `Reached target of ${goal.target}`,
      icon: '🎯',
      points: 100
    });
  }
  
  performanceGoals.set(goalId, goal);
  return goal;
}

/**
 * Create achievement
 */
async function createAchievement(achievementData) {
  const achievementId = `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const achievement = {
    id: achievementId,
    agentId: achievementData.agentId,
    type: achievementData.type,
    title: achievementData.title,
    description: achievementData.description,
    icon: achievementData.icon || '⭐',
    points: achievementData.points || 0,
    rarity: achievementData.rarity || 'common', // common, rare, epic, legendary
    unlockedAt: new Date().toISOString()
  };
  
  achievements.set(achievementId, achievement);
  return achievement;
}

/**
 * Get agent achievements
 */
async function getAgentAchievements(agentId) {
  return Array.from(achievements.values())
    .filter(a => a.agentId === agentId)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
}

/**
 * Generate leaderboard
 */
async function generateLeaderboard(leaderboardData) {
  const leaderboardId = `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const metric = leaderboardData.metric; // tickets_resolved, csat_score, qa_score, productivity_score
  const period = leaderboardData.period || 'month';
  const teamId = leaderboardData.teamId;
  
  // Get all agent performances
  const agents = Array.from(new Set(
    Array.from(agentMetrics.values())
      .filter(m => !teamId || m.teamId === teamId)
      .map(m => m.agentId)
  ));
  
  const rankings = [];
  for (const agentId of agents) {
    const performance = await getAgentPerformance(agentId, period);
    
    let value = 0;
    if (metric === 'tickets_resolved') {
      value = performance.totals.ticketsResolved;
    } else if (metric === 'csat_score') {
      value = performance.averages.csatScore;
    } else if (metric === 'qa_score') {
      value = performance.averages.qaScore;
    } else if (metric === 'productivity_score') {
      value = performance.productivityScore;
    }
    
    rankings.push({
      agentId,
      value,
      rank: 0
    });
  }
  
  // Sort and assign ranks
  rankings.sort((a, b) => b.value - a.value);
  rankings.forEach((r, index) => {
    r.rank = index + 1;
  });
  
  const leaderboard = {
    id: leaderboardId,
    metric,
    period,
    teamId,
    rankings,
    generatedAt: new Date().toISOString()
  };
  
  leaderboards.set(leaderboardId, leaderboard);
  return leaderboard;
}

/**
 * Get team performance summary
 */
async function getTeamPerformanceSummary(teamId, period = 'month') {
  const teamMetrics = Array.from(agentMetrics.values())
    .filter(m => m.teamId === teamId);
  
  const uniqueAgents = new Set(teamMetrics.map(m => m.agentId));
  
  const totals = {
    agents: uniqueAgents.size,
    ticketsResolved: 0,
    ticketsCreated: 0,
    customerReplies: 0
  };
  
  const averages = {
    responseTime: 0,
    resolutionTime: 0,
    csatScore: 0,
    qaScore: 0,
    productivityScore: 0
  };
  
  for (const agentId of uniqueAgents) {
    const perf = await getAgentPerformance(agentId, period);
    totals.ticketsResolved += perf.totals.ticketsResolved;
    totals.ticketsCreated += perf.totals.ticketsCreated;
    totals.customerReplies += perf.totals.customerReplies;
    
    averages.responseTime += perf.averages.responseTime;
    averages.resolutionTime += perf.averages.resolutionTime;
    averages.csatScore += perf.averages.csatScore;
    averages.qaScore += perf.averages.qaScore;
    averages.productivityScore += perf.productivityScore;
  }
  
  const count = uniqueAgents.size;
  if (count > 0) {
    Object.keys(averages).forEach(key => {
      averages[key] = Math.round((averages[key] / count) * 10) / 10;
    });
  }
  
  return {
    teamId,
    period,
    totals,
    averages
  };
}

/**
 * Get performance statistics
 */
async function getPerformanceStatistics() {
  return {
    totalMetrics: agentMetrics.size,
    totalGoals: performanceGoals.size,
    activeGoals: Array.from(performanceGoals.values()).filter(g => g.status === 'active').length,
    achievedGoals: Array.from(performanceGoals.values()).filter(g => g.status === 'achieved').length,
    totalAchievements: achievements.size,
    totalLeaderboards: leaderboards.size
  };
}

module.exports = {
  trackAgentMetrics,
  getAgentPerformance,
  createPerformanceGoal,
  getGoalProgress,
  updateGoalProgress,
  createAchievement,
  getAgentAchievements,
  generateLeaderboard,
  getTeamPerformanceSummary,
  getPerformanceStatistics
};
