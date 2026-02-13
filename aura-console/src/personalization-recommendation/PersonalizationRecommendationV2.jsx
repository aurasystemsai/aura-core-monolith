import React, { useState, useEffect, useCallback } from 'react';
import {
  Page, Layout, Card, Tabs, Button, DataTable, TextField, Select, Badge,
  Banner, EmptyState, Spinner, Modal, Stack, ButtonGroup, TextContainer,
  ProgressBar, ResourceList, ResourceItem, Icon, Thumbnail
} from '@shopify/polaris';
import {
  PersonMajor, AnalyticsMajor, SegmentMajor, ChartMajor, ProductMajor,
  ContentMajor, NotificationMajor, SettingsMajor
} from '@shopify/polaris-icons';
import './PersonalizationRecommendationV2.css';

export default function PersonalizationRecommendationV2() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ profiles: 0, recommendations: 0, campaigns: 0, models: 0 });
  
  // Data states
  const [profiles, setProfiles] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [models, setModels] = useState([]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/personalization-recommendation/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Tab definitions (42 tabs across 8 categories)
  const tabs = [
    // User Profiles (8 tabs)
    { id: 'profiles-list', content: 'Profiles List', group: 'profiles' },
    { id: 'profiles-create', content: 'Create Profile', group: 'profiles' },
    { id: 'profiles-preferences', content: 'Preferences', group: 'profiles' },
    { id: 'profiles-behavior', content: 'Behavior Analysis', group: 'profiles' },
    { id: 'profiles-segments', content: 'Profile Segments', group: 'profiles' },
    { id: 'profiles-history', content: 'Activity History', group: 'profiles' },
    { id: 'profiles-scoring', content: 'Profile Scoring', group: 'profiles' },
    { id: 'profiles-export', content: 'Export Profiles', group: 'profiles' },

    // Recommendations (7 tabs)
    { id: 'rec-generate', content: 'Generate Recommendations', group: 'recommendations' },
    { id: 'rec-list', content: 'Recommendations List', group: 'recommendations' },
    { id: 'rec-product', content: 'Product Recommendations', group: 'recommendations' },
    { id: 'rec-content', content: 'Content Recommendations', group: 'recommendations' },
    { id: 'rec-similar', content: 'Similar Items', group: 'recommendations' },
    { id: 'rec-trending', content: 'Trending Items', group: 'recommendations' },
    { id: 'rec-performance', content: 'Performance Analytics', group: 'recommendations' },

    // Personalization (6 tabs)
    { id: 'pers-web', content: 'Web Personalization', group: 'personalization' },
    { id: 'pers-email', content: 'Email Personalization', group: 'personalization' },
    { id: 'pers-mobile', content: 'Mobile Personalization', group: 'personalization' },
    { id: 'pers-dynamic', content: 'Dynamic Content', group: 'personalization' },
    { id: 'pers-ab-test', content: 'A/B Testing', group: 'personalization' },
    { id: 'pers-rules', content: 'Personalization Rules', group: 'personalization' },

    // Campaigns (6 tabs)
    { id: 'campaigns-list', content: 'Campaigns List', group: 'campaigns' },
    { id: 'campaigns-create', content: 'Create Campaign', group: 'campaigns' },
    { id: 'campaigns-targeting', content: 'Targeting', group: 'campaigns' },
    { id: 'campaigns-automation', content: 'Automation', group: 'campaigns' },
    { id: 'campaigns-performance', content: 'Performance', group: 'campaigns' },
    { id: 'campaigns-optimization', content: 'Optimization', group: 'campaigns' },

    // ML Models (5 tabs)
    { id: 'models-list', content: 'Models List', group: 'models' },
    { id: 'models-train', content: 'Train Models', group: 'models' },
    { id: 'models-collaborative', content: 'Collaborative Filtering', group: 'models' },
    { id: 'models-content-based', content: 'Content-Based', group: 'models' },
    { id: 'models-hybrid', content: 'Hybrid Models', group: 'models' },

    // Analytics (5 tabs)
    { id: 'analytics-dashboard', content: 'Dashboard', group: 'analytics' },
    { id: 'analytics-engagement', content: 'Engagement Metrics', group: 'analytics' },
    { id: 'analytics-conversion', content: 'Conversion Analytics', group: 'analytics' },
    { id: 'analytics-revenue', content: 'Revenue Impact', group: 'analytics' },
    { id: 'analytics-insights', content: 'AI Insights', group: 'analytics' },

    // Optimization (3 tabs)
    { id: 'opt-realtime', content: 'Real-time Optimization', group: 'optimization' },
    { id: 'opt-multivariate', content: 'Multivariate Testing', group: 'optimization' },
    { id: 'opt-bandit', content: 'Bandit Algorithms', group: 'optimization' },

    // Settings (2 tabs)
    { id: 'settings-config', content: 'Configuration', group: 'settings' },
    { id: 'settings-api', content: 'API & Integrations', group: 'settings' },
  ];

  const renderTabContent = () => {
    const tabId = tabs[selectedTab].id;

    switch (tabId) {
      // PROFILES
      case 'profiles-list':
        return <ProfilesList profiles={profiles} setProfiles={setProfiles} />;
      case 'profiles-create':
        return <CreateProfile setProfiles={setProfiles} />;
      case 'profiles-preferences':
        return <ProfilePreferences />;
      case 'profiles-behavior':
        return <BehaviorAnalysis />;
      case 'profiles-segments':
        return <ProfileSegments />;
      case 'profiles-history':
        return <ActivityHistory />;
      case 'profiles-scoring':
        return <ProfileScoring />;
      case 'profiles-export':
        return <ExportProfiles />;

      // RECOMMENDATIONS
      case 'rec-generate':
        return <GenerateRecommendations setRecommendations={setRecommendations} />;
      case 'rec-list':
        return <RecommendationsList recommendations={recommendations} />;
      case 'rec-product':
        return <ProductRecommendations />;
      case 'rec-content':
        return <ContentRecommendations />;
      case 'rec-similar':
        return <SimilarItems />;
      case 'rec-trending':
        return <TrendingItems />;
      case 'rec-performance':
        return <RecommendationPerformance />;

      // PERSONALIZATION
      case 'pers-web':
        return <WebPersonalization />;
      case 'pers-email':
        return <EmailPersonalization />;
      case 'pers-mobile':
        return <MobilePersonalization />;
      case 'pers-dynamic':
        return <DynamicContent />;
      case 'pers-ab-test':
        return <ABTesting />;
      case 'pers-rules':
        return <PersonalizationRules />;

      // CAMPAIGNS
      case 'campaigns-list':
        return <CampaignsList campaigns={campaigns} />;
      case 'campaigns-create':
        return <CreateCampaign setCampaigns={setCampaigns} />;
      case 'campaigns-targeting':
        return <CampaignTargeting />;
      case 'campaigns-automation':
        return <CampaignAutomation />;
      case 'campaigns-performance':
        return <CampaignPerformance />;
      case 'campaigns-optimization':
        return <CampaignOptimization />;

      // ML MODELS
      case 'models-list':
        return <ModelsList models={models} />;
      case 'models-train':
        return <TrainModels setModels={setModels} />;
      case 'models-collaborative':
        return <CollaborativeFiltering />;
      case 'models-content-based':
        return <ContentBased />;
      case 'models-hybrid':
        return <HybridModels />;

      // ANALYTICS
      case 'analytics-dashboard':
        return <AnalyticsDashboard />;
      case 'analytics-engagement':
        return <EngagementMetrics />;
      case 'analytics-conversion':
        return <ConversionAnalytics />;
      case 'analytics-revenue':
        return <RevenueImpact />;
      case 'analytics-insights':
        return <AIInsights />;

      // OPTIMIZATION
      case 'opt-realtime':
        return <RealtimeOptimization />;
      case 'opt-multivariate':
        return <MultivariateTest />;
      case 'opt-bandit':
        return <BanditAlgorithms />;

      // SETTINGS
      case 'settings-config':
        return <Configuration />;
      case 'settings-api':
        return <APIIntegrations />;

      default:
        return <EmptyState heading="Coming soon" />;
    }
  };

  return (
    <Page
      title="Personalization & Recommendation Engine V2"
      primaryAction={{
        content: 'Refresh Data',
        onAction: fetchStats,
      }}
      secondaryActions={[
        { content: 'Export Data', onAction: () => {} },
        { content: 'Settings', onAction: () => {} },
      ]}
    >
      <Layout>
        <Layout.Section>
          <div className="pers-stats-grid">
            <StatCard title="User Profiles" value={stats.profiles} icon={PersonMajor} />
            <StatCard title="Recommendations" value={stats.recommendations} icon={ProductMajor} />
            <StatCard title="Active Campaigns" value={stats.campaigns} icon={NotificationMajor} />
            <StatCard title="ML Models" value={stats.models} icon={ChartMajor} />
          </div>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Card.Section>
                {loading ? <Spinner /> : renderTabContent()}
              </Card.Section>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ title, value, icon }) {
  return (
    <Card sectioned>
      <div className="stat-card">
        <div className="stat-icon">
          <Icon source={icon} color="base" />
        </div>
        <div className="stat-content">
          <p className="stat-value">{value.toLocaleString()}</p>
          <p className="stat-title">{title}</p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// PROFILES COMPONENTS
// ============================================================================

function ProfilesList({ profiles, setProfiles }) {
  useEffect(() => {
    fetch('/api/personalization-recommendation/profiles?limit=50')
      .then(res => res.json())
      .then(data => data.success && setProfiles(data.profiles || []));
  }, [setProfiles]);

  const rows = profiles.map(p => [
    p.id,
    p.email || 'N/A',
    <Badge status={p.segment === 'vip' ? 'success' : 'info'}>{p.segment}</Badge>,
    p.totalInteractions || 0,
    new Date(p.createdAt).toLocaleDateString(),
  ]);

  return (
    <DataTable
      columnContentTypes={['text', 'text', 'text', 'numeric', 'text']}
      headings={['Profile ID', 'Email', 'Segment', 'Interactions', 'Created']}
      rows={rows}
    />
  );
}

function CreateProfile({ setProfiles }) {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');

  const handleCreate = async () => {
    const response = await fetch('/api/personalization-recommendation/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId }),
    });
    const data = await response.json();
    if (data.success) {
      setProfiles(prev => [...prev, data.profile]);
      setEmail('');
      setUserId('');
    }
  };

  return (
    <Stack vertical>
      <TextField label="Email" value={email} onChange={setEmail} />
      <TextField label="User ID" value={userId} onChange={setUserId} />
      <Button primary onClick={handleCreate}>Create Profile</Button>
    </Stack>
  );
}

function ProfilePreferences() {
  return <Banner title="Profile Preferences" status="info">Manage user preferences and opt-in/opt-out settings</Banner>;
}

function BehaviorAnalysis() {
  return <Banner title="Behavior Analysis" status="info">View behavioral patterns and interaction analytics</Banner>;
}

function ProfileSegments() {
  return <Banner title="Profile Segments" status="info">Segment users based on behavior and preferences</Banner>;
}

function ActivityHistory() {
  return <Banner title="Activity History" status="info">Track user activity timeline and engagement history</Banner>;
}

function ProfileScoring() {
  return <Banner title="Profile Scoring" status="info">AI-powered profile scoring for engagement prediction</Banner>;
}

function ExportProfiles() {
  return <Banner title="Export Profiles" status="info">Export profile data in CSV, JSON formats</Banner>;
}

// ============================================================================
// RECOMMENDATIONS COMPONENTS
// ============================================================================

function GenerateRecommendations({ setRecommendations }) {
  const [userId, setUserId] = useState('');
  const [method, setMethod] = useState('collaborative');

  const handleGenerate = async () => {
    const response = await fetch('/api/personalization-recommendation/recommendations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, method }),
    });
    const data = await response.json();
    if (data.success) {
      setRecommendations(data.recommendations || []);
    }
  };

  return (
    <Stack vertical>
      <TextField label="User ID" value={userId} onChange={setUserId} />
      <Select
        label="Recommendation Method"
        options={[
          { label: 'Collaborative Filtering', value: 'collaborative' },
          { label: 'Content-Based', value: 'content_based' },
          { label: 'Hybrid', value: 'hybrid' },
        ]}
        value={method}
        onChange={setMethod}
      />
      <Button primary onClick={handleGenerate}>Generate Recommendations</Button>
    </Stack>
  );
}

function RecommendationsList({ recommendations }) {
  const rows = recommendations.map(r => [
    r.itemId,
    r.title || 'Untitled',
    r.score.toFixed(2),
    r.method,
    <Badge>{r.category}</Badge>,
  ]);

  return (
    <DataTable
      columnContentTypes={['text', 'text', 'numeric', 'text', 'text']}
      headings={['Item ID', 'Title', 'Score', 'Method', 'Category']}
      rows={rows}
    />
  );
}

function ProductRecommendations() {
  return <Banner title="Product Recommendations" status="info">Generate personalized product recommendations</Banner>;
}

function ContentRecommendations() {
  return <Banner title="Content Recommendations" status="info">Recommend blog posts, articles, videos based on interests</Banner>;
}

function SimilarItems() {
  return <Banner title="Similar Items" status="info">Find similar products using collaborative and content-based filtering</Banner>;
}

function TrendingItems() {
  return <Banner title="Trending Items" status="info">Display real-time trending products and content</Banner>;
}

function RecommendationPerformance() {
  return <Banner title="Recommendation Performance" status="info">Track CTR, conversion rates, and revenue impact</Banner>;
}

// ============================================================================
// PERSONALIZATION COMPONENTS
// ============================================================================

function WebPersonalization() {
  return <Banner title="Web Personalization" status="info">Personalize website content, banners, CTAs based on user segments</Banner>;
}

function EmailPersonalization() {
  return <Banner title="Email Personalization" status="info">Personalize email subject lines, content, product recommendations</Banner>;
}

function MobilePersonalization() {
  return <Banner title="Mobile Personalization" status="info">Customize mobile app experience for each user</Banner>;
}

function DynamicContent() {
  return <Banner title="Dynamic Content" status="info">Create dynamic content blocks that adapt to user behavior</Banner>;
}

function ABTesting() {
  return <Banner title="A/B Testing" status="info">Test personalization variants for optimal performance</Banner>;
}

function PersonalizationRules() {
  return <Banner title="Personalization Rules" status="info">Define rules and conditions for content personalization</Banner>;
}

// ============================================================================
// CAMPAIGNS COMPONENTS
// ============================================================================

function CampaignsList({ campaigns }) {
  useEffect(() => {
    fetch('/api/personalization-recommendation/campaigns?limit=50')
      .then(res => res.json())
      .then(data => data.success && campaigns.length === 0);
  }, [campaigns]);

  return <Banner title="Campaigns List" status="info">View and manage personalization campaigns</Banner>;
}

function CreateCampaign({ setCampaigns }) {
  return <Banner title="Create Campaign" status="info">Launch new personalization and recommendation campaigns</Banner>;
}

function CampaignTargeting() {
  return <Banner title="Campaign Targeting" status="info">Define audience targeting criteria for campaigns</Banner>;
}

function CampaignAutomation() {
  return <Banner title="Campaign Automation" status="info">Automate campaign triggers and delivery workflows</Banner>;
}

function CampaignPerformance() {
  return <Banner title="Campaign Performance" status="info">Monitor campaign KPIs and ROI metrics</Banner>;
}

function CampaignOptimization() {
  return <Banner title="Campaign Optimization" status="info">AI-powered campaign optimization recommendations</Banner>;
}

// ============================================================================
// ML MODELS COMPONENTS
// ============================================================================

function ModelsList({ models }) {
  return <Banner title="ML Models List" status="info">View all recommendation and personalization models</Banner>;
}

function TrainModels({ setModels }) {
  return <Banner title="Train Models" status="info">Train and retrain ML models with latest user data</Banner>;
}

function CollaborativeFiltering() {
  return <Banner title="Collaborative Filtering" status="info">User-based and item-based collaborative filtering models</Banner>;
}

function ContentBased() {
  return <Banner title="Content-Based Filtering" status="info">Recommend items based on content similarity and attributes</Banner>;
}

function HybridModels() {
  return <Banner title="Hybrid Models" status="info">Combine multiple recommendation approaches for best results</Banner>;
}

// ============================================================================
// ANALYTICS COMPONENTS
// ============================================================================

function AnalyticsDashboard() {
  return <Banner title="Analytics Dashboard" status="info">Comprehensive analytics overview with key metrics</Banner>;
}

function EngagementMetrics() {
  return <Banner title="Engagement Metrics" status="info">Track user engagement, click-through rates, time spent</Banner>;
}

function ConversionAnalytics() {
  return <Banner title="Conversion Analytics" status="info">Measure conversion rates from recommendations</Banner>;
}

function RevenueImpact() {
  return <Banner title="Revenue Impact" status="info">Calculate revenue attributed to personalization</Banner>;
}

function AIInsights() {
  return <Banner title="AI Insights" status="info">AI-generated insights and optimization recommendations</Banner>;
}

// ============================================================================
// OPTIMIZATION COMPONENTS
// ============================================================================

function RealtimeOptimization() {
  return <Banner title="Real-time Optimization" status="info">Optimize recommendations in real-time based on user behavior</Banner>;
}

function MultivariateTest() {
  return <Banner title="Multivariate Testing" status="info">Test multiple personalization variables simultaneously</Banner>;
}

function BanditAlgorithms() {
  return <Banner title="Bandit Algorithms" status="info">Multi-armed bandit algorithms for exploration vs exploitation</Banner>;
}

// ============================================================================
// SETTINGS COMPONENTS
// ============================================================================

function Configuration() {
  return <Banner title="Configuration" status="info">Configure personalization engine settings and parameters</Banner>;
}

function APIIntegrations() {
  return <Banner title="API & Integrations" status="info">Manage API keys and third-party integrations</Banner>;
}
