import React, { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  Card,
  Tabs,
  DataTable,
  TextField,
  Select,
  Button,
  Badge,
  Banner,
  Spinner,
  TextContainer,
  Stack,
  FormLayout,
  ChoiceList,
  ButtonGroup,
  Modal,
  Toast,
  Frame,
} from '@shopify/polaris';
import './ReviewsUGCEngineV2.css';

export default function ReviewsUGCEngineV2() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewFilter, setReviewFilter] = useState({
    status: '',
    rating: '',
    verified: '',
  });

  // UGC Collection state
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [collectionWidgets, setCollectionWidgets] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);

  // Moderation state
  const [moderationRules, setModerationRules] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [blockedWords, setBlockedWords] = useState([]);

  // Sentiment AI state
  const [sentimentAnalyses, setSentimentAnalyses] = useState([]);
  const [insights, setInsights] = useState([]);
  const [trends, setTrends] = useState([]);

  // Social Proof state
  const [displayRules, setDisplayRules] = useState([]);
  const [trustBadges, setTrustBadges] = useState([]);
  const [socialProofElements, setSocialProofElements] = useState([]);
  const [abTests, setAbTests] = useState([]);

  // Display Widgets state
  const [reviewWidgets, setReviewWidgets] = useState([]);
  const [carousels, setCarousels] = useState([]);
  const [themes, setThemes] = useState([]);

  // Analytics state
  const [reports, setReports] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analyticsMetrics, setAnalyticsMetrics] = useState({});

  // Integration state
  const [integrations, setIntegrations] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    pendingModeration: 0,
    activeWidgets: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/reviews-ugc-engine/statistics');
      const data = await response.json();
      setDashboardStats({
        totalReviews: data.reviews?.totalReviews || 0,
        averageRating: data.reviews?.averageRating || 0,
        pendingModeration: data.moderation?.queue?.pending || 0,
        activeWidgets: data.display?.widgets?.active || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const showToast = (message, error = false) => {
    setActiveToast({ message, error });
  };

  const tabs = [
    // Review Management (8 tabs)
    { id: 'review-list', content: 'Review List', group: 'reviews' },
    { id: 'create-review', content: 'Create Review', group: 'reviews' },
    { id: 'moderate-reviews', content: 'Moderate', group: 'reviews' },
    { id: 'review-responses', content: 'Responses', group: 'reviews' },
    { id: 'review-search', content: 'Search', group: 'reviews' },
    { id: 'product-ratings', content: 'Product Ratings', group: 'reviews' },
    { id: 'customer-reviews', content: 'Customer Reviews', group: 'reviews' },
    { id: 'review-stats', content: 'Statistics', group: 'reviews' },

    // UGC Collection (6 tabs)
    { id: 'campaigns', content: 'Campaigns', group: 'collection' },
    { id: 'review-requests', content: 'Requests', group: 'collection' },
    { id: 'collection-widgets', content: 'Widgets', group: 'collection' },
    { id: 'email-templates', content: 'Templates', group: 'collection' },
    { id: 'request-tracking', content: 'Tracking', group: 'collection' },
    { id: 'collection-stats', content: 'Statistics', group: 'collection' },

    // Moderation (5 tabs)
    { id: 'moderation-rules', content: 'Rules', group: 'moderation' },
    { id: 'moderation-queue', content: 'Queue', group: 'moderation' },
    { id: 'blocklists', content: 'Blocklists', group: 'moderation' },
    { id: 'auto-checks', content: 'Auto Checks', group: 'moderation' },
    { id: 'moderation-stats', content: 'Statistics', group: 'moderation' },

    // Sentiment AI (4 tabs)
    { id: 'sentiment-analyze', content: 'Analyze', group: 'sentiment' },
    { id: 'sentiment-insights', content: 'Insights', group: 'sentiment' },
    { id: 'sentiment-trends', content: 'Trends', group: 'sentiment' },
    { id: 'sentiment-summary', content: 'Summary', group: 'sentiment' },

    // Social Proof (5 tabs)
    { id: 'display-rules', content: 'Display Rules', group: 'social' },
    { id: 'trust-badges', content: 'Trust Badges', group: 'social' },
    { id: 'social-elements', content: 'Elements', group: 'social' },
    { id: 'ab-tests', content: 'A/B Tests', group: 'social' },
    { id: 'conversion-insights', content: 'Insights', group: 'social' },

    // Display Widgets (6 tabs)
    { id: 'widgets', content: 'Widgets', group: 'display' },
    { id: 'carousels', content: 'Carousels', group: 'display' },
    { id: 'embeds', content: 'Embeds', group: 'display' },
    { id: 'themes', content: 'Themes', group: 'display' },
    { id: 'widget-preview', content: 'Preview', group: 'display' },
    { id: 'display-stats', content: 'Statistics', group: 'display' },

    // Analytics (5 tabs)
    { id: 'analytics-dashboard', content: 'Dashboard', group: 'analytics' },
    { id: 'analytics-metrics', content: 'Metrics', group: 'analytics' },
    { id: 'analytics-reports', content: 'Reports', group: 'analytics' },
    { id: 'analytics-alerts', content: 'Alerts', group: 'analytics' },
    { id: 'product-comparison', content: 'Compare', group: 'analytics' },

    // Integrations (3 tabs)
    { id: 'platforms', content: 'Platforms', group: 'integrations' },
    { id: 'webhooks', content: 'Webhooks', group: 'integrations' },
    { id: 'sync-logs', content: 'Sync Logs', group: 'integrations' },
  ];

  const renderTabContent = () => {
    const tabId = tabs[selectedTab].id;

    switch (tabId) {
      // Review Management Tabs
      case 'review-list':
        return <ReviewListTab reviews={reviews} setReviews={setReviews} showToast={showToast} />;
      case 'create-review':
        return <CreateReviewTab showToast={showToast} />;
      case 'moderate-reviews':
        return <ModerateReviewsTab showToast={showToast} />;
      case 'review-responses':
        return <ReviewResponsesTab showToast={showToast} />;
      case 'review-search':
        return <ReviewSearchTab showToast={showToast} />;
      case 'product-ratings':
        return <ProductRatingsTab showToast={showToast} />;
      case 'customer-reviews':
        return <CustomerReviewsTab showToast={showToast} />;
      case 'review-stats':
        return <ReviewStatsTab showToast={showToast} />;

      // UGC Collection Tabs
      case 'campaigns':
        return <CampaignsTab campaigns={campaigns} setCampaigns={setCampaigns} showToast={showToast} />;
      case 'review-requests':
        return <ReviewRequestsTab showToast={showToast} />;
      case 'collection-widgets':
        return <CollectionWidgetsTab showToast={showToast} />;
      case 'email-templates':
        return <EmailTemplatesTab showToast={showToast} />;
      case 'request-tracking':
        return <RequestTrackingTab showToast={showToast} />;
      case 'collection-stats':
        return <CollectionStatsTab showToast={showToast} />;

      // Moderation Tabs
      case 'moderation-rules':
        return <ModerationRulesTab showToast={showToast} />;
      case 'moderation-queue':
        return <ModerationQueueTab showToast={showToast} />;
      case 'blocklists':
        return <BlocklistsTab showToast={showToast} />;
      case 'auto-checks':
        return <AutoChecksTab showToast={showToast} />;
      case 'moderation-stats':
        return <ModerationStatsTab showToast={showToast} />;

      // Sentiment AI Tabs
      case 'sentiment-analyze':
        return <SentimentAnalyzeTab showToast={showToast} />;
      case 'sentiment-insights':
        return <SentimentInsightsTab showToast={showToast} />;
      case 'sentiment-trends':
        return <SentimentTrendsTab showToast={showToast} />;
      case 'sentiment-summary':
        return <SentimentSummaryTab showToast={showToast} />;

      // Social Proof Tabs
      case 'display-rules':
        return <DisplayRulesTab showToast={showToast} />;
      case 'trust-badges':
        return <TrustBadgesTab showToast={showToast} />;
      case 'social-elements':
        return <SocialElementsTab showToast={showToast} />;
      case 'ab-tests':
        return <ABTestsTab showToast={showToast} />;
      case 'conversion-insights':
        return <ConversionInsightsTab showToast={showToast} />;

      // Display Widgets Tabs
      case 'widgets':
        return <WidgetsTab showToast={showToast} />;
      case 'carousels':
        return <CarouselsTab showToast={showToast} />;
      case 'embeds':
        return <EmbedsTab showToast={showToast} />;
      case 'themes':
        return <ThemesTab showToast={showToast} />;
      case 'widget-preview':
        return <WidgetPreviewTab showToast={showToast} />;
      case 'display-stats':
        return <DisplayStatsTab showToast={showToast} />;

      // Analytics Tabs
      case 'analytics-dashboard':
        return <AnalyticsDashboardTab showToast={showToast} />;
      case 'analytics-metrics':
        return <AnalyticsMetricsTab showToast={showToast} />;
      case 'analytics-reports':
        return <AnalyticsReportsTab showToast={showToast} />;
      case 'analytics-alerts':
        return <AnalyticsAlertsTab showToast={showToast} />;
      case 'product-comparison':
        return <ProductComparisonTab showToast={showToast} />;

      // Integration Tabs
      case 'platforms':
        return <PlatformsTab integrations={integrations} setIntegrations={setIntegrations} showToast={showToast} />;
      case 'webhooks':
        return <WebhooksTab showToast={showToast} />;
      case 'sync-logs':
        return <SyncLogsTab showToast={showToast} />;

      default:
        return <div>Tab not implemented</div>;
    }
  };

  return (
    <Frame>
      <Page title="Reviews & UGC Engine V2" fullWidth>
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div className="dashboard-stats-grid">
                <div className="stat-card gradient-purple">
                  <h3>{dashboardStats.totalReviews.toLocaleString()}</h3>
                  <p>Total Reviews</p>
                </div>
                <div className="stat-card gradient-blue">
                  <h3>{dashboardStats.averageRating.toFixed(1)} ★</h3>
                  <p>Average Rating</p>
                </div>
                <div className="stat-card gradient-pink">
                  <h3>{dashboardStats.pendingModeration}</h3>
                  <p>Pending Moderation</p>
                </div>
                <div className="stat-card gradient-green">
                  <h3>{dashboardStats.activeWidgets}</h3>
                  <p>Active Widgets</p>
                </div>
              </div>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <div className="tabs-wrapper">
                <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
                  <Card.Section>{loading ? <Spinner /> : renderTabContent()}</Card.Section>
                </Tabs>
              </div>
            </Card>
          </Layout.Section>
        </Layout>

        {activeToast && (
          <Toast
            content={activeToast.message}
            error={activeToast.error}
            onDismiss={() => setActiveToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
}

// Review Management Tab Components
function ReviewListTab({ reviews, setReviews, showToast }) {
  const [productId, setProductId] = useState('');

  const loadReviews = async () => {
    try {
      const url = productId
        ? `/api/reviews-ugc-engine/products/${productId}/reviews`
        : `/api/reviews-ugc-engine/reviews`;
      const response = await fetch(url);
      const data = await response.json();
      setReviews(data.reviews || data);
      showToast('Reviews loaded successfully');
    } catch (error) {
      showToast('Failed to load reviews', true);
    }
  };

  return (
    <Stack vertical>
      <TextField label="Product ID" value={productId} onChange={setProductId} />
      <Button primary onClick={loadReviews}>
        Load Reviews
      </Button>
      {reviews.length > 0 && (
        <DataTable
          columnContentTypes={['text', 'text', 'numeric', 'text', 'text']}
          headings={['Customer', 'Product', 'Rating', 'Status', 'Date']}
          rows={reviews.map((r) => [
            r.customerName || r.customerId,
            r.productId,
            `${r.rating} ★`,
            r.status,
            new Date(r.createdAt).toLocaleDateString(),
          ])}
        />
      )}
    </Stack>
  );
}

function CreateReviewTab({ showToast }) {
  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    customerName: '',
    rating: '5',
    title: '',
    content: '',
    verified: false,
  });

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/reviews-ugc-engine/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      showToast('Review created successfully');
      setFormData({ productId: '', customerId: '', customerName: '', rating: '5', title: '', content: '', verified: false });
    } catch (error) {
      showToast('Failed to create review', true);
    }
  };

  return (
    <FormLayout>
      <TextField label="Product ID" value={formData.productId} onChange={(v) => setFormData({ ...formData, productId: v })} />
      <TextField label="Customer ID" value={formData.customerId} onChange={(v) => setFormData({ ...formData, customerId: v })} />
      <TextField label="Customer Name" value={formData.customerName} onChange={(v) => setFormData({ ...formData, customerName: v })} />
      <Select
        label="Rating"
        options={[
          { label: '5 Stars', value: '5' },
          { label: '4 Stars', value: '4' },
          { label: '3 Stars', value: '3' },
          { label: '2 Stars', value: '2' },
          { label: '1 Star', value: '1' },
        ]}
        value={formData.rating}
        onChange={(v) => setFormData({ ...formData, rating: v })}
      />
      <TextField label="Title" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} />
      <TextField label="Content" value={formData.content} onChange={(v) => setFormData({ ...formData, content: v })} multiline={4} />
      <Button primary onClick={handleSubmit}>
        Create Review
      </Button>
    </FormLayout>
  );
}

function ModerateReviewsTab({ showToast }) {
  return <TextContainer><p>Review moderation interface with approve/reject/flag actions</p></TextContainer>;
}

function ReviewResponsesTab({ showToast }) {
  return <TextContainer><p>Manage merchant responses to reviews</p></TextContainer>;
}

function ReviewSearchTab({ showToast }) {
  return <TextContainer><p>Full-text search across all reviews</p></TextContainer>;
}

function ProductRatingsTab({ showToast }) {
  return <TextContainer><p>Product rating summaries and distributions</p></TextContainer>;
}

function CustomerReviewsTab({ showToast }) {
  return <TextContainer><p>View reviews by customer</p></TextContainer>;
}

function ReviewStatsTab({ showToast }) {
  return <TextContainer><p>Comprehensive review statistics and metrics</p></TextContainer>;
}

// UGC Collection Tab Components
function CampaignsTab({ campaigns, setCampaigns, showToast }) {
  return <TextContainer><p>Create and manage review collection campaigns</p></TextContainer>;
}

function ReviewRequestsTab({ showToast }) {
  return <TextContainer><p>Send and track review requests</p></TextContainer>;
}

function CollectionWidgetsTab({ showToast }) {
  return <TextContainer><p>Widgets for collecting reviews on site</p></TextContainer>;
}

function EmailTemplatesTab({ showToast }) {
  return <TextContainer><p>Email templates for review requests</p></TextContainer>;
}

function RequestTrackingTab({ showToast }) {
  return <TextContainer><p>Track review request interactions (opened/clicked/submitted)</p></TextContainer>;
}

function CollectionStatsTab({ showToast }) {
  return <TextContainer><p>Collection campaign performance metrics</p></TextContainer>;
}

// Moderation Tab Components
function ModerationRulesTab({ showToast }) {
  return <TextContainer><p>Automated moderation rules configuration</p></TextContainer>;
}

function ModerationQueueTab({ showToast }) {
  return <TextContainer><p>Manual moderation queue with priority sorting</p></TextContainer>;
}

function BlocklistsTab({ showToast }) {
  return <TextContainer><p>Manage blocked words, emails, and IPs</p></TextContainer>;
}

function AutoChecksTab({ showToast }) {
  return <TextContainer><p>Configure automated profanity and spam checks</p></TextContainer>;
}

function ModerationStatsTab({ showToast }) {
  return <TextContainer><p>Moderation performance statistics</p></TextContainer>;
}

// Sentiment AI Tab Components
function SentimentAnalyzeTab({ showToast }) {
  return <TextContainer><p>Analyze sentiment of reviews</p></TextContainer>;
}

function SentimentInsightsTab({ showToast }) {
  return <TextContainer><p>AI-generated insights from reviews</p></TextContainer>;
}

function SentimentTrendsTab({ showToast }) {
  return <TextContainer><p>Sentiment trends over time</p></TextContainer>;
}

function SentimentSummaryTab({ showToast }) {
  return <TextContainer><p>Generate natural language review summaries</p></TextContainer>;
}

// Social Proof Tab Components
function DisplayRulesTab({ showToast }) {
  return <TextContainer><p>Rules for optimized review display</p></TextContainer>;
}

function TrustBadgesTab({ showToast }) {
  return <TextContainer><p>Configure trust badges (verified reviews, top rated, etc.)</p></TextContainer>;
}

function SocialElementsTab({ showToast }) {
  return <TextContainer><p>Social proof elements (recent reviews, trending, customer counts)</p></TextContainer>;
}

function ABTestsTab({ showToast }) {
  return <TextContainer><p>A/B tests for review display optimization</p></TextContainer>;
}

function ConversionInsightsTab({ showToast }) {
  return <TextContainer><p>Conversion insights and optimization recommendations</p></TextContainer>;
}

// Display Widgets Tab Components
function WidgetsTab({ showToast }) {
  return <TextContainer><p>Create and manage review display widgets</p></TextContainer>;
}

function CarouselsTab({ showToast }) {
  return <TextContainer><p>Review carousel configurations</p></TextContainer>;
}

function EmbedsTab({ showToast }) {
  return <TextContainer><p>Generate embed codes for external sites</p></TextContainer>;
}

function ThemesTab({ showToast }) {
  return <TextContainer><p>Widget themes and styling</p></TextContainer>;
}

function WidgetPreviewTab({ showToast }) {
  return <TextContainer><p>Preview widgets with sample data</p></TextContainer>;
}

function DisplayStatsTab({ showToast }) {
  return <TextContainer><p>Widget performance and analytics</p></TextContainer>;
}

// Analytics Tab Components
function AnalyticsDashboardTab({ showToast }) {
  return <TextContainer><p>Custom analytics dashboards</p></TextContainer>;
}

function AnalyticsMetricsTab({ showToast }) {
  return <TextContainer><p>Review, collection, and widget metrics</p></TextContainer>;
}

function AnalyticsReportsTab({ showToast }) {
  return <TextContainer><p>Scheduled reports and exports</p></TextContainer>;
}

function AnalyticsAlertsTab({ showToast }) {
  return <TextContainer><p>Configure threshold-based alerts</p></TextContainer>;
}

function ProductComparisonTab({ showToast }) {
  return <TextContainer><p>Compare review metrics across products</p></TextContainer>;
}

// Integration Tab Components
function PlatformsTab({ integrations, setIntegrations, showToast }) {
  return <TextContainer><p>Connect to Shopify, Google Shopping, Yotpo, Trustpilot, Klaviyo</p></TextContainer>;
}

function WebhooksTab({ showToast }) {
  return <TextContainer><p>Configure webhooks for review events</p></TextContainer>;
}

function SyncLogsTab({ showToast }) {
  return <TextContainer><p>Integration synchronization logs</p></TextContainer>;
}
