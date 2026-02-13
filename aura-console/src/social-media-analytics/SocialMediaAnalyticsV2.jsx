import React, { useState, useEffect } from 'react';
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
  EmptyState,
  Banner,
  Stack,
  Text,
  ProgressBar,
  Icon,
  ButtonGroup
} from '@shopify/polaris';
import {
  AnalyticsMajor,
  ContentMajor,
  CustomersMajor,
  ConversationMinor,
  HashtagMajor,
  CalendarMajor,
  TargetMajor,
  CompetitorMajor
} from '@shopify/polaris-icons';
import './SocialMediaAnalyticsV2.css';

export default function SocialMediaAnalyticsV2() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSubTab, setSelectedSubTab] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setDashboardData({
        platforms: { connected: 7, health: 85 },
        content: { posts: 1250, avgScore: 72 },
        audience: { total: 245000, growth: 12.5 },
        engagement: { rate: 4.8, strategies: 12 },
        hashtags: { tracked: 45, trending: 8 },
        publishing: { scheduled: 38, queued: 120 },
        campaigns: { active: 5, roi: 245 },
        competitors: { tracked: 15, position: 3 }
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Platform Analytics Tabs (6 tabs)
  const platformTabs = [
    { id: 'accounts', content: 'Accounts', badge: dashboardData?.platforms.connected },
    { id: 'metrics', content: 'Metrics' },
    { id: 'health', content: 'Health', badge: `${dashboardData?.platforms.health}%` },
    { id: 'growth', content: 'Growth' },
    { id: 'reports', content: 'Reports' },
    { id: 'settings', content: 'Settings' }
  ];

  // Content Performance Tabs (5 tabs)
  const contentTabs = [
    { id: 'posts', content: 'Posts', badge: dashboardData?.content.posts },
    { id: 'performance', content: 'Performance' },
    { id: 'best-times', content: 'Best Times' },
    { id: 'top-content', content: 'Top Content' },
    { id: 'type-analysis', content: 'Type Analysis' }
  ];

  // Audience Analytics Tabs (5 tabs)
  const audienceTabs = [
    { id: 'profiles', content: 'Profiles' },
    { id: 'demographics', content: 'Demographics' },
    { id: 'interests', content: 'Interests' },
    { id: 'behavior', content: 'Behavior' },
    { id: 'segments', content: 'Segments' }
  ];

  // Engagement Optimization Tabs (5 tabs)
  const engagementTabs = [
    { id: 'strategies', content: 'Strategies', badge: dashboardData?.engagement.strategies },
    { id: 'tactics', content: 'Tactics' },
    { id: 'ab-tests', content: 'A/B Tests' },
    { id: 'community', content: 'Community' },
    { id: 'campaigns', content: 'Campaigns' }
  ];

  // Hashtag & Trends Tabs (5 tabs)
  const hashtagTabs = [
    { id: 'tracked', content: 'Tracked', badge: dashboardData?.hashtags.tracked },
    { id: 'trending', content: 'Trending', badge: dashboardData?.hashtags.trending },
    { id: 'trends', content: 'Trends' },
    { id: 'suggestions', content: 'Suggestions' },
    { id: 'leaderboard', content: 'Leaderboard' }
  ];

  // Publishing & Scheduling Tabs (6 tabs)
  const publishingTabs = [
    { id: 'schedule', content: 'Schedule', badge: dashboardData?.publishing.scheduled },
    { id: 'queue', content: 'Queue', badge: dashboardData?.publishing.queued },
    { id: 'rules', content: 'Rules' },
    { id: 'calendar', content: 'Calendar' },
    { id: 'best-times', content: 'Best Times' },
    { id: 'bulk', content: 'Bulk Schedule' }
  ];

  // Campaign Analytics Tabs (5 tabs)
  const campaignTabs = [
    { id: 'overview', content: 'Overview' },
    { id: 'active', content: 'Active', badge: dashboardData?.campaigns.active },
    { id: 'roi', content: 'ROI Analysis' },
    { id: 'attribution', content: 'Attribution' },
    { id: 'goals', content: 'Goals' }
  ];

  // Competitor Benchmarking Tabs (5 tabs)
  const competitorTabs = [
    { id: 'list', content: 'List', badge: dashboardData?.competitors.tracked },
    { id: 'metrics', content: 'Metrics' },
    { id: 'benchmarks', content: 'Benchmarks' },
    { id: 'position', content: 'Market Position' },
    { id: 'insights', content: 'Insights' }
  ];

  const mainTabs = [
    {
      id: 'platforms',
      content: (
        <span className="tab-with-icon">
          <Icon source={AnalyticsMajor} />
          Platforms
        </span>
      ),
      subTabs: platformTabs
    },
    {
      id: 'content',
      content: (
        <span className="tab-with-icon">
          <Icon source={ContentMajor} />
          Content
        </span>
      ),
      subTabs: contentTabs
    },
    {
      id: 'audience',
      content: (
        <span className="tab-with-icon">
          <Icon source={CustomersMajor} />
          Audience
        </span>
      ),
      subTabs: audienceTabs
    },
    {
      id: 'engagement',
      content: (
        <span className="tab-with-icon">
          <Icon source={ConversationMinor} />
          Engagement
        </span>
      ),
      subTabs: engagementTabs
    },
    {
      id: 'hashtags',
      content: (
        <span className="tab-with-icon">
          <Icon source={HashtagMajor} />
          Hashtags
        </span>
      ),
      subTabs: hashtagTabs
    },
    {
      id: 'publishing',
      content: (
        <span className="tab-with-icon">
          <Icon source={CalendarMajor} />
          Publishing
        </span>
      ),
      subTabs: publishingTabs
    },
    {
      id: 'campaigns',
      content: (
        <span className="tab-with-icon">
          <Icon source={TargetMajor} />
          Campaigns
        </span>
      ),
      subTabs: campaignTabs
    },
    {
      id: 'competitors',
      content: (
        <span className="tab-with-icon">
          <Icon source={CompetitorMajor} />
          Competitors
        </span>
      ),
      subTabs: competitorTabs
    }
  ];

  const renderPlatformContent = (subTabId) => {
    switch (subTabId) {
      case 'accounts':
        return (
          <Card title="Connected Platforms" sectioned>
            <div className="platform-accounts-grid">
              {['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest'].map(platform => (
                <div key={platform} className={`platform-card platform-${platform.toLowerCase()}`}>
                  <div className="platform-header">
                    <Text variant="headingMd" as="h3">{platform}</Text>
                    <Badge status="success">Connected</Badge>
                  </div>
                  <div className="platform-stats">
                    <div className="stat">
                      <Text variant="bodyMd" color="subdued">Followers</Text>
                      <Text variant="headingSm" as="p">125.4K</Text>
                    </div>
                    <div className="stat">
                      <Text variant="bodyMd" color="subdued">Health</Text>
                      <Text variant="headingSm" as="p">85%</Text>
                    </div>
                  </div>
                  <Button fullWidth>Manage Account</Button>
                </div>
              ))}
            </div>
          </Card>
        );
      case 'metrics':
        return (
          <Card title="Platform Metrics" sectioned>
            <EmptyState
              heading="Platform metrics will appear here"
              action={{ content: 'Sync Metrics', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>View detailed performance metrics across all connected platforms</p>
            </EmptyState>
          </Card>
        );
      case 'health':
        return (
          <Card title="Account Health Score" sectioned>
            <div className="health-score-container">
              <div className="health-score-circle">
                <Text variant="heading2xl" as="h2">85%</Text>
                <Badge status="success">Excellent</Badge>
              </div>
              <div className="health-factors">
                <div className="health-factor">
                  <Text variant="bodyMd">Engagement Rate</Text>
                  <ProgressBar progress={75} size="small" />
                  <Text variant="bodySm" color="subdued">30/30 pts</Text>
                </div>
                <div className="health-factor">
                  <Text variant="bodyMd">Growth Rate</Text>
                  <ProgressBar progress={80} size="small" />
                  <Text variant="bodySm" color="subdued">20/25 pts</Text>
                </div>
                <div className="health-factor">
                  <Text variant="bodyMd">Posting Consistency</Text>
                  <ProgressBar progress={90} size="small" />
                  <Text variant="bodySm" color="subdued">18/20 pts</Text>
                </div>
              </div>
            </div>
          </Card>
        );
      case 'growth':
        return (
          <Card title="Growth Trends" sectioned>
            <EmptyState
              heading="Growth analytics coming soon"
              action={{ content: 'View Snapshots', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Track follower growth, engagement trends, and performance over time</p>
            </EmptyState>
          </Card>
        );
      case 'reports':
        return (
          <Card title="Performance Reports" sectioned>
            <EmptyState
              heading="Generate your first report"
              action={{ content: 'Create Report', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create detailed performance reports with insights and recommendations</p>
            </EmptyState>
          </Card>
        );
      case 'settings':
        return (
          <Card title="Platform Settings" sectioned>
            <EmptyState
              heading="Configure platform settings"
              action={{ content: 'Edit Settings', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Manage sync schedules, notifications, and platform preferences</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderContentPerformanceContent = (subTabId) => {
    switch (subTabId) {
      case 'posts':
        return (
          <Card title="Content Posts" sectioned>
            <EmptyState
              heading="Track your social media content"
              action={{ content: 'Add Post', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Monitor performance of all your posts across platforms</p>
            </EmptyState>
          </Card>
        );
      case 'performance':
        return (
          <Card title="Content Performance Analysis" sectioned>
            <div className="performance-stats-grid">
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Average Score</Text>
                <Text variant="heading2xl" as="h2">72</Text>
                <Badge status="success">Good</Badge>
              </div>
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Viral Content</Text>
                <Text variant="heading2xl" as="h2">23</Text>
                <Text variant="bodySm" color="subdued">Score &gt; 80</Text>
              </div>
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Avg Engagement</Text>
                <Text variant="heading2xl" as="h2">4.8%</Text>
                <Text variant="bodySm" color="subdued">+0.5% vs baseline</Text>
              </div>
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Total Reach</Text>
                <Text variant="heading2xl" as="h2">1.2M</Text>
                <Text variant="bodySm" color="subdued">Last 30 days</Text>
              </div>
            </div>
          </Card>
        );
      case 'best-times':
        return (
          <Card title="Best Time to Post" sectioned>
            <EmptyState
              heading="Discover optimal posting times"
              action={{ content: 'Analyze Now', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>AI-powered analysis of when your audience is most engaged</p>
            </EmptyState>
          </Card>
        );
      case 'top-content':
        return (
          <Card title="Top Performing Content" sectioned>
            <EmptyState
              heading="View your best performing posts"
              action={{ content: 'View Leaderboard', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Identify what content resonates most with your audience</p>
            </EmptyState>
          </Card>
        );
      case 'type-analysis':
        return (
          <Card title="Content Type Performance" sectioned>
            <EmptyState
              heading="Analyze performance by content type"
              action={{ content: 'View Analysis', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Compare how different content formats perform (videos, images, carousels)</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderAudienceContent = (subTabId) => {
    switch (subTabId) {
      case 'profiles':
        return (
          <Card title="Audience Profiles" sectioned>
            <EmptyState
              heading="Create audience profiles"
              action={{ content: 'Create Profile', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Build detailed profiles of your audience segments</p>
            </EmptyState>
          </Card>
        );
      case 'demographics':
        return (
          <Card title="Audience Demographics" sectioned>
            <div className="demographics-grid">
              <div className="demographic-card">
                <Text variant="headingMd" as="h3">Age Groups</Text>
                <div className="demographic-breakdown">
                  <div className="demographic-bar">
                    <Text variant="bodySm">18-24</Text>
                    <ProgressBar progress={35} />
                    <Text variant="bodySm">35%</Text>
                  </div>
                  <div className="demographic-bar">
                    <Text variant="bodySm">25-34</Text>
                    <ProgressBar progress={42} />
                    <Text variant="bodySm">42%</Text>
                  </div>
                  <div className="demographic-bar">
                    <Text variant="bodySm">35-44</Text>
                    <ProgressBar progress={15} />
                    <Text variant="bodySm">15%</Text>
                  </div>
                </div>
              </div>
              <div className="demographic-card">
                <Text variant="headingMd" as="h3">Gender Split</Text>
                <div className="gender-chart">
                  <div className="gender-stat">
                    <Text variant="heading2xl">48%</Text>
                    <Text variant="bodySm" color="subdued">Male</Text>
                  </div>
                  <div className="gender-stat">
                    <Text variant="heading2xl">51%</Text>
                    <Text variant="bodySm" color="subdued">Female</Text>
                  </div>
                  <div className="gender-stat">
                    <Text variant="heading2xl">1%</Text>
                    <Text variant="bodySm" color="subdued">Other</Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      case 'interests':
        return (
          <Card title="Audience Interests" sectioned>
            <EmptyState
              heading="Discover audience interests"
              action={{ content: 'Analyze Interests', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Understand what topics and categories your audience cares about</p>
            </EmptyState>
          </Card>
        );
      case 'behavior':
        return (
          <Card title="Behavior Patterns" sectioned>
            <EmptyState
              heading="Analyze audience behavior"
              action={{ content: 'Track Patterns', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Learn when and how your audience engages with your content</p>
            </EmptyState>
          </Card>
        );
      case 'segments':
        return (
          <Card title="Audience Segments" sectioned>
            <EmptyState
              heading="Segment your audience"
              action={{ content: 'Create Segment', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Group audiences by growth patterns, engagement, and characteristics</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderEngagementContent = (subTabId) => {
    switch (subTabId) {
      case 'strategies':
        return (
          <Card title="Engagement Strategies" sectioned>
            <EmptyState
              heading="Create engagement strategies"
              action={{ content: 'New Strategy', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Build strategies to increase comments, shares, and community engagement</p>
            </EmptyState>
          </Card>
        );
      case 'tactics':
        return (
          <Card title="Response Tactics" sectioned>
            <EmptyState
              heading="Automate your responses"
              action={{ content: 'Create Tactic', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Set up automated response tactics for comments, mentions, and questions</p>
            </EmptyState>
          </Card>
        );
      case 'ab-tests':
        return (
          <Card title="A/B Testing" sectioned>
            <EmptyState
              heading="Test your engagement tactics"
              action={{ content: 'Create A/B Test', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Run experiments to optimize your social media strategy</p>
            </EmptyState>
          </Card>
        );
      case 'community':
        return (
          <Card title="Community Metrics" sectioned>
            <div className="community-health-container">
              <div className="community-score">
                <Text variant="heading2xl" as="h2">Health Score</Text>
                <Text variant="heading3xl" as="h1">78</Text>
                <Badge status="success">Healthy</Badge>
              </div>
              <div className="community-breakdown">
                <div className="community-segment">
                  <Text variant="bodyMd">Super Fans (1%)</Text>
                  <ProgressBar progress={1} />
                  <Text variant="bodySm" color="subdued">2,450 members</Text>
                </div>
                <div className="community-segment">
                  <Text variant="bodyMd">Highly Engaged (9%)</Text>
                  <ProgressBar progress={9} />
                  <Text variant="bodySm" color="subdued">22,050 members</Text>
                </div>
                <div className="community-segment">
                  <Text variant="bodyMd">Occasional Engagers (40%)</Text>
                  <ProgressBar progress={40} />
                  <Text variant="bodySm" color="subdued">98,000 members</Text>
                </div>
              </div>
            </div>
          </Card>
        );
      case 'campaigns':
        return (
          <Card title="Engagement Campaigns" sectioned>
            <EmptyState
              heading="Launch engagement campaigns"
              action={{ content: 'New Campaign', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create contests, challenges, and UGC campaigns to boost engagement</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderHashtagContent = (subTabId) => {
    switch (subTabId) {
      case 'tracked':
        return (
          <Card title="Tracked Hashtags" sectioned>
            <EmptyState
              heading="Start tracking hashtags"
              action={{ content: 'Track Hashtag', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Monitor performance of hashtags across your campaigns</p>
            </EmptyState>
          </Card>
        );
      case 'trending':
        return (
          <Card title="Trending Hashtags" sectioned>
            <EmptyState
              heading="Discover trending topics"
              action={{ content: 'Discover Trends', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Find trending hashtags relevant to your audience and industry</p>
            </EmptyState>
          </Card>
        );
      case 'trends':
        return (
          <Card title="Trend Analysis" sectioned>
            <EmptyState
              heading="Analyze trending topics"
              action={{ content: 'Analyze Trends', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Deep dive into trending topics with timeline, sentiment, and influencer analysis</p>
            </EmptyState>
          </Card>
        );
      case 'suggestions':
        return (
          <Card title="Hashtag Suggestions" sectioned>
            <EmptyState
              heading="Get AI-powered hashtag suggestions"
              action={{ content: 'Get Suggestions', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Receive personalized hashtag recommendations based on your content</p>
            </EmptyState>
          </Card>
        );
      case 'leaderboard':
        return (
          <Card title="Hashtag Leaderboard" sectioned>
            <EmptyState
              heading="View top performing hashtags"
              action={{ content: 'View Leaderboard', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>See which hashtags drive the most reach and engagement</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderPublishingContent = (subTabId) => {
    switch (subTabId) {
      case 'schedule':
        return (
          <Card title="Scheduled Posts" sectioned>
            <EmptyState
              heading="Schedule your first post"
              action={{ content: 'Schedule Post', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Plan and schedule posts across all your social media platforms</p>
            </EmptyState>
          </Card>
        );
      case 'queue':
        return (
          <Card title="Content Queues" sectioned>
            <EmptyState
              heading="Create content queues"
              action={{ content: 'Create Queue', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Build queues that automatically publish content at optimal times</p>
            </EmptyState>
          </Card>
        );
      case 'rules':
        return (
          <Card title="Publishing Rules" sectioned>
            <EmptyState
              heading="Automate with publishing rules"
              action={{ content: 'Create Rule', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Set up rules to automatically schedule or hold content based on conditions</p>
            </EmptyState>
          </Card>
        );
      case 'calendar':
        return (
          <Card title="Content Calendar" sectioned>
            <EmptyState
              heading="View your content calendar"
              action={{ content: 'Open Calendar', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Visualize all scheduled content in a calendar view</p>
            </EmptyState>
          </Card>
        );
      case 'best-times':
        return (
          <Card title="Best Posting Times" sectioned>
            <EmptyState
              heading="Find optimal posting times"
              action={{ content: 'Analyze Times', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Discover when your audience is most active for each platform</p>
            </EmptyState>
          </Card>
        );
      case 'bulk':
        return (
          <Card title="Bulk Schedule" sectioned>
            <EmptyState
              heading="Schedule multiple posts at once"
              action={{ content: 'Bulk Upload', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Upload and schedule multiple posts in one go</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderCampaignContent = (subTabId) => {
    switch (subTabId) {
      case 'overview':
        return (
          <Card title="Campaign Overview" sectioned>
            <div className="campaign-stats-grid">
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Active Campaigns</Text>
                <Text variant="heading2xl" as="h2">5</Text>
                <Badge status="success">Running</Badge>
              </div>
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Total ROI</Text>
                <Text variant="heading2xl" as="h2">245%</Text>
                <Text variant="bodySm" color="subdued">+45% vs last month</Text>
              </div>
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Budget Spent</Text>
                <Text variant="heading2xl" as="h2">$12.5K</Text>
                <Text variant="bodySm" color="subdued">62.5% of budget</Text>
              </div>
              <div className="stat-card">
                <Text variant="bodyMd" color="subdued">Conversions</Text>
                <Text variant="heading2xl" as="h2">1,234</Text>
                <Text variant="bodySm" color="subdued">3.2% conversion rate</Text>
              </div>
            </div>
          </Card>
        );
      case 'active':
        return (
          <Card title="Active Campaigns" sectioned>
            <EmptyState
              heading="Create your first campaign"
              action={{ content: 'New Campaign', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Launch campaigns to drive awareness, engagement, or conversions</p>
            </EmptyState>
          </Card>
        );
      case 'roi':
        return (
          <Card title="ROI Analysis" sectioned>
            <EmptyState
              heading="Analyze campaign ROI"
              action={{ content: 'View Analysis', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Deep dive into ROI, ROAS, and profitability metrics</p>
            </EmptyState>
          </Card>
        );
      case 'attribution':
        return (
          <Card title="Attribution Analysis" sectioned>
            <EmptyState
              heading="Track conversion attribution"
              action={{ content: 'View Attribution', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Analyze touchpoints with multiple attribution models</p>
            </EmptyState>
          </Card>
        );
      case 'goals':
        return (
          <Card title="Campaign Goals" sectioned>
            <EmptyState
              heading="Set campaign goals"
              action={{ content: 'Create Goal', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Define and track progress toward campaign objectives</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderCompetitorContent = (subTabId) => {
    switch (subTabId) {
      case 'list':
        return (
          <Card title="Competitors" sectioned>
            <EmptyState
              heading="Track your competitors"
              action={{ content: 'Add Competitor', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Monitor competitor performance across social platforms</p>
            </EmptyState>
          </Card>
        );
      case 'metrics':
        return (
          <Card title="Competitor Metrics" sectioned>
            <EmptyState
              heading="Track competitor metrics"
              action={{ content: 'Update Metrics', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Monitor followers, engagement, and posting frequency</p>
            </EmptyState>
          </Card>
        );
      case 'benchmarks':
        return (
          <Card title="Benchmarking" sectioned>
            <EmptyState
              heading="Benchmark your performance"
              action={{ content: 'Create Benchmark', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Compare your metrics against competitors and industry averages</p>
            </EmptyState>
          </Card>
        );
      case 'position':
        return (
          <Card title="Market Position" sectioned>
            <EmptyState
              heading="Analyze your market position"
              action={{ content: 'Analyze Position', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>See where you stand with SWOT analysis and competitive insights</p>
            </EmptyState>
          </Card>
        );
      case 'insights':
        return (
          <Card title="Competitive Insights" sectioned>
            <EmptyState
              heading="Get competitive insights"
              action={{ content: 'Generate Insights', onAction: () => {} }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Discover opportunities and threats in your competitive landscape</p>
            </EmptyState>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderSubTabContent = () => {
    const currentMainTab = mainTabs[selectedTab];
    const currentSubTab = selectedSubTab[currentMainTab.id] || 0;
    const subTabId = currentMainTab.subTabs[currentSubTab].id;

    switch (currentMainTab.id) {
      case 'platforms':
        return renderPlatformContent(subTabId);
      case 'content':
        return renderContentPerformanceContent(subTabId);
      case 'audience':
        return renderAudienceContent(subTabId);
      case 'engagement':
        return renderEngagementContent(subTabId);
      case 'hashtags':
        return renderHashtagContent(subTabId);
      case 'publishing':
        return renderPublishingContent(subTabId);
      case 'campaigns':
        return renderCampaignContent(subTabId);
      case 'competitors':
        return renderCompetitorContent(subTabId);
      default:
        return null;
    }
  };

  const handleSubTabChange = (index) => {
    const currentMainTab = mainTabs[selectedTab];
    setSelectedSubTab({
      ...selectedSubTab,
      [currentMainTab.id]: index
    });
  };

  if (loading) {
    return (
      <Page title="Social Media Analytics & Listening V2">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Stack vertical spacing="loose">
                <Text variant="bodyMd">Loading dashboard...</Text>
                <ProgressBar progress={75} />
              </Stack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Social Media Analytics & Listening V2"
      subtitle="Enterprise social media management with comprehensive analytics"
    >
      <Layout>
        <Layout.Section>
          <Banner status="info">
            <p>
              Manage 7 platforms • {dashboardData.audience.total.toLocaleString()} total followers • 
              {dashboardData.engagement.rate}% engagement rate
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Tabs
              tabs={mainTabs}
              selected={selectedTab}
              onSelect={setSelectedTab}
            />
            <Card.Section>
              <Tabs
                tabs={mainTabs[selectedTab].subTabs}
                selected={selectedSubTab[mainTabs[selectedTab].id] || 0}
                onSelect={handleSubTabChange}
                fitted
              />
            </Card.Section>
            <Card.Section>
              {renderSubTabContent()}
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
