import React, { useState, useEffect } from 'react';
import {
  Card,
  Page,
  Layout,
  Tabs,
  Button,
  TextField,
  Select,
  DataTable,
  ProgressBar,
  Badge,
  Stack,
  Banner,
  Modal,
  TextContainer,
  FormLayout,
  ChoiceList,
  RangeSlider,
  Checkbox
} from '@shopify/polaris';
import './UpsellCrossSellEngine.css';

function UpsellCrossSellEngine() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeData, setActiveData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // Tab structure: 8 major categories with 42 total tabs
  const tabs = [
    // Category 1: RECOMMENDATIONS (6 tabs)
    { id: 'rec-dashboard', label: 'Rec Dashboard', category: 'recommendations' },
    { id: 'rec-collaborative', label: 'Collaborative', category: 'recommendations' },
    { id: 'rec-content', label: 'Content-Based', category: 'recommendations' },
    { id: 'rec-hybrid', label: 'Hybrid', category: 'recommendations' },
    { id: 'rec-realtime', label: 'Real-Time', category: 'recommendations' },
    { id: 'rec-analytics', label: 'Rec Analytics', category: 'recommendations' },
    
    // Category 2: BUNDLES (6 tabs)
    { id: 'bundle-management', label: 'Bundle Manager', category: 'bundles' },
    { id: 'bundle-pricing', label: 'Pricing', category: 'bundles' },
    { id: 'bundle-templates', label: 'Templates', category: 'bundles' },
    { id: 'bundle-discounts', label: 'Discounts', category: 'bundles' },
    { id: 'bundle-performance', label: 'Performance', category: 'bundles' },
    { id: 'bundle-recommendations', label: 'Bundle Recs', category: 'bundles' },
    
    // Category 3: CUSTOMER TARGETING (6 tabs)
    { id: 'customer-segments', label: 'Segments', category: 'customers' },
    { id: 'customer-rfm', label: 'RFM Analysis', category: 'customers' },
    { id: 'customer-propensity', label: 'Propensity', category: 'customers' },
    { id: 'customer-behavior', label: 'Behavior', category: 'customers' },
    { id: 'customer-targeting', label: 'Targeting', category: 'customers' },
    { id: 'customer-profiles', label: 'Profiles', category: 'customers' },
    
    // Category 4: CART & CHECKOUT (5 tabs)
    { id: 'cart-management', label: 'Cart Manager', category: 'cart' },
    { id: 'cart-upsells', label: 'Upsells', category: 'cart' },
    { id: 'cart-abandoned', label: 'Abandoned', category: 'cart' },
    { id: 'cart-recovery', label: 'Recovery', category: 'cart' },
    { id: 'cart-analytics', label: 'Cart Analytics', category: 'cart' },
    
    // Category 5: ANALYTICS (5 tabs)
    { id: 'analytics-dashboard', label: 'Dashboard', category: 'analytics' },
    { id: 'analytics-reports', label: 'Reports', category: 'analytics' },
    { id: 'analytics-attribution', label: 'Attribution', category: 'analytics' },
    { id: 'analytics-metrics', label: 'Metrics', category: 'analytics' },
    { id: 'analytics-performance', label: 'Performance', category: 'analytics' },
    
    // Category 6: AB TESTING (4 tabs)
    { id: 'ab-experiments', label: 'Experiments', category: 'abtesting' },
    { id: 'ab-variants', label: 'Variants', category: 'abtesting' },
    { id: 'ab-results', label: 'Results', category: 'abtesting' },
    { id: 'ab-bandit', label: 'Bandit', category: 'abtesting' },
    
    // Category 7: INTEGRATIONS (5 tabs)
    { id: 'int-connections', label: 'Connections', category: 'integrations' },
    { id: 'int-webhooks', label: 'Webhooks', category: 'integrations' },
    { id: 'int-api-keys', label: 'API Keys', category: 'integrations' },
    { id: 'int-sync', label: 'Sync', category: 'integrations' },
    { id: 'int-settings', label: 'Settings', category: 'integrations' },
    
    // Category 8: ADVANCED (5 tabs)
    { id: 'adv-versions', label: 'Versions', category: 'advanced' },
    { id: 'adv-templates', label: 'Templates', category: 'advanced' },
    { id: 'adv-compliance', label: 'Compliance', category: 'advanced' },
    { id: 'adv-audit', label: 'Audit Logs', category: 'advanced' },
    { id: 'adv-backup', label: 'Backup', category: 'advanced' }
  ];

  useEffect(() => {
    loadTabData(tabs[selectedTab].id);
  }, [selectedTab]);

  const loadTabData = async (tabId) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setActiveData(getMockData(tabId));
      setLoading(false);
    }, 300);
  };

  const getMockData = (tabId) => {
    const mockData = {
      'rec-dashboard': { totalRecs: 15000, clickRate: 12.5, conversionRate: 3.2, revenue: 45000 },
      'bundle-management': { bundles: 120, active: 85, avgRevenue: 125.50 },
      'customer-segments': { segments: 15, customers: 8500, topSegment: 'Champions' },
      'cart-abandoned': { total: 450, recovered: 120, recoveryRate: 26.7 },
      'analytics-dashboard': { totalRevenue: 185000, orders: 2300, avgOrder: 80.43 },
      'ab-experiments': { running: 5, completed: 12, winners: 8 },
      'int-connections': { integrations: 3, active: 2, synced: '2 hours ago' },
      'adv-versions': { versions: 340, entities: 8, latestRestore: 'Never' }
    };
    return mockData[tabId] || {};
  };

  const renderTabContent = (tab) => {
    switch (tab.category) {
      case 'recommendations':
        return renderRecommendationsTab(tab.id);
      case 'bundles':
        return renderBundlesTab(tab.id);
      case 'customers':
        return renderCustomersTab(tab.id);
      case 'cart':
        return renderCartTab(tab.id);
      case 'analytics':
        return renderAnalyticsTab(tab.id);
      case 'abtesting':
        return renderABTestingTab(tab.id);
      case 'integrations':
        return renderIntegrationsTab(tab.id);
      case 'advanced':
        return renderAdvancedTab(tab.id);
      default:
        return <div>Unknown category</div>;
    }
  };

  //================================================================
  // RECOMMENDATIONS RENDERERS
  //================================================================

  const renderRecommendationsTab = (tabId) => {
    switch (tabId) {
      case 'rec-dashboard':
        return (
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <TextContainer>
                  <h2>Recommendation Performance Overview</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-label">Total Recommendations</div>
                      <div className="metric-value">{activeData.totalRecs?.toLocaleString()}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Click Rate</div>
                      <div className="metric-value">{activeData.clickRate}%</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Conversion Rate</div>
                      <div className="metric-value">{activeData.conversionRate}%</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Revenue</div>
                      <div className="metric-value">${activeData.revenue?.toLocaleString()}</div>
                    </div>
                  </div>
                </TextContainer>
              </Card>
            </Layout.Section>
            <Layout.Section secondary>
              <Card title="Recommendation Strategies" sectioned>
                <Stack vertical>
                  <Badge status="success">Collaborative Filtering</Badge>
                  <Badge status="success">Content-Based</Badge>
                  <Badge status="success">Hybrid</Badge>
                  <Badge status="success">Deep Learning</Badge>
                  <Badge status="success">Real-Time</Badge>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'rec-collaborative':
        return (
          <Card sectioned title="Collaborative Filtering Configuration">
            <FormLayout>
              <Select
                label="Similarity Algorithm"
                options={[
                  { label: 'Jaccard Similarity', value: 'jaccard' },
                  { label: 'Cosine Similarity', value: 'cosine' },
                  { label: 'Pearson Correlation', value: 'pearson' }
                ]}
              />
              <RangeSlider
                label="Min User Overlap"
                value={5}
                min={1}
                max={20}
                onChange={() => {}}
              />
              <TextField label="Max Recommendations" type="number" value="10" />
              <Button primary>Generate Recommendations</Button>
            </FormLayout>
          </Card>
        );

      case 'rec-content':
        return (
          <Card sectioned title="Content-Based Recommendations">
            <FormLayout>
              <ChoiceList
                title="Feature Extraction"
                choices={[
                  { label: 'Product Categories', value: 'categories' },
                  { label: 'Tags', value: 'tags' },
                  { label: 'Attributes', value: 'attributes' },
                  { label: 'Price Range', value: 'price' }
                ]}
                selected={['categories', 'tags']}
                allowMultiple
              />
              <Select
                label="Similarity Metric"
                options={[
                  { label: 'Cosine Distance', value: 'cosine' },
                  { label: 'Euclidean Distance', value: 'euclidean' }
                ]}
              />
              <Button primary>Configure</Button>
            </FormLayout>
          </Card>
        );

      case 'rec-hybrid':
        return (
          <Card sectioned title="Hybrid Recommendation Weights">
            <FormLayout>
              <RangeSlider
                label="Collaborative Weight"
                value={60}
                min={0}
                max={100}
                suffix="%"
                onChange={() => {}}
              />
              <RangeSlider
                label="Content-Based Weight"
                value={40}
                min={0}
                max={100}
                suffix="%"
                onChange={() => {}}
              />
              <Checkbox label="Enable Deep Learning Boost" />
              <Button primary>Update Weights</Button>
            </FormLayout>
          </Card>
        );

      case 'rec-realtime':
        return (
          <Card sectioned title="Real-Time Recommendation Engine">
            <Stack vertical>
              <Banner status="info">
                Real-time recommendations use session data, browsing history, and contextual signals
              </Banner>
              <FormLayout>
                <TextField label="Session Window (seconds)" type="number" value="300" />
                <RangeSlider label="Recency Weight" value={70} min={0} max={100} onChange={() => {}} />
                <Checkbox label="Use clickstream data" checked />
                <Checkbox label="Factor cart contents" checked />
                <Button primary>Configure Real-Time Engine</Button>
              </FormLayout>
            </Stack>
          </Card>
        );

      case 'rec-analytics':
        return (
          <Card title="Recommendation Analytics">
            <Card.Section>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                headings={['Strategy', 'Impressions', 'Clicks', 'Conversions']}
                rows={[
                  ['Collaborative', '5,234', '652', '168'],
                  ['Content-Based', '4,123', '531', '142'],
                  ['Hybrid', '6,891', '892', '241'],
                  ['Real-Time', '3,456', '478', '129']
                ]}
              />
            </Card.Section>
          </Card>
        );

      default:
        return <div>Recommendation tab: {tabId}</div>;
    }
  };

  //================================================================
  // BUNDLES RENDERERS
  //================================================================

  const renderBundlesTab = (tabId) => {
    switch (tabId) {
      case 'bundle-management':
        return (
          <Layout>
            <Layout.Section>
              <Card title="Bundle Manager" sectioned>
                <Stack distribution="trailing">
                  <Button primary onClick={() => setShowModal(true)}>Create Bundle</Button>
                </Stack>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={['Bundle Name', 'Products', 'Price', 'Status']}
                  rows={[
                    ['Summer Essentials', '4', '$99.99', <Badge status="success">Active</Badge>],
                    ['Tech Starter Pack', '3', '$299.99', <Badge status="success">Active</Badge>],
                    ['Holiday Special', '5', '$149.99', <Badge>Inactive</Badge>]
                  ]}
                />
              </Card>
            </Layout.Section>
            <Layout.Section secondary>
              <Card title="Quick Stats" sectioned>
                <Stack vertical>
                  <div>Total Bundles: {activeData.bundles}</div>
                  <div>Active: {activeData.active}</div>
                  <div>Avg Revenue: ${activeData.avgRevenue}</div>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'bundle-pricing':
        return (
          <Card sectioned title="Bundle Pricing Strategies">
            <FormLayout>
              <Select
                label="Pricing Strategy"
                options={[
                  { label: 'Fixed Price', value: 'fixed' },
                  { label: 'Percentage Discount', value: 'percentage' },
                  { label: 'Tiered Pricing', value: 'tiered' },
                  { label: 'Dynamic Pricing', value: 'dynamic' },
                  { label: 'Margin-Optimized', value: 'margin' }
                ]}
              />
              <TextField label="Target Margin (%)" type="number" value="35" />
              <TextField label="Max Discount (%)" type="number" value="25" />
              <Checkbox label="Enable competitive pricing" />
              <Button primary>Optimize Pricing</Button>
            </FormLayout>
          </Card>
        );

      case 'bundle-templates':
        return (
          <Card title="Bundle Templates">
            <Card.Section>
              <Stack distribution="trailing">
                <Button>Create Template</Button>
              </Stack>
              <DataTable
                columnContentTypes={['text', 'text', 'numeric']}
                headings={['Template Name', 'Type', 'Usage Count']}
                rows={[
                  ['Frequently Bought Together', 'Auto-generated', '45'],
                  ['Category Bundle', 'Manual', '23'],
                  ['Complementary Products', 'ML-based', '67']
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'bundle-discounts':
        return (
          <Card sectioned title="Discount Rules">
            <FormLayout>
              <Select
                label="Discount Type"
                options={[
                  { label: 'Percentage Off', value: 'percentage' },
                  { label: 'Fixed Amount', value: 'fixed' },
                  { label: 'Buy X Get Y', value: 'bxgy' }
                ]}
              />
              <TextField label="Discount Value" type="number" />
              <TextField label="Min Purchase Amount" type="number" prefix="$" />
              <Checkbox label="Stackable with other offers" />
              <Button primary>Create Rule</Button>
            </FormLayout>
          </Card>
        );

      case 'bundle-performance':
        return (
          <Card title="Bundle Performance Metrics">
            <Card.Section>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'numeric']}
                headings={['Bundle', 'Views', 'Add-to-Cart', 'Purchases', 'Revenue']}
                rows={[
                  ['Summer Essentials', '1,234', '345', '98', '$9,801'],
                  ['Tech Starter Pack', '892', '267', '76', '$22,799'],
                  ['Holiday Special', '2,456', '678', '189', '$28,311']
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'bundle-recommendations':
        return (
          <Card sectioned title="Bundle Recommendation Strategies">
            <ChoiceList
              title="Generation Strategy"
              choices={[
                { label: 'Frequently Bought Together', value: 'fbt' },
                { label: 'Complementary Products', value: 'complementary' },
                { label: 'Category-Based', value: 'category' },
                { label: 'Margin-Optimized', value: 'margin' }
              ]}
              selected={['fbt']}
            />
            <div style={{ marginTop: '20px' }}>
              <Button primary>Generate Bundle Recommendations</Button>
            </div>
          </Card>
        );

      default:
        return <div>Bundle tab: {tabId}</div>;
    }
  };

  //================================================================
  // CUSTOMERS RENDERERS
  //================================================================

  const renderCustomersTab = (tabId) => {
    switch (tabId) {
      case 'customer-segments':
        return (
          <Layout>
            <Layout.Section>
              <Card title="Customer Segments" sectioned>
                <Stack distribution="trailing">
                  <Button primary>Create Segment</Button>
                </Stack>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={['Segment', 'Type', 'Customers', 'Status']}
                  rows={[
                    ['High-Value VIPs', 'Dynamic', '456', <Badge status="success">Active</Badge>],
                    ['Recent Customers', 'Dynamic', '1,234', <Badge status="success">Active</Badge>],
                    ['At-Risk Churners', 'Dynamic', '789', <Badge status="warning">Warning</Badge>]
                  ]}
                />
              </Card>
            </Layout.Section>
            <Layout.Section secondary>
              <Card title="Segment Summary" sectioned>
                <Stack vertical>
                  <div>Total Segments: {activeData.segments}</div>
                  <div>Total Customers: {activeData.customers?.toLocaleString()}</div>
                  <div>Top Segment: {activeData.topSegment}</div>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'customer-rfm':
        return (
          <Card title="RFM Analysis">
            <Card.Section>
              <Banner status="info">
                RFM scores customers based on Recency, Frequency, and Monetary value
              </Banner>
            </Card.Section>
            <Card.Section>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'text']}
                headings={['Segment', 'R Score', 'F Score', 'M Score', 'Tier']}
                rows={[
                  ['Champions', '5', '5', '5', <Badge status="success">Top</Badge>],
                  ['Loyal Customers', '4', '4', '4', <Badge status="success">High</Badge>],
                  ['At Risk', '2', '3', '3', <Badge status="warning">Medium</Badge>],
                  ['Lost', '1', '1', '1', <Badge status="critical">Low</Badge>]
                ]}
              />
            </Card.Section>
            <Card.Section>
              <Button primary fullWidth>Run RFM Analysis</Button>
            </Card.Section>
          </Card>
        );

      case 'customer-propensity':
        return (
          <Card sectioned title="Propensity Scoring">
            <FormLayout>
              <Select
                label="Propensity Action"
                options={[
                  { label: 'Upsell Propensity', value: 'upsell' },
                  { label: 'Cross-Sell Propensity', value: 'cross_sell' },
                  { label: 'Churn Propensity', value: 'churn' },
                  { label: 'Purchase Propensity', value: 'purchase' }
                ]}
              />
              <RangeSlider
                label="Min Propensity Score"
                value={70}
                min={0}
                max={100}
                onChange={() => {}}
              />
              <Button primary>Calculate Propensity Scores</Button>
            </FormLayout>
            <div style={{ marginTop: '20px' }}>
              <DataTable
                columnContentTypes={['text', 'numeric', 'text']}
                headings={['Customer', 'Propensity Score', 'Action']}
                rows={[
                  ['Customer #1234', '92%', 'Upsell'],
                  ['Customer #5678', '88%', 'Cross-Sell'],
                  ['Customer #9012', '76%', 'Upsell']
                ]}
              />
            </div>
          </Card>
        );

      case 'customer-behavior':
        return (
          <Card title="Behavior Profiling">
            <Card.Section>
              <FormLayout>
                <ChoiceList
                  title="Behavior Metrics"
                  choices={[
                    { label: 'Browsing Patterns', value: 'browsing' },
                    { label: 'Purchase History', value: 'purchase' },
                    { label: 'Engagement Score', value: 'engagement' },
                    { label: 'Channel Preference', value: 'channel' }
                  ]}
                  selected={['browsing', 'purchase', 'engagement']}
                  allowMultiple
                />
                <Button primary>Analyze Behavior</Button>
              </FormLayout>
            </Card.Section>
          </Card>
        );

      case 'customer-targeting':
        return (
          <Card sectioned title="Target Audience Builder">
            <FormLayout>
              <Select
                label="Target Action"
                options={[
                  { label: 'Upsell Campaign', value: 'upsell' },
                  { label: 'Cross-Sell Campaign', value: 'cross_sell' },
                  { label: 'Re-engagement', value: 'reengage' }
                ]}
              />
              <RangeSlider label="Min Propensity" value={70} min={0} max={100} onChange={() => {}} />
              <TextField label="Max Audience Size" type="number" value="5000" />
              <Button primary>Build Audience</Button>
            </FormLayout>
          </Card>
        );

      case 'customer-profiles':
        return (
          <Card title="Customer Profiles">
            <Card.Section>
              <TextField label="Search Customer" placeholder="Customer ID or Email" />
              <div style={{ marginTop: '20px' }}>
                <Stack vertical spacing="tight">
                  <div><strong>Lifetime Value:</strong> $2,345.67</div>
                  <div><strong>Orders:</strong> 15</div>
                  <div><strong>Avg Order Value:</strong> $156.38</div>
                  <div><strong>RFM Score:</strong> 445 (Champion)</div>
                  <div><strong>Segments:</strong>High-Value, Frequent Buyer</div>
                </Stack>
              </div>
            </Card.Section>
          </Card>
        );

      default:
        return <div>Customer tab: {tabId}</div>;
    }
  };

  //================================================================
  // CART RENDERERS
  //================================================================

  const renderCartTab = (tabId) => {
    switch (tabId) {
      case 'cart-management':
        return (
          <Card title="Active Carts">
            <Card.Section>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'text']}
                headings={['Cart ID', 'Items', 'Value', 'Last Activity']}
                rows={[
                  ['#12345', '3', '$145.99', '5 min ago'],
                  ['#12346', '2', '$89.50', '12 min ago'],
                  ['#12347', '5', '$230.00', '1 hour ago']
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'cart-upsells':
        return (
          <Card sectioned title="Cart Upsell Rules">
            <FormLayout>
              <Select
                label="Trigger Type"
                options={[
                  { label: 'Cart Value Threshold', value: 'cart_value' },
                  { label: 'Product Category', value: 'category' },
                  { label: 'Customer Segment', value: 'segment' }
                ]}
              />
              <Select
                label="Position"
                options={[
                  { label: 'Checkout Page', value: 'checkout' },
                  { label: 'Payment Page', value: 'payment' },
                  { label: 'Confirmation Page', value: 'confirmation' }
                ]}
              />
              <TextField label="Min Cart Value" type="number" prefix="$" />
              <Button primary>Create Upsell</Button>
            </FormLayout>
          </Card>
        );

      case 'cart-abandoned':
        return (
          <Layout>
            <Layout.Section>
              <Card title="Abandoned Carts" sectioned>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text', 'text']}
                  headings={['Cart ID', 'Customer', 'Value', 'Abandoned', 'Status']}
                  rows={[
                    ['#12348', 'customer@email.com', '$199.99', '2 hours ago', <Badge>Pending</Badge>],
                    ['#12349', 'buyer@email.com', '$89.50', '1 day ago', <Badge status="attention">Recovery Sent</Badge>],
                    ['#12350', 'shopper@email.com', '$145.00', '3 days ago', <Badge status="success">Recovered</Badge>]
                  ]}
                />
              </Card>
            </Layout.Section>
            <Layout.Section secondary>
              <Card title="Recovery Stats" sectioned>
                <Stack vertical>
                  <div>Total: {activeData.total}</div>
                  <div>Recovered: {activeData.recovered}</div>
                  <div>Rate: {activeData.recoveryRate}%</div>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'cart-recovery':
        return (
          <Card sectioned title="Recovery Sequence">
            <Stack vertical>
              <div className="recovery-step">
                <strong>Step 1:</strong>Email after 1 hour
                <Badge status="success">Active</Badge>
              </div>
              <div className="recovery-step">
                <strong>Step 2:</strong>Email after 24 hours with 10% discount
                <Badge status="success">Active</Badge>
              </div>
              <div className="recovery-step">
                <strong>Step 3:</strong>SMS after 72 hours
                <Badge status="success">Active</Badge>
              </div>
              <Button primary fullWidth>Edit Sequence</Button>
            </Stack>
          </Card>
        );

      case 'cart-analytics':
        return (
          <Card title="Cart Analytics">
            <Card.Section>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Total Carts</div>
                  <div className="metric-value">2,340</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Avg Cart Value</div>
                  <div className="metric-value">$125.45</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Abandonment Rate</div>
                  <div className="metric-value">32.5%</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Conversion Rate</div>
                  <div className="metric-value">67.5%</div>
                </div>
              </div>
            </Card.Section>
          </Card>
        );

      default:
        return <div>Cart tab: {tabId}</div>;
    }
  };

  //================================================================
  // ANALYTICS RENDERERS
  //================================================================

  const renderAnalyticsTab = (tabId) => {
    switch (tabId) {
      case 'analytics-dashboard':
        return (
          <Layout>
            <Layout.Section>
              <Card title="Performance Overview" sectioned>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Total Revenue</div>
                    <div className="metric-value">${activeData.totalRevenue?.toLocaleString()}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Orders</div>
                    <div className="metric-value">{activeData.orders?.toLocaleString()}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Avg Order Value</div>
                    <div className="metric-value">${activeData.avgOrder}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Conversion Rate</div>
                    <div className="metric-value">4.2%</div>
                  </div>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'analytics-reports':
        return (
          <Card title="Report Generator">
            <Card.Section>
              <FormLayout>
                <Select
                  label="Report Type"
                  options={[
                    { label: 'Recommendation Performance', value: 'recommendation_performance' },
                    { label: 'Bundle Performance', value: 'bundle_performance' },
                    { label: 'Cart Analytics', value: 'cart_analytics' },
                    { label: 'Revenue Attribution', value: 'revenue_attribution' },
                    { label: 'Customer Insights', value: 'customer_insights' },
                    { label: 'Comprehensive', value: 'comprehensive' }
                  ]}
                />
                <Select
                  label="Period"
                  options={[
                    { label: 'Last 7 Days', value: '7d' },
                    { label: 'Last 30 Days', value: '30d' },
                    { label: 'Last 90 Days', value: '90d' }
                  ]}
                />
                <Button primary>Generate Report</Button>
              </FormLayout>
            </Card.Section>
            <Card.Section title="Recent Reports">
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={['Report', 'Generated', 'Actions']}
                rows={[
                  ['Recommendation Performance', '2 hours ago', <Button>Download</Button>],
                  ['Comprehensive Report', 'Yesterday', <Button>Download</Button>]
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'analytics-attribution':
        return (
          <Card sectioned title="Revenue Attribution">
            <FormLayout>
              <Select
                label="Attribution Model"
                options={[
                  { label: 'Last Touch', value: 'lastTouch' },
                  { label: 'First Touch', value: 'firstTouch' },
                  { label: 'Linear', value: 'linear' },
                  { label: 'Time Decay', value: 'timeDecay' },
                  { label: 'Position-Based', value: 'positionBased' }
                ]}
              />
              <Select label="Period" options={[{ label: 'Last 30 Days', value: '30d' }]} />
              <Button primary>Analyze Attribution</Button>
            </FormLayout>
            <div style={{ marginTop: '20px' }}>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric']}
                headings={['Source', 'Revenue', 'Percentage']}
                rows={[
                  ['Recommendations', '$45,000', '35%'],
                  ['Bundles', '$38,500', '30%'],
                  ['Upsells', '$25,600', '20%'],
                  ['Organic', '$19,200', '15%']
                ]}
              />
            </div>
          </Card>
        );

      case 'analytics-metrics':
        return (
          <Card sectioned title="Custom Metrics">
            <FormLayout>
              <Select
                label="Metric Category"
                options={[
                  { label: 'Recommendations', value: 'recommendation' },
                  { label: 'Bundles', value: 'bundle' },
                  { label: 'Cart', value: 'cart' },
                  { label: 'Checkout', value: 'checkout' }
                ]}
              />
              <TextField label="Metric Name" />
              <TextField label="Value" type="number" />
              <Button primary>Track Metric</Button>
            </FormLayout>
          </Card>
        );

      case 'analytics-performance':
        return (
          <Card title="Performance Snapshots">
            <Card.Section>
              <Button primary>Create Snapshot</Button>
              <div style={{ marginTop: '20px' }}>
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={['Snapshot', 'Timestamp', 'Actions']}
                  rows={[
                    ['Snapshot #1', '2024-01-15 10:30 AM', <Button>Compare</Button>],
                    ['Snapshot #2', '2024-01-14 10:30 AM', <Button>Compare</Button>]
                  ]}
                />
              </div>
            </Card.Section>
          </Card>
        );

      default:
        return <div>Analytics tab: {tabId}</div>;
    }
  };

  //================================================================
  // AB TESTING RENDERERS
  //================================================================

  const renderABTestingTab = (tabId) => {
    switch (tabId) {
      case 'ab-experiments':
        return (
          <Layout>
            <Layout.Section>
              <Card title="A/B Experiments" sectioned>
                <Stack distribution="trailing">
                  <Button primary>Create Experiment</Button>
                </Stack>
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={['Experiment', 'Type', 'Participants', 'Status']}
                  rows={[
                    ['Recommendation Test', 'A/B Test', '2,340', <Badge status="success">Running</Badge>],
                    ['Bundle Pricing', 'Multivariate', '1,567', <Badge status="success">Running</Badge>],
                    ['Cart Upsell', 'Bandit', '3,892', <Badge>Completed</Badge>]
                  ]}
                />
              </Card>
            </Layout.Section>
            <Layout.Section secondary>
              <Card title="Experiment Summary" sectioned>
                <Stack vertical>
                  <div>Running: {activeData.running}</div>
                  <div>Completed: {activeData.completed}</div>
                  <div>Winners Found: {activeData.winners}</div>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'ab-variants':
        return (
          <Card sectioned title="Variant Configuration">
            <FormLayout>
              <TextField label="Variant Name" placeholder="Variant A" />
              <RangeSlider
                label="Traffic Weight"
                value={50}
                min={0}
                max={100}
                suffix="%"
                onChange={() => {}}
              />
              <Checkbox label="Set as Control" />
              <Button primary>Add Variant</Button>
            </FormLayout>
          </Card>
        );

      case 'ab-results':
        return (
          <Card title="Experiment Results">
            <Card.Section>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric', 'text']}
                headings={['Variant', 'Participants', 'Conversions', 'Conv. Rate', 'Significance']}
                rows={[
                  ['Control', '1,200', '48', '4.0%', <Badge>Baseline</Badge>],
                  ['Variant A', '1,140', '63', '5.5%', <Badge status="success">Significant</Badge>],
                  ['Variant B', '1,180', '51', '4.3%', <Badge>Not Significant</Badge>]
                ]}
              />
            </Card.Section>
            <Card.Section>
              <Banner status="success">
                <strong>Variant A</strong> is the winner with 37.5% lift and 95% confidence
              </Banner>
            </Card.Section>
          </Card>
        );

      case 'ab-bandit':
        return (
          <Card sectioned title="Multi-Armed Bandit Configuration">
            <FormLayout>
              <Select
                label="Algorithm"
                options={[
                  { label: 'Epsilon-Greedy', value: 'epsilon_greedy' },
                  { label: 'Upper Confidence Bound (UCB)', value: 'ucb' },
                  { label: 'Thompson Sampling', value: 'thompson_sampling' }
                ]}
              />
              <RangeSlider
                label="Exploration Rate (Epsilon)"
                value={10}
                min={0}
                max={100}
                suffix="%"
                onChange={() => {}}
              />
              <Button primary>Configure Bandit</Button>
            </FormLayout>
          </Card>
        );

      default:
        return <div>AB Testing tab: {tabId}</div>;
    }
  };

  //================================================================
  // INTEGRATIONS RENDERERS
  //================================================================

  const renderIntegrationsTab = (tabId) => {
    switch (tabId) {
      case 'int-connections':
        return (
          <Layout>
            <Layout.Section>
              <Card title="Platform Integrations" sectioned>
                <Stack distribution="trailing">
                  <Button primary>Add Integration</Button>
                </Stack>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Platform', 'Status', 'Last Sync', 'Actions']}
                  rows={[
                    ['Shopify', <Badge status="success">Connected</Badge>, '10 min ago', <Button>Test</Button>],
                    ['WooCommerce', <Badge status="success">Connected</Badge>, '1 hour ago', <Button>Test</Button>],
                    ['Magento', <Badge>Inactive</Badge>, 'Never', <Button>Connect</Button>]
                  ]}
                />
              </Card>
            </Layout.Section>
            <Layout.Section secondary>
              <Card title="Integration Stats" sectioned>
                <Stack vertical>
                  <div>Total: {activeData.integrations}</div>
                  <div>Active: {activeData.active}</div>
                  <div>Last Sync: {activeData.synced}</div>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'int-webhooks':
        return (
          <Card title="Webhook Management">
            <Card.Section>
              <Stack distribution="trailing">
                <Button primary>Create Webhook</Button>
              </Stack>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Event', 'Endpoint', 'Status', 'Deliveries']}
                rows={[
                  ['order.created', 'https://api.example.com/hook', <Badge status="success">Active</Badge>, '1,234'],
                  ['customer.updated', 'https://api.example.com/hook2', <Badge status="success">Active</Badge>, '567']
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'int-api-keys':
        return (
          <Card title="API Key Management">
            <Card.Section>
              <Stack distribution="trailing">
                <Button primary>Generate API Key</Button>
              </Stack>
              <DataTable
                columnContentTypes={['text', 'text', 'numeric', 'text']}
                headings={['Name', 'Key Prefix', 'Usage', 'Status']}
                rows={[
                  ['Production API', 'aura_abc123...', '12,345', <Badge status="success">Active</Badge>],
                  ['Development API', 'aura_def456...', '234', <Badge status="success">Active</Badge>]
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'int-sync':
        return (
          <Card sectioned title="Data Synchronization">
            <FormLayout>
              <Select
                label="Integration"
                options={[
                  { label: 'Shopify Store', value: 'shopify_1' },
                  { label: 'WooCommerce Site', value: 'woo_1' }
                ]}
              />
              <Select
                label="Resource"
                options={[
                  { label: 'Products', value: 'products' },
                  { label: 'Customers', value: 'customers' },
                  { label: 'Orders', value: 'orders' }
                ]}
              />
              <ChoiceList
                title="Direction"
                choices={[
                  { label: 'Pull from platform', value: 'pull' },
                  { label: 'Push to platform', value: 'push' }
                ]}
                selected={['pull']}
              />
              <Button primary>Start Sync</Button>
            </FormLayout>
          </Card>
        );

      case 'int-settings':
        return (
          <Card title="Integration Settings">
            <Card.Section>
              <FormLayout>
                <Select
                  label="Category"
                  options={[
                    { label: 'General', value: 'general' },
                    { label: 'API', value: 'api' },
                    { label: 'Webhooks', value: 'webhooks' },
                    { label: 'Security', value: 'security' }
                  ]}
                />
                <TextField label="Setting Key" placeholder="rate_limit" />
                <TextField label="Setting Value" placeholder="1000" />
                <Checkbox label="Encrypt this setting" />
                <Button primary>Save Setting</Button>
              </FormLayout>
            </Card.Section>
          </Card>
        );

      default:
        return <div>Integration tab: {tabId}</div>;
    }
  };

  //================================================================
  // ADVANCED RENDERERS
  //================================================================

  const renderAdvancedTab = (tabId) => {
    switch (tabId) {
      case 'adv-versions':
        return (
          <Layout>
            <Layout.Section>
              <Card title="Version History" sectioned>
                <FormLayout>
                  <Select
                    label="Entity Type"
                    options={[
                      { label: 'Recommendations', value: 'recommendation' },
                      { label: 'Bundles', value: 'bundle' },
                      { label: 'Segments', value: 'segment' },
                      { label: 'Experiments', value: 'experiment' }
                    ]}
                  />
                  <TextField label="Entity ID" />
                  <Button primary>View History</Button>
                </FormLayout>
                <div style={{ marginTop: '20px' }}>
                  <DataTable
                    columnContentTypes={['numeric', 'text', 'text', 'text']}
                    headings={['Version', 'Date', 'User', 'Actions']}
                    rows={[
                      ['3', '2024-01-15 10:30', 'admin@store.com', <Button size="slim">Restore</Button>],
                      ['2', '2024-01-14 14:20', 'admin@store.com', <Button size="slim">Restore</Button>],
                      ['1', '2024-01-13 09:15', 'admin@store.com', <Button size="slim">Restore</Button>]
                    ]}
                  />
                </div>
              </Card>
            </Layout.Section>
            <Layout.Section secondary>
              <Card title="Version Summary" sectioned>
                <Stack vertical>
                  <div>Total Versions: {activeData.versions}</div>
                  <div>Entities: {activeData.entities}</div>
                  <div>Last Restore: {activeData.latestRestore}</div>
                </Stack>
              </Card>
            </Layout.Section>
          </Layout>
        );

      case 'adv-templates':
        return (
          <Card title="Template Library">
            <Card.Section>
              <Stack distribution="trailing">
                <Button primary>Create Template</Button>
              </Stack>
              <DataTable
                columnContentTypes={['text', 'text', 'numeric', 'text']}
                headings={['Template', 'Type', 'Usage', 'Category']}
                rows={[
                  ['High-Value Upsell', 'Recommendation', '45', 'Upsell'],
                  ['Category Bundle', 'Bundle', '23', 'Bundles'],
                  ['VIP Segment', 'Segment', '12', 'Targeting']
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'adv-compliance':
        return (
          <Card sectioned title="Compliance Rules">
            <FormLayout>
              <TextField label="Rule Name" placeholder="GDPR Email Consent" />
              <Select
                label="Compliance Type"
                options={[
                  { label: 'GDPR', value: 'gdpr' },
                  { label: 'CCPA', value: 'ccpa' },
                  { label: 'Email Consent', value: 'email_consent' },
                  { label: 'Data Retention', value: 'data_retention' },
                  { label: 'Price Regulation', value: 'price_regulation' }
                ]}
              />
              <TextField label="Description" multiline={3} />
              <Button primary>Create Rule</Button>
            </FormLayout>
            <div style={{ marginTop: '20px' }}>
              <Banner status="info">
                Active compliance rules: GDPR, CCPA, Email Consent
              </Banner>
            </div>
          </Card>
        );

      case 'adv-audit':
        return (
          <Card title="Audit Logs">
            <Card.Section>
              <FormLayout>
                <Select
                  label="Entity Type"
                  options={[
                    { label: 'All', value: '' },
                    { label: 'Recommendations', value: 'recommendation' },
                    { label: 'Bundles', value: 'bundle' },
                    { label: 'Customers', value: 'customer' }
                  ]}
                />
                <Select
                  label="Action"
                  options={[
                    { label: 'All', value: '' },
                    { label: 'Created', value: 'created' },
                    { label: 'Updated', value: 'updated' },
                    { label: 'Deleted', value: 'deleted' }
                  ]}
                />
                <Button primary>Search Logs</Button>
                <Button>Export Logs</Button>
              </FormLayout>
            </Card.Section>
            <Card.Section>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Timestamp', 'Action', 'Entity', 'User']}
                rows={[
                  ['2024-01-15 10:30', 'Created', 'Bundle #123', 'admin@store.com'],
                  ['2024-01-15 10:25', 'Updated', 'Segment #45', 'admin@store.com'],
                  ['2024-01-15 10:20', 'Deleted', 'Experiment #89', 'admin@store.com']
                ]}
              />
            </Card.Section>
          </Card>
        );

      case 'adv-backup':
        return (
          <Card title="Backup & Restore">
            <Card.Section>
              <Stack distribution="trailing">
                <Button primary>Create Backup</Button>
              </Stack>
              <FormLayout>
                <ChoiceList
                  title="Entities to Backup"
                  choices={[
                    { label: 'Recommendations', value: 'recommendations' },
                    { label: 'Bundles', value: 'bundles' },
                    { label: 'Segments', value: 'segments' },
                    { label: 'Experiments', value: 'experiments' },
                    { label: 'Settings', value: 'settings' }
                  ]}
                  selected={['recommendations', 'bundles']}
                  allowMultiple
                />
              </FormLayout>
            </Card.Section>
            <Card.Section title="Available Backups">
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Name', 'Created', 'Size', 'Actions']}
                rows={[
                  ['Full Backup', '2024-01-15', '2.5 MB', <Button size="slim">Restore</Button>],
                  ['Weekly Backup', '2024-01-08', '2.3 MB', <Button size="slim">Restore</Button>]
                ]}
              />
            </Card.Section>
          </Card>
        );

      default:
        return <div>Advanced tab: {tabId}</div>;
    }
  };

  //================================================================
  // MAIN RENDER
  //================================================================

  return (
    <Page
      title="Upsell & Cross-Sell Engine"
      subtitle="Enterprise recommendation, bundling, targeting, and optimization platform"
    >
      {loading && <ProgressBar progress={75} />}
      
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs
              tabs={tabs.map((tab, index) => ({ id: tab.id, content: tab.label }))}
              selected={selectedTab}
              onSelect={setSelectedTab}
            >
              <Card.Section>
                {renderTabContent(tabs[selectedTab])}
              </Card.Section>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Create New Item"
          primaryAction={{ content: 'Create', onAction: () => setShowModal(false) }}
          secondaryActions={[{ content: 'Cancel', onAction: () => setShowModal(false) }]}
        >
          <Modal.Section>
            <TextContainer>
              <p>Modal content for creating new items</p>
            </TextContainer>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}

export default UpsellCrossSellEngine;
