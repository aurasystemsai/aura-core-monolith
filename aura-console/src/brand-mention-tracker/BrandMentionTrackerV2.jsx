import { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Tabs,
  Badge,
  DataTable,
  Button,
  TextField,
  Select,
  RangeSlider,
  EmptyState,
  Banner,
  Stack,
  Text,
  ProgressBar,
  Icon
} from '@shopify/polaris';
import './BrandMentionTrackerV2.css';

const BrandMentionTrackerV2 = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/brand-mention-tracker/analytics/dashboard?period=week');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Main tabs
  const tabs = [
    { id: 'monitoring', content: 'Monitoring', badge: null },
    { id: 'sentiment', content: 'Sentiment', badge: null },
    { id: 'competitors', content: 'Competitors', badge: null },
    { id: 'influencers', content: 'Influencers', badge: null },
    { id: 'crisis', content: 'Crisis', badge: '!' },
    { id: 'analytics', content: 'Analytics', badge: null },
    { id: 'alerts', content: 'Alerts', badge: null },
    { id: 'response', content: 'Response', badge: null }
  ];

  // Dashboard stats
  const renderStats = () => {
    if (!dashboardData) return null;

    return (
      <div className="bmtv2-stats-grid">
        <Card>
          <div className="bmtv2-stat-card">
            <Text variant="headingSm" as="h3">Total Mentions</Text>
            <div className="bmtv2-stat-value">
              {dashboardData.mentions?.total?.toLocaleString() || 0}
            </div>
            <div className="bmtv2-stat-change positive">
              +{dashboardData.mentions?.growth || 0}% vs last period
            </div>
          </div>
        </Card>

        <Card>
          <div className="bmtv2-stat-card">
            <Text variant="headingSm" as="h3">Avg Sentiment</Text>
            <div className="bmtv2-stat-value sentiment">
              {dashboardData.sentiment?.average?.toFixed(2) || '0.00'}
            </div>
            <div className={`bmtv2-stat-change ${dashboardData.sentiment?.trend === 'stable' ? 'neutral' : 'positive'}`}>
              {dashboardData.sentiment?.trend || 'stable'}
            </div>
          </div>
        </Card>

        <Card>
          <div className="bmtv2-stat-card">
            <Text variant="headingSm" as="h3">Active Crises</Text>
            <div className="bmtv2-stat-value crisis">
              {dashboardData.crises?.active || 0}
            </div>
            <div className="bmtv2-stat-label">
              {dashboardData.crises?.critical || 0} critical
            </div>
          </div>
        </Card>

        <Card>
          <div className="bmtv2-stat-card">
            <Text variant="headingSm" as="h3">Total Reach</Text>
            <div className="bmtv2-stat-value">
              {(dashboardData.reach?.total / 1000000)?.toFixed(1) || 0}M
            </div>
            <div className="bmtv2-stat-label">
              Avg {(dashboardData.reach?.average / 1000)?.toFixed(1) || 0}K per mention
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Monitoring Section (6 tabs)
  const renderMonitoring = () => (
    <Tabs
      tabs={[
        { id: 'feed', content: 'Live Feed' },
        { id: 'search', content: 'Search' },
        { id: 'sources', content: 'Sources' },
        { id: 'filters', content: 'Filters' },
        { id: 'saved', content: 'Saved Searches' },
        { id: 'settings', content: 'Settings' }
      ]}
      selected={0}
    >
      <Card>
        <EmptyState
          heading="Live mention feed"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Real-time mentions from all configured sources will appear here</p>
        </EmptyState>
      </Card>
    </Tabs>
  );

  // Sentiment Section (5 tabs)
  const renderSentiment = () => (
    <Tabs
      tabs={[
        { id: 'overview', content: 'Overview' },
        { id: 'trends', content: 'Sentiment Trends' },
        { id: 'emotions', content: 'Emotion Analysis' },
        { id: 'tone', content: 'Tone Detection' },
        { id: 'wordcloud', content: 'Word Cloud' }
      ]}
      selected={0}
    >
      <Card>
        <div className="bmtv2-sentiment-gauge">
          <Text variant="headingMd" as="h2">Sentiment Score</Text>
          <div className="bmtv2-gauge-container">
            <div className="bmtv2-gauge-value">
              {dashboardData?.sentiment?.average?.toFixed(2) || '0.00'}
            </div>
            <ProgressBar progress={((dashboardData?.sentiment?.average || 0) + 1) * 50} />
          </div>
          <div className="bmtv2-sentiment-breakdown">
            <Badge status="success">Positive: {dashboardData?.sentiment?.positive || 0}</Badge>
            <Badge>Neutral: {dashboardData?.sentiment?.neutral || 0}</Badge>
            <Badge status="critical">Negative: {dashboardData?.sentiment?.negative || 0}</Badge>
          </div>
        </div>
      </Card>
    </Tabs>
  );

  // Competitors Section (5 tabs)
  const renderCompetitors = () => (
    <Tabs
      tabs={[
        { id: 'overview', content: 'Overview' },
        { id: 'sov', content: 'Share of Voice' },
        { id: 'sentiment', content: 'Sentiment' },
        { id: 'features', content: 'Feature Tracking' },
        { id: 'reports', content: 'Reports' }
      ]}
      selected={0}
    >
      <Card>
        <EmptyState
          heading="Competitor analysis"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Add competitors to track their brand mentions and compare performance</p>
          <Button primary>Add Competitor</Button>
        </EmptyState>
      </Card>
    </Tabs>
  );

  // Influencers Section (5 tabs)
  const renderInfluencers = () => (
    <Tabs
      tabs={[
        { id: 'discovery', content: 'Discovery' },
        { id: 'profiles', content: 'Profiles' },
        { id: 'engagement', content: 'Engagement' },
        { id: 'relationships', content: 'Relationships' },
        { id: 'outreach', content: 'Outreach' }
      ]}
      selected={0}
    >
      <Card>
        <div className="bmtv2-influencer-grid">
          <EmptyState
            heading="Influencer discovery"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Automatically identify and track influential voices mentioning your brand</p>
            <Button primary>Discover Influencers</Button>
          </EmptyState>
        </div>
      </Card>
    </Tabs>
  );

  // Crisis Section (5 tabs)
  const renderCrisis = () => (
    <Tabs
      tabs={[
        { id: 'detection', content: 'Detection' },
        { id: 'active', content: 'Active Crises' },
        { id: 'history', content: 'History' },
        { id: 'playbooks', content: 'Playbooks' },
        { id: 'settings', content: 'Settings' }
      ]}
      selected={0}
    >
      <Card>
        {dashboardData?.crises?.active > 0 ? (
          <Banner status="critical">
            <p>
              {dashboardData.crises.active} active crisis detected. Immediate action required.
            </p>
          </Banner>
        ) : (
          <Banner status="success">
            <p>No active crises detected. All mentions are within normal parameters.</p>
          </Banner>
        )}
      </Card>
    </Tabs>
  );

  // Analytics Section (6 tabs)
  const renderAnalytics = () => (
    <Tabs
      tabs={[
        { id: 'dashboard', content: 'Dashboard' },
        { id: 'trends', content: 'Trends' },
        { id: 'geography', content: 'Geography' },
        { id: 'sources', content: 'Sources' },
        { id: 'reports', content: 'Custom Reports' },
        { id: 'exports', content: 'Exports' }
      ]}
      selected={0}
    >
      <Layout>
        <Layout.Section>
          {renderStats()}
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Mention Volume Trend</Text>
            <div className="bmtv2-chart-placeholder">
              <p>Chart visualization would appear here</p>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Tabs>
  );

  // Alerts Section (5 tabs)
  const renderAlerts = () => (
    <Tabs
      tabs={[
        { id: 'rules', content: 'Rules' },
        { id: 'notifications', content: 'Notifications' },
        { id: 'history', content: 'History' },
        { id: 'channels', content: 'Channels' },
        { id: 'templates', content: 'Templates' }
      ]}
      selected={0}
    >
      <Card>
        <Stack vertical>
          <Text variant="headingMd" as="h2">Alert Rules</Text>
          <EmptyState
            heading="No alert rules configured"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Create rules to get notified about important brand mentions</p>
            <Button primary>Create Alert Rule</Button>
          </EmptyState>
        </Stack>
      </Card>
    </Tabs>
  );

  // Response Section (5 tabs)
  const renderResponse = () => (
    <Tabs
      tabs={[
        { id: 'queue', content: 'Queue' },
        { id: 'templates', content: 'Templates' },
        { id: 'collaboration', content: 'Collaboration' },
        { id: 'metrics', content: 'Metrics' },
        { id: 'automation', content: 'Automation' }
      ]}
      selected={0}
    >
      <Card>
        <Stack vertical>
          <Text variant="headingMd" as="h2">Response Queue</Text>
          <EmptyState
            heading="No pending responses"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Mentions requiring responses will appear here</p>
          </EmptyState>
        </Stack>
      </Card>
    </Tabs>
  );

  // Main render
  return (
    <Page
      title="Brand Mention Tracker V2"
      subtitle="Monitor, analyze, and respond to brand mentions across all channels"
    >
      <Layout>
        <Layout.Section>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
            {selectedTab === 0 && renderMonitoring()}
            {selectedTab === 1 && renderSentiment()}
            {selectedTab === 2 && renderCompetitors()}
            {selectedTab === 3 && renderInfluencers()}
            {selectedTab === 4 && renderCrisis()}
            {selectedTab === 5 && renderAnalytics()}
            {selectedTab === 6 && renderAlerts()}
            {selectedTab === 7 && renderResponse()}
          </Tabs>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default BrandMentionTrackerV2;
