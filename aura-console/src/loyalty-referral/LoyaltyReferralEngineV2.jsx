import React, { useState, useEffect } from 'react';
import { Page, Tabs, Card, Layout, Button, Text, Badge, Icon, DataTable, EmptyState } from '@shopify/polaris';
import './LoyaltyReferralEngineV2.css';

export default function LoyaltyReferralEngineV2() {
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pointsData, setPointsData] = useState(null);
  const [tierData, setTierData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [gamificationData, setGamificationData] = useState(null);
  const [automationData, setAutomationData] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [integrationData, setIntegrationData] = useState(null);
  const [stats, setStats] = useState({
    totalPointsIssued: 0,
    activeMembers: 0,
    redemptionRate: 0,
    referralConversion: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/loyalty-referral/statistics');
      const data = await response.json();
      if (data.success) {
        setStats({
          totalPointsIssued: data.statistics.points.totalPointsIssued || 0,
          activeMembers: data.statistics.tiers.totalMembers || 0,
          redemptionRate: data.statistics.points.redemptionRate || 0,
          referralConversion: data.statistics.referrals.conversionRate || 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    // Points & Rewards (8 tabs)
    { id: 'points-balance', content: 'Points Balance' },
    { id: 'earn-points', content: 'Earn Points' },
    { id: 'spend-points', content: 'Spend Points' },
    { id: 'rewards-catalog', content: 'Rewards Catalog' },
    { id: 'redemptions', content: 'Redemptions' },
    { id: 'transactions', content: 'Transactions' },
    { id: 'transfer-points', content: 'Transfer Points' },
    { id: 'points-stats', content: 'Points Stats' },
    
    // Tiers & VIP (6 tabs)
    { id: 'tier-overview', content: 'Tier Overview' },
    { id: 'tier-progress', content: 'Tier Progress' },
    { id: 'tier-benefits', content: 'Tier Benefits' },
    { id: 'vip-segments', content: 'VIP Segments' },
    { id: 'tier-history', content: 'Tier History' },
    { id: 'tier-stats', content: 'Tier Stats' },
    
    // Referrals (5 tabs)
    { id: 'referral-dashboard', content: 'Referral Dashboard' },
    { id: 'my-referrals', content: 'My Referrals' },
    { id: 'referral-campaigns', content: 'Campaigns' },
    { id: 'share-tools', content: 'Share Tools' },
    { id: 'referral-stats', content: 'Referral Stats' },
    
    // Gamification (4 tabs)
    { id: 'badges', content: 'Badges' },
    { id: 'challenges', content: 'Challenges' },
    { id: 'achievements', content: 'Achievements' },
    { id: 'leaderboard', content: 'Leaderboard' },
    
    // Automation (5 tabs)
    { id: 'campaigns', content: 'Campaigns' },
    { id: 'triggers', content: 'Triggers' },
    { id: 'workflows', content: 'Workflows' },
    { id: 'schedules', content: 'Schedules' },
    { id: 'automation-stats', content: 'Automation Stats' },
    
    // Member Portal (6 tabs)
    { id: 'dashboard', content: 'Dashboard' },
    { id: 'activity-feed', content: 'Activity Feed' },
    { id: 'preferences', content: 'Preferences' },
    { id: 'my-rewards', content: 'My Rewards' },
    { id: 'my-referrals-portal', content: 'My Referrals' },
    { id: 'my-progress', content: 'My Progress' },
    
    // Analytics (5 tabs)
    { id: 'overview-dashboard', content: 'Overview' },
    { id: 'metrics', content: 'Metrics' },
    { id: 'reports', content: 'Reports' },
    { id: 'insights', content: 'Insights' },
    { id: 'cohort-analysis', content: 'Cohort Analysis' },
    
    // Integrations (3 tabs)
    { id: 'platforms', content: 'Platforms' },
    { id: 'webhooks', content: 'Webhooks' },
    { id: 'sync-logs', content: 'Sync Logs' },
  ];

  const renderDashboard = () => (
    <Layout>
      <Layout.Section>
        <div className="loyalty-stats-grid">
          <Card>
            <div className="stat-card">
              <Text variant="headingMd">Total Points Issued</Text>
              <Text variant="heading2xl" as="h2">{stats.totalPointsIssued.toLocaleString()}</Text>
            </div>
          </Card>
          <Card>
            <div className="stat-card">
              <Text variant="headingMd">Active Members</Text>
              <Text variant="heading2xl" as="h2">{stats.activeMembers.toLocaleString()}</Text>
            </div>
          </Card>
          <Card>
            <div className="stat-card">
              <Text variant="headingMd">Redemption Rate</Text>
              <Text variant="heading2xl" as="h2">{stats.redemptionRate}%</Text>
            </div>
          </Card>
          <Card>
            <div className="stat-card">
              <Text variant="headingMd">Referral Conversion</Text>
              <Text variant="heading2xl" as="h2">{stats.referralConversion}%</Text>
            </div>
          </Card>
        </div>
      </Layout.Section>
    </Layout>
  );

  const renderPointsBalance = () => (
    <Card title="Points Balance" sectioned>
      <EmptyState
        heading="Points Balance Management"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View customer points balances, lifetime points, and account details.</p>
      </EmptyState>
    </Card>
  );

  const renderEarnPoints = () => (
    <Card title="Earning Rules" sectioned>
      <EmptyState
        heading="Points Earning Configuration"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Configure point earning rules for purchases, reviews, referrals, and more.</p>
      </EmptyState>
    </Card>
  );

  const renderSpendPoints = () => (
    <Card title="Points Spending" sectioned>
      <EmptyState
        heading="Points Redemption"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Manage point deductions and customer spending history.</p>
      </EmptyState>
    </Card>
  );

  const renderRewardsCatalog = () => (
    <Card title="Rewards Catalog" sectioned>
      <EmptyState
        heading="Rewards & Offers"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Browse and manage available rewards customers can redeem with points.</p>
      </EmptyState>
    </Card>
  );

  const renderRedemptions = () => (
    <Card title="Redemption Management" sectioned>
      <EmptyState
        heading="Reward Redemptions"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Track and fulfill customer reward redemptions.</p>
      </EmptyState>
    </Card>
  );

  const renderTransactions = () => (
    <Card title="Points Transaction History" sectioned>
      <EmptyState
        heading="Transaction Log"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View complete history of all points earned and redeemed.</p>
      </EmptyState>
    </Card>
  );

  const renderTransferPoints = () => (
    <Card title="Points Transfer" sectioned>
      <EmptyState
        heading="Transfer Points Between Customers"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Enable customers to transfer points to each other.</p>
      </EmptyState>
    </Card>
  );

  const renderPointsStats = () => (
    <Card title="Points Statistics" sectioned>
      <EmptyState
        heading="Points Program Analytics"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Comprehensive statistics on points issuance, redemption, and program health.</p>
      </EmptyState>
    </Card>
  );

  const renderTierOverview = () => (
    <Card title="Tier System Overview" sectioned>
      <EmptyState
        heading="Customer Tier Management"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Manage tier levels: Bronze, Silver, Gold, Platinum, Diamond.</p>
      </EmptyState>
    </Card>
  );

  const renderTierProgress = () => (
    <Card title="Tier Progress Tracking" sectioned>
      <EmptyState
        heading="Customer Tier Progression"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Track customer progress toward next tier levels.</p>
      </EmptyState>
    </Card>
  );

  const renderTierBenefits = () => (
    <Card title="Tier Benefits" sectioned>
      <EmptyState
        heading="Tier Perks & Rewards"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Configure benefits for each tier level.</p>
      </EmptyState>
    </Card>
  );

  const renderVIPSegments = () => (
    <Card title="VIP Segment Management" sectioned>
      <EmptyState
        heading="VIP Customer Segments"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Create and manage exclusive VIP customer segments.</p>
      </EmptyState>
    </Card>
  );

  const renderTierHistory = () => (
    <Card title="Tier Change History" sectioned>
      <EmptyState
        heading="Tier Upgrades & Downgrades"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View complete history of customer tier changes.</p>
      </EmptyState>
    </Card>
  );

  const renderTierStats = () => (
    <Card title="Tier Statistics" sectioned>
      <EmptyState
        heading="Tier Program Analytics"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Distribution and performance metrics across all tiers.</p>
      </EmptyState>
    </Card>
  );

  const renderReferralDashboard = () => (
    <Card title="Referral Program Dashboard" sectioned>
      <EmptyState
        heading="Referral Overview"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Track referral codes, conversions, and rewards.</p>
      </EmptyState>
    </Card>
  );

  const renderMyReferrals = () => (
    <Card title="My Referral Activity" sectioned>
      <EmptyState
        heading="Referral Tracking"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View all referrals sent and their status.</p>
      </EmptyState>
    </Card>
  );

  const renderReferralCampaigns = () => (
    <Card title="Referral Campaigns" sectioned>
      <EmptyState
        heading="Campaign Management"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Create and manage referral campaigns with tiered rewards.</p>
      </EmptyState>
    </Card>
  );

  const renderShareTools = () => (
    <Card title="Share Tools" sectioned>
      <EmptyState
        heading="Referral Sharing"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Share referral links via email, social media, and messaging.</p>
      </EmptyState>
    </Card>
  );

  const renderReferralStats = () => (
    <Card title="Referral Statistics" sectioned>
      <EmptyState
        heading="Referral Analytics"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Conversion rates, revenue tracking, and leaderboard.</p>
      </EmptyState>
    </Card>
  );

  const renderBadges = () => (
    <Card title="Badge Collection" sectioned>
      <EmptyState
        heading="Badges & Achievements"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Earn and display badges for accomplishments.</p>
      </EmptyState>
    </Card>
  );

  const renderChallenges = () => (
    <Card title="Active Challenges" sectioned>
      <EmptyState
        heading="Loyalty Challenges"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Participate in daily, weekly, and monthly challenges.</p>
      </EmptyState>
    </Card>
  );

  const renderAchievements = () => (
    <Card title="Achievement Tracking" sectioned>
      <EmptyState
        heading="Unlock Achievements"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Track progress toward milestone achievements.</p>
      </EmptyState>
    </Card>
  );

  const renderLeaderboard = () => (
    <Card title="Leaderboard Rankings" sectioned>
      <EmptyState
        heading="Top Members"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>See how you rank against other loyalty program members.</p>
      </EmptyState>
    </Card>
  );

  const renderCampaigns = () => (
    <Card title="Automated Campaigns" sectioned>
      <EmptyState
        heading="Campaign Automation"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Create welcome, birthday, and inactivity campaigns.</p>
      </EmptyState>
    </Card>
  );

  const renderTriggers = () => (
    <Card title="Event Triggers" sectioned>
      <EmptyState
        heading="Automated Triggers"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Set up triggers for customer events and actions.</p>
      </EmptyState>
    </Card>
  );

  const renderWorkflows = () => (
    <Card title="Workflow Management" sectioned>
      <EmptyState
        heading="Multi-Step Workflows"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Build complex automation workflows with conditions.</p>
      </EmptyState>
    </Card>
  );

  const renderSchedules = () => (
    <Card title="Scheduled Actions" sectioned>
      <EmptyState
        heading="Action Scheduling"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Schedule future points awards and notifications.</p>
      </EmptyState>
    </Card>
  );

  const renderAutomationStats = () => (
    <Card title="Automation Statistics" sectioned>
      <EmptyState
        heading="Automation Analytics"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Track campaign performance and workflow execution.</p>
      </EmptyState>
    </Card>
  );

  const renderActivityFeed = () => (
    <Card title="Activity Feed" sectioned>
      <EmptyState
        heading="Recent Activity"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View your recent loyalty program activity.</p>
      </EmptyState>
    </Card>
  );

  const renderPreferences = () => (
    <Card title="Notification Preferences" sectioned>
      <EmptyState
        heading="Manage Preferences"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Configure email, push, and SMS notification settings.</p>
      </EmptyState>
    </Card>
  );

  const renderMyRewards = () => (
    <Card title="My Saved Rewards" sectioned>
      <EmptyState
        heading="Saved Rewards"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View and manage your favorited rewards.</p>
      </EmptyState>
    </Card>
  );

  const renderMyReferralsPortal = () => (
    <Card title="My Referrals" sectioned>
      <EmptyState
        heading="Referral Management"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Track your referral code and friend signups.</p>
      </EmptyState>
    </Card>
  );

  const renderMyProgress = () => (
    <Card title="My Progress" sectioned>
      <EmptyState
        heading="Loyalty Journey"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View your tier progress, badges, and achievements.</p>
      </EmptyState>
    </Card>
  );

  const renderOverviewDashboard = () => (
    <Card title="Analytics Overview" sectioned>
      <EmptyState
        heading="Program Analytics"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Comprehensive metrics across all loyalty programs.</p>
      </EmptyState>
    </Card>
  );

  const renderMetrics = () => (
    <Card title="Key Metrics" sectioned>
      <EmptyState
        heading="Performance Metrics"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Track points, tiers, referrals, and engagement metrics.</p>
      </EmptyState>
    </Card>
  );

  const renderReports = () => (
    <Card title="Reports" sectioned>
      <EmptyState
        heading="Generate Reports"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Create executive summaries, financial, and engagement reports.</p>
      </EmptyState>
    </Card>
  );

  const renderInsights = () => (
    <Card title="AI Insights" sectioned>
      <EmptyState
        heading="Intelligent Insights"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>AI-generated insights and recommendations.</p>
      </EmptyState>
    </Card>
  );

  const renderCohortAnalysis = () => (
    <Card title="Cohort Analysis" sectioned>
      <EmptyState
        heading="Customer Cohorts"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Analyze customer segments and behavior patterns.</p>
      </EmptyState>
    </Card>
  );

  const renderPlatforms = () => (
    <Card title="Integration Platforms" sectioned>
      <EmptyState
        heading="Connected Platforms"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Connect Shopify, email, CRM, and payment platforms.</p>
      </EmptyState>
    </Card>
  );

  const renderWebhooks = () => (
    <Card title="Webhook Management" sectioned>
      <EmptyState
        heading="Webhook Configuration"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Configure webhooks for real-time event notifications.</p>
      </EmptyState>
    </Card>
  );

  const renderSyncLogs = () => (
    <Card title="Synchronization Logs" sectioned>
      <EmptyState
        heading="Integration Logs"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>View sync history and integration status.</p>
      </EmptyState>
    </Card>
  );

  const renderTabContent = () => {
    switch (selected) {
      // Points & Rewards
      case 0: return renderPointsBalance();
      case 1: return renderEarnPoints();
      case 2: return renderSpendPoints();
      case 3: return renderRewardsCatalog();
      case 4: return renderRedemptions();
      case 5: return renderTransactions();
      case 6: return renderTransferPoints();
      case 7: return renderPointsStats();
      
      // Tiers & VIP
      case 8: return renderTierOverview();
      case 9: return renderTierProgress();
      case 10: return renderTierBenefits();
      case 11: return renderVIPSegments();
      case 12: return renderTierHistory();
      case 13: return renderTierStats();
      
      // Referrals
      case 14: return renderReferralDashboard();
      case 15: return renderMyReferrals();
      case 16: return renderReferralCampaigns();
      case 17: return renderShareTools();
      case 18: return renderReferralStats();
      
      // Gamification
      case 19: return renderBadges();
      case 20: return renderChallenges();
      case 21: return renderAchievements();
      case 22: return renderLeaderboard();
      
      // Automation
      case 23: return renderCampaigns();
      case 24: return renderTriggers();
      case 25: return renderWorkflows();
      case 26: return renderSchedules();
      case 27: return renderAutomationStats();
      
      // Member Portal
      case 28: return renderDashboard();
      case 29: return renderActivityFeed();
      case 30: return renderPreferences();
      case 31: return renderMyRewards();
      case 32: return renderMyReferralsPortal();
      case 33: return renderMyProgress();
      
      // Analytics
      case 34: return renderOverviewDashboard();
      case 35: return renderMetrics();
      case 36: return renderReports();
      case 37: return renderInsights();
      case 38: return renderCohortAnalysis();
      
      // Integrations
      case 39: return renderPlatforms();
      case 40: return renderWebhooks();
      case 41: return renderSyncLogs();
      
      default: return renderDashboard();
    }
  };

  return (
    <Page
      title="Loyalty & Referral Program V2"
      subtitle="Enterprise loyalty program with points, tiers, referrals, gamification, and automation"
    >
      <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
        {renderTabContent()}
      </Tabs>
    </Page>
  );
}
