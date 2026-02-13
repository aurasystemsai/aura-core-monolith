import React, { useState, useEffect, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Tabs,
  Button,
  DataTable,
  Badge,
  TextField,
  Select,
  Modal,
  TextContainer,
  Stack,
  ButtonGroup,
  Banner,
  ProgressBar,
  Icon,
  Spinner,
  EmptyState,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Text
} from '@shopify/polaris';
import {
  ChartVerticalFilledMajor,
  AnalyticsMajor,
  CustomersMinor,
  SettingsMajor,
  ExportMinor,
  ImportMinor,
  NotificationMajor
} from '@shopify/polaris-icons';
import './ABTestingSuiteV2.css';

/**
 * Comprehensive AB Testing Suite V2
 * 
 * 42 tabs organized into 8 categories:
 * - Statistical Analysis (6 tabs)
 * - Multi-Armed Bandits (5 tabs)
 * - Experimentation Platform (6 tabs)
 * - Analytics & Reporting (6 tabs)
 * - Traffic Management (5 tabs)
 * - Integration & API (5 tabs)
 * - AI & ML Optimization (5 tabs)
 * - Advanced Features (4 tabs)
 */

const ABTestingSuiteV2 = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [modalActive, setModalActive] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [stats, setStats] = useState({});

  // Fetch experiments on mount
  useEffect(() => {
    fetchExperiments();
    fetchStats();
  }, []);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tools/ab-testing-suite/experiments');
      const data = await response.json();
      if (data.success) {
        setExperiments(data.result || []);
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tools/ab-testing-suite/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // ==================== STATISTICAL ANALYSIS TABS (6) ====================

  const FrequentistTestsTab = () => {
    const [testType, setTestType] = useState('z-test');
    const [controlConv, setControlConv] = useState('');
    const [controlSamples, setControlSamples] = useState('');
    const [treatmentConv, setTreatmentConv] = useState('');
    const [treatmentSamples, setTreatmentSamples] = useState('');
    const [result, setResult] = useState(null);

    const runTest = async () => {
      const endpoint = testType === 'z-test' ? '/statistical/z-test' : '/statistical/t-test';
      const response = await fetch(`/api/tools/ab-testing-suite${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          control: { conversions: parseInt(controlConv), samples: parseInt(controlSamples) },
          treatment: { conversions: parseInt(treatmentConv), samples: parseInt(treatmentSamples) }
        })
      });
      const data = await response.json();
      setResult(data.result);
    };

    return (
      <Card sectioned>
        <Stack vertical>
          <Select
            label="Test Type"
            options={[
              { label: 'Z-Test (Proportions)', value: 'z-test' },
              { label: 'T-Test (Means)', value: 't-test' },
              { label: 'Chi-Square', value: 'chi-square' }
            ]}
            value={testType}
            onChange={setTestType}
          />
          <Stack distribution="fillEvenly">
            <TextField label="Control Conversions" value={controlConv} onChange={setControlConv} type="number" />
            <TextField label="Control Samples" value={controlSamples} onChange={setControlSamples} type="number" />
          </Stack>
          <Stack distribution="fillEvenly">
            <TextField label="Treatment Conversions" value={treatmentConv} onChange={setTreatmentConv} type="number" />
            <TextField label="Treatment Samples" value={treatmentSamples} onChange={setTreatmentSamples} type="number" />
          </Stack>
          <Button primary onClick={runTest}>Run Test</Button>
          {result && (
            <Banner status={result.significant ? 'success' : 'info'}>
              <p>P-value: {result.pValue?.toFixed(4)}</p>
              <p>Significant: {result.significant ? 'Yes' : 'No'}</p>
              <p>Lift: {result.lift ? `${(result.lift * 100).toFixed(2)}%` : 'N/A'}</p>
            </Banner>
          )}
        </Stack>
      </Card>
    );
  };

  const BayesianAnalysisTab = () => {
    const [controlConv, setControlConv] = useState('');
    const [controlSamples, setControlSamples] = useState('');
    const [treatmentConv, setTreatmentConv] = useState('');
    const [treatmentSamples, setTreatmentSamples] = useState('');
    const [result, setResult] = useState(null);

    const runBayesian = async () => {
      const response = await fetch('/api/tools/ab-testing-suite/statistical/bayesian-ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          control: { conversions: parseInt(controlConv), samples: parseInt(controlSamples) },
          treatment: { conversions: parseInt(treatmentConv), samples: parseInt(treatmentSamples) }
        })
      });
      const data = await response.json();
      setResult(data.result);
    };

    return (
      <Card sectioned>
        <Stack vertical>
          <Text variant="headingMd">Bayesian A/B Test</Text>
          <Stack distribution="fillEvenly">
            <TextField label="Control Conversions" value={controlConv} onChange={setControlConv} type="number" />
            <TextField label="Control Samples" value={controlSamples} onChange={setControlSamples} type="number" />
          </Stack>
          <Stack distribution="fillEvenly">
            <TextField label="Treatment Conversions" value={treatmentConv} onChange={setTreatmentConv} type="number" />
            <TextField label="Treatment Samples" value={treatmentSamples} onChange={setTreatmentSamples} type="number" />
          </Stack>
          <Button primary onClick={runBayesian}>Run Bayesian Analysis</Button>
          {result && (
            <Card>
              <Card.Section>
                <p>Probability Treatment Beats Control: {(result.probabilityBBeatsA * 100).toFixed(2)}%</p>
                <p>Expected Loss Control: {result.expectedLossA?.toFixed(4)}</p>
                <p>Expected Loss Treatment: {result.expectedLossB?.toFixed(4)}</p>
                <p>Credible Interval: [{result.credibleInterval?.lower.toFixed(3)}, {result.credibleInterval?.upper.toFixed(3)}]</p>
              </Card.Section>
            </Card>
          )}
        </Stack>
      </Card>
    );
  };

  const SequentialTestingTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Sequential Testing (SPRT)</Text>
        <Banner>
          <p>Continuous monitoring without Type I error inflation</p>
        </Banner>
        <TextField label="Experiment ID" placeholder="exp_123" />
        <Button primary>Start Sequential Test</Button>
      </Stack>
    </Card>
  );

  const PowerAnalysisTab = () => {
    const [baselineRate, setBaselineRate] = useState('');
    const [mde, setMde] = useState('');
    const [alpha, setAlpha] = useState('0.05');
    const [power, setPower] = useState('0.80');
    const [sampleSize, setSampleSize] = useState(null);

    const calculateSample = async () => {
      const response = await fetch('/api/tools/ab-testing-suite/statistical/sample-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baselineRate: parseFloat(baselineRate),
          minimumDetectableEffect: parseFloat(mde),
          alpha: parseFloat(alpha),
          power: parseFloat(power),
          numVariants: 2
        })
      });
      const data = await response.json();
      setSampleSize(data.result);
    };

    return (
      <Card sectioned>
        <Stack vertical>
          <Text variant="headingMd">Power Analysis & Sample Size</Text>
          <TextField label="Baseline Rate (%)" value={baselineRate} onChange={setBaselineRate} type="number" />
          <TextField label="Minimum Detectable Effect (%)" value={mde} onChange={setMde} type="number" />
          <Stack distribution="fillEvenly">
            <TextField label="Alpha (Significance)" value={alpha} onChange={setAlpha} type="number" />
            <TextField label="Power" value={power} onChange={setPower} type="number" />
          </Stack>
          <Button primary onClick={calculateSample}>Calculate Sample Size</Button>
          {sampleSize && (
            <Banner status="info">
              <p>Required Sample Size per Variant: {sampleSize.samplesPerVariant}</p>
              <p>Total Samples Needed: {sampleSize.totalSamples}</p>
            </Banner>
          )}
        </Stack>
      </Card>
    );
  };

  const MetaAnalysisTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Meta-Analysis</Text>
        <Select
          label="Method"
          options={[
            { label: 'Fixed-Effects', value: 'fixed' },
            { label: 'Random-Effects (DerSimonian-Laird)', value: 'random' }
          ]}
        />
        <Button primary>Run Meta-Analysis</Button>
      </Stack>
    </Card>
  );

  const ConfidenceIntervalsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Confidence Intervals</Text>
        <Select
          label="Method"
          options={[
            { label: 'Bootstrap (10,000 iterations)', value: 'bootstrap' },
            { label: 'Analytical (Proportions)', value: 'analytical' }
          ]}
        />
        <TextField label="Confidence Level (%)" value="95" type="number" />
        <Button primary>Calculate CI</Button>
      </Stack>
    </Card>
  );

  // ==================== MULTI-ARMED BANDIT TABS (5) ====================

  const ThompsonSamplingTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Thompson Sampling</Text>
        <Select
          label="Reward Type"
          options={[
            { label: 'Binary (Beta Distribution)', value: 'binary' },
            { label: 'Continuous (Normal-Gamma)', value: 'continuous' }
          ]}
        />
        <TextField label="Experiment ID" placeholder="bandit_exp_1" />
        <TextField label="Arms (comma-separated)" placeholder="variant_a,variant_b,variant_c" />
        <Button primary>Initialize Thompson Sampling</Button>
      </Stack>
    </Card>
  );

  const UCBAlgorithmsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Upper Confidence Bound (UCB)</Text>
        <Select
          label="Variant"
          options={[
            { label: 'UCB1 (Standard)', value: 'ucb1' },
            { label: 'UCB-Tuned (Variance-Aware)', value: 'ucb-tuned' }
          ]}
        />
        <Button primary>Initialize UCB</Button>
      </Stack>
    </Card>
  );

  const EpsilonGreedyTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Epsilon-Greedy</Text>
        <TextField label="Initial Epsilon" value="0.1" type="number" />
        <TextField label="Decay Rate" value="0.99" type="number" />
        <Banner>Balances exploration vs exploitation with decay</Banner>
        <Button primary>Initialize Epsilon-Greedy</Button>
      </Stack>
    </Card>
  );

  const Exp3Tab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Exp3 (Adversarial Bandit)</Text>
        <TextField label="Gamma" value="0.1" type="number" />
        <Banner>For non-stationary rewards, weight-based probability distribution</Banner>
        <Button primary>Initialize Exp3</Button>
      </Stack>
    </Card>
  );

  const ContextualBanditsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Contextual Bandits (LinUCB)</Text>
        <TextField label="Number of Features" value="5" type="number" />
        <TextField label="Alpha (Exploration)" value="1.0" type="number" />
        <Banner>Ridge regression with matrix operations for feature weighting</Banner>
        <Button primary>Initialize LinUCB</Button>
      </Stack>
    </Card>
  );

  // ==================== EXPERIMENTATION PLATFORM TABS (6) ====================

  const ExperimentsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Stack distribution="equalSpacing">
          <Text variant="headingMd">Experiments</Text>
          <Button primary onClick={() => setModalActive(true)}>Create Experiment</Button>
        </Stack>
        {experiments.length > 0 ? (
          <DataTable
            columnContentTypes={['text', 'text', 'text', 'numeric', 'text']}
            headings={['Name', 'Status', 'Type', 'Variants', 'Actions']}
            rows={experiments.map(exp => [
              exp.name,
              <Badge status={exp.status === 'active' ? 'success' : 'info'}>{exp.status}</Badge>,
              exp.type || 'AB',
              exp.variants?.length || 2,
              <Button plain onClick={() => setSelectedExperiment(exp)}>View</Button>
            ])}
          />
        ) : (
          <EmptyState
            heading="No experiments yet"
            action={{ content: 'Create Experiment', onAction: () => setModalActive(true) }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          />
        )}
      </Stack>
    </Card>
  );

  const MultivariateTestingTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Multivariate Testing (MVT)</Text>
        <Select
          label="Factorial Design"
          options={[
            { label: 'Full Factorial', value: 'full' },
            { label: 'Fractional Factorial (Resolution III)', value: 'fractional-3' },
            { label: 'Fractional Factorial (Resolution IV)', value: 'fractional-4' }
          ]}
        />
        <TextField label="Factors (JSON)" placeholder='[{"name":"color","levels":["red","blue"]},{"name":"cta","levels":["buy","shop"]}]' multiline={3} />
        <Button primary>Create MVT</Button>
      </Stack>
    </Card>
  );

  const HoldoutGroupsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Holdout Groups</Text>
        <TextField label="Holdout Percentage" value="10" type="number" suffix="%" />
        <Banner>Users excluded from experiment for causal effect measurement</Banner>
        <Button primary>Create Holdout</Button>
      </Stack>
    </Card>
  );

  const FeatureFlagsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Feature Flags</Text>
        <TextField label="Flag Name" placeholder="new_checkout_flow" />
        <TextField label="Rollout Percentage" value="0" type="number" suffix="%" />
        <TextField label="Increment By" value="10" type="number" suffix="%" />
        <TextField label="Interval (minutes)" value="60" type="number" />
        <Button primary>Create Feature Flag</Button>
      </Stack>
    </Card>
  );

  const GuardrailMetricsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Guardrail Metrics</Text>
        <Select
          label="Type"
          options={[
            { label: 'Threshold (Absolute)', value: 'threshold' },
            { label: 'Change (Percentage)', value: 'change' },
            { label: 'Ratio', value: 'ratio' }
          ]}
        />
        <TextField label="Metric Name" placeholder="revenue_per_user" />
        <TextField label="Threshold Value" type="number" />
        <Button primary>Initialize Guardrails</Button>
      </Stack>
    </Card>
  );

  const ValidationTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Experiment Validation</Text>
        <Banner status="info">
          <p>Validates weights, metrics, dates, traffic allocation</p>
          <p>Detects conflicts with audience overlap detection</p>
        </Banner>
        <Button primary>Validate All Experiments</Button>
      </Stack>
    </Card>
  );

  // ==================== ANALYTICS & REPORTING TABS (6) ====================

  const MetricsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Real-Time Metrics</Text>
        <Banner>Mean, median, stdDev, percentiles (25/50/75/90/95/99)</Banner>
        <TextField label="Experiment ID" />
        <TextField label="Variant" />
        <TextField label="Metric Name" placeholder="conversion_rate" />
        <Button primary>View Metrics</Button>
      </Stack>
    </Card>
  );

  const FunnelsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Funnel Analysis</Text>
        <TextField label="Funnel Name" placeholder="Checkout Funnel" />
        <TextField label="Steps (comma-separated)" placeholder="view_product,add_to_cart,checkout,purchase" />
        <Button primary>Create Funnel</Button>
        <Button>Analyze Funnel</Button>
      </Stack>
    </Card>
  );

  const CohortsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Cohort Analysis</Text>
        <TextField label="Cohort Name" placeholder="Week 1 Users" />
        <TextField label="Start Date" type="date" />
        <Banner>Day 1/7/30 retention tracking</Banner>
        <Button primary>Create Cohort</Button>
        <Button>Calculate Retention</Button>
      </Stack>
    </Card>
  );

  const TimeSeriesTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Time-Series Analysis</Text>
        <Select
          label="Granularity"
          options={[
            { label: 'Minute', value: 'minute' },
            { label: 'Hour', value: 'hour' },
            { label: 'Day', value: 'day' }
          ]}
        />
        <Button primary>Aggregate Time-Series</Button>
        <Button>Detect Trends (Linear Regression + R²)</Button>
      </Stack>
    </Card>
  );

  const DashboardsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Dashboards</Text>
        <TextField label="Dashboard Name" placeholder="Experiment Overview" />
        <Banner>Widget types: metric, chart, funnel, cohort</Banner>
        <Button primary>Create Dashboard</Button>
        <Button>Refresh All Dashboards</Button>
      </Stack>
    </Card>
  );

  const ReportsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Reports & Export</Text>
        <Select
          label="Report Type"
          options={[
            { label: 'Summary', value: 'summary' },
            { label: 'Comprehensive', value: 'comprehensive' }
          ]}
        />
        <Select
          label="Export Format"
          options={[
            { label: 'JSON', value: 'json' },
            { label: 'CSV', value: 'csv' },
            { label: 'HTML', value: 'html' }
          ]}
        />
        <Button primary>Generate Report</Button>
        <Button icon={ExportMinor}>Export</Button>
      </Stack>
    </Card>
  );

  // ==================== TRAFFIC MANAGEMENT TABS (5) ====================

  const TrafficAllocationTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Traffic Allocation</Text>
        <Select
          label="Method"
          options={[
            { label: 'Hash-based (Consistent)', value: 'hash' },
            { label: 'Weighted', value: 'weighted' },
            { label: 'Round-Robin', value: 'round-robin' },
            { label: 'Random', value: 'random' }
          ]}
        />
        <Button primary>Create Traffic Rule</Button>
      </Stack>
    </Card>
  );

  const AudienceTargetingTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Audience Targeting</Text>
        <TextField label="Audience Name" placeholder="High-Value Customers" />
        <Banner>10 operators: equals, in, regex, gt, lt, contains, etc.</Banner>
        <TextField label="Rules (JSON)" multiline={3} />
        <Button primary>Create Audience</Button>
      </Stack>
    </Card>
  );

  const GradualRolloutTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Gradual Rollout</Text>
        <TextField label="Start Percentage" value="5" type="number" suffix="%" />
        <TextField label="End Percentage" value="100" type="number" suffix="%" />
        <TextField label="Increment" value="10" type="number" suffix="%" />
        <TextField label="Interval (hours)" value="24" type="number" />
        <ButtonGroup>
          <Button primary>Create Ramp</Button>
          <Button>Pause</Button>
          <Button>Resume</Button>
        </ButtonGroup>
      </Stack>
    </Card>
  );

  const CrossDeviceTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Cross-Device Tracking</Text>
        <TextField label="User ID" />
        <TextField label="Device ID" />
        <Select
          label="Device Type"
          options={[
            { label: 'Desktop', value: 'desktop' },
            { label: 'Mobile', value: 'mobile' },
            { label: 'Tablet', value: 'tablet' }
          ]}
        />
        <Button primary>Link Devices</Button>
        <Button>Sync Assignment Across Devices</Button>
      </Stack>
    </Card>
  );

  const BotDetectionTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Bot Detection</Text>
        <Banner>Scoring: User agent +50, Request rate &gt;60/min +30, Behavior +40</Banner>
        <TextField label="User Agent" multiline={2} />
        <Button primary>Detect Bot</Button>
        <Button>Filter Bot Traffic from Experiment</Button>
      </Stack>
    </Card>
  );

  // ==================== INTEGRATION & API TABS (5) ====================

  const WebhooksTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Webhooks</Text>
        <TextField label="URL" placeholder="https://example.com/webhook" />
        <TextField label="Events (comma-separated)" placeholder="experiment.started,experiment.completed" />
        <Banner>Retry policy: Max 3, exponential backoff. HMAC SHA256 signature.</Banner>
        <Button primary>Register Webhook</Button>
      </Stack>
    </Card>
  );

  const APIKeysTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">API Keys</Text>
        <TextField label="Key Name" placeholder="Production API" />
        <TextField label="Scopes (comma-separated)" placeholder="read,write,admin" />
        <TextField label="Rate Limit (per minute)" value="1000" type="number" />
        <TextField label="Expires In (days)" value="90" type="number" />
        <Button primary>Create API Key</Button>
      </Stack>
    </Card>
  );

  const PlatformIntegrationsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Platform Integrations</Text>
        <Select
          label="Platform"
          options={[
            { label: 'Google Analytics', value: 'google_analytics' },
            { label: 'Amplitude', value: 'amplitude' },
            { label: 'Mixpanel', value: 'mixpanel' },
            { label: 'Segment', value: 'segment' },
            { label: 'Salesforce', value: 'salesforce' },
            { label: 'HubSpot', value: 'hubspot' }
          ]}
        />
        <TextField label="Credentials (JSON)" multiline={3} />
        <Button primary icon={ImportMinor}>Sync to Platform</Button>
      </Stack>
    </Card>
  );

  const DataExportTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Data Export</Text>
        <Select
          label="Destination"
          options={[
            { label: 'BigQuery', value: 'bigquery' },
            { label: 'Snowflake', value: 'snowflake' },
            { label: 'Redshift', value: 'redshift' },
            { label: 'Amazon S3', value: 's3' },
            { label: 'Google Cloud Storage', value: 'gcs' }
          ]}
        />
        <Select
          label="Format"
          options={[
            { label: 'JSON', value: 'json' },
            { label: 'CSV', value: 'csv' },
            { label: 'Parquet', value: 'parquet' }
          ]}
        />
        <Button primary icon={ExportMinor}>Execute Export</Button>
      </Stack>
    </Card>
  );

  const StreamingTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Real-Time Streaming</Text>
        <Select
          label="Platform"
          options={[
            { label: 'Apache Kafka', value: 'kafka' },
            { label: 'AWS Kinesis', value: 'kinesis' },
            { label: 'Google Pub/Sub', value: 'pubsub' }
          ]}
        />
        <TextField label="Batch Size" value="100" type="number" />
        <TextField label="Flush Interval (ms)" value="5000" type="number" />
        <ButtonGroup>
          <Button primary>Create Stream</Button>
          <Button>Publish Event</Button>
          <Button>Flush</Button>
        </ButtonGroup>
      </Stack>
    </Card>
  );

  // ==================== AI & ML OPTIMIZATION TABS (5) ====================

  const WinnerSelectionTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Automated Winner Selection</Text>
        <TextField label="Experiment ID" />
        <TextField label="Confidence Threshold" value="0.95" type="number" />
        <Banner>Recommendations: DEPLOY_WINNER, CONTINUE_TEST, KEEP_CONTROL</Banner>
        <Button primary>Analyze for Winner</Button>
      </Stack>
    </Card>
  );

  const PredictionsTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Duration & Sample Predictions</Text>
        <TextField label="Experiment ID" />
        <TextField label="Traffic per Day" type="number" />
        <Button primary>Predict Duration</Button>
        <Button>Estimate Required Samples</Button>
        <Button>Recommend Sample Size</Button>
      </Stack>
    </Card>
  );

  const AnomaliesTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Anomaly Detection</Text>
        <Banner>Z-score (3-sigma), trend deviation (50% threshold)</Banner>
        <TextField label="Experiment ID" />
        <TextField label="Metric Name" />
        <TextField label="Threshold" value="3" type="number" />
        <Button primary icon={NotificationMajor}>Detect Anomalies</Button>
      </Stack>
    </Card>
  );

  const HypothesesTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Hypothesis Generation</Text>
        <Banner>Auto-generates for low conversion, high cart abandonment, low AOV</Banner>
        <TextField label="Experiment Data (JSON)" multiline={4} />
        <Button primary>Generate Hypotheses</Button>
      </Stack>
    </Card>
  );

  const CausalInferenceTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Causal Inference & Uplift</Text>
        <TextField label="Experiment ID" />
        <Select
          label="Segment By"
          options={[
            { label: 'User Type', value: 'user_type' },
            { label: 'Value Segment', value: 'value' },
            { label: 'Geography', value: 'geo' }
          ]}
        />
        <Banner>ATE (Average Treatment Effect) + CATE by segment</Banner>
        <Button primary>Estimate Causal Effect</Button>
        <Button>Generate Personalization Recommendations</Button>
      </Stack>
    </Card>
  );

  // ==================== ADVANCED FEATURES TABS (4) ====================

  const VersionControlTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Version Control</Text>
        <Select
          label="Entity Type"
          options={[
            { label: 'Experiment', value: 'experiment' },
            { label: 'Feature Flag', value: 'feature_flag' },
            { label: 'Audience', value: 'audience' }
          ]}
        />
        <TextField label="Entity ID" />
        <TextField label="Description" multiline={2} />
        <ButtonGroup>
          <Button primary>Create Version</Button>
          <Button>View History</Button>
          <Button>Compare Versions</Button>
          <Button>Restore</Button>
        </ButtonGroup>
      </Stack>
    </Card>
  );

  const TemplatesTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Template Library</Text>
        <TextField label="Template Name" placeholder="Pricing Test Template" />
        <Select
          label="Category"
          options={[
            { label: 'Pricing', value: 'pricing' },
            { label: 'UI', value: 'ui' },
            { label: 'Messaging', value: 'messaging' },
            { label: 'Flow', value: 'flow' },
            { label: 'Feature', value: 'feature' }
          ]}
        />
        <TextField label="Tags (comma-separated)" placeholder="conversion,checkout" />
        <TextField label="Template Data (JSON)" multiline={4} />
        <ButtonGroup>
          <Button primary>Create Template</Button>
          <Button>Apply Template</Button>
          <Button>List Templates</Button>
        </ButtonGroup>
      </Stack>
    </Card>
  );

  const ComplianceTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Compliance & Audit</Text>
        <Select
          label="Rule Type"
          options={[
            { label: 'Data Retention', value: 'data-retention' },
            { label: 'Consent Required', value: 'consent' },
            { label: 'Geographic Restriction', value: 'geographic' },
            { label: 'Budget Limit', value: 'budget-limit' }
          ]}
        />
        <Select
          label="Action"
          options={[
            { label: 'Block', value: 'block' },
            { label: 'Warn', value: 'warn' },
            { label: 'Require Approval', value: 'require-approval' }
          ]}
        />
        <TextField label="Condition (JSON)" multiline={3} />
        <ButtonGroup>
          <Button primary>Create Rule</Button>
          <Button>Check Compliance</Button>
          <Button icon={ExportMinor}>Export Audit Logs</Button>
        </ButtonGroup>
      </Stack>
    </Card>
  );

  const GovernanceTab = () => (
    <Card sectioned>
      <Stack vertical>
        <Text variant="headingMd">Governance & Operations</Text>
        <Banner status="info">
          <p>Backup & Restore: Full snapshots with versions</p>
          <p>Approval Workflows: Multi-approver support</p>
          <p>Scheduling: Daily/weekly/monthly recurrence</p>
          <p>Cost Tracking: By category (infrastructure, traffic, analysis, personnel)</p>
        </Banner>
        <ButtonGroup>
          <Button primary>Create Backup</Button>
          <Button>Request Approval</Button>
          <Button>Schedule Experiment</Button>
          <Button>Track Cost</Button>
        </ButtonGroup>
      </Stack>
    </Card>
  );

  // Tab definitions
  const tabs = [
    // Statistical Analysis (6)
    { id: 'freq-tests', content: 'Frequentist Tests', component: <FrequentistTestsTab /> },
    { id: 'bayesian', content: 'Bayesian', component: <BayesianAnalysisTab /> },
    { id: 'sequential', content: 'Sequential', component: <SequentialTestingTab /> },
    { id: 'power', content: 'Power Analysis', component: <PowerAnalysisTab /> },
    { id: 'meta', content: 'Meta-Analysis', component: <MetaAnalysisTab /> },
    { id: 'ci', content: 'Confidence Intervals', component: <ConfidenceIntervalsTab /> },
    
    // Multi-Armed Bandits (5)
    { id: 'thompson', content: 'Thompson', component: <ThompsonSamplingTab /> },
    { id: 'ucb', content: 'UCB', component: <UCBAlgorithmsTab /> },
    { id: 'epsilon', content: 'Epsilon-Greedy', component: <EpsilonGreedyTab /> },
    { id: 'exp3', content: 'Exp3', component: <Exp3Tab /> },
    { id: 'contextual', content: 'Contextual', component: <ContextualBanditsTab /> },
    
    // Experimentation (6)
    { id: 'experiments', content: 'Experiments', component: <ExperimentsTab /> },
    { id: 'mvt', content: 'MVT', component: <MultivariateTestingTab /> },
    { id: 'holdout', content: 'Holdout', component: <HoldoutGroupsTab /> },
    { id: 'feature-flags', content: 'Feature Flags', component: <FeatureFlagsTab /> },
    { id: 'guardrails', content: 'Guardrails', component: <GuardrailMetricsTab /> },
    { id: 'validation', content: 'Validation', component: <ValidationTab /> },
    
    // Analytics (6)
    { id: 'metrics', content: 'Metrics', component: <MetricsTab /> },
    { id: 'funnels', content: 'Funnels', component: <FunnelsTab /> },
    { id: 'cohorts', content: 'Cohorts', component: <CohortsTab /> },
    { id: 'timeseries', content: 'Time-Series', component: <TimeSeriesTab /> },
    { id: 'dashboards', content: 'Dashboards', component: <DashboardsTab /> },
    { id: 'reports', content: 'Reports', component: <ReportsTab /> },
    
    // Traffic (5)
    { id: 'allocation', content: 'Allocation', component: <TrafficAllocationTab /> },
    { id: 'audiences', content: 'Audiences', component: <AudienceTargetingTab /> },
    { id: 'rollout', content: 'Rollout', component: <GradualRolloutTab /> },
    { id: 'cross-device', content: 'Cross-Device', component: <CrossDeviceTab /> },
    { id: 'bot-detection', content: 'Bot Detection', component: <BotDetectionTab /> },
    
    // Integrations (5)
    { id: 'webhooks', content: 'Webhooks', component: <WebhooksTab /> },
    { id: 'api-keys', content: 'API Keys', component: <APIKeysTab /> },
    { id: 'platforms', content: 'Platforms', component: <PlatformIntegrationsTab /> },
    { id: 'export', content: 'Export', component: <DataExportTab /> },
    { id: 'streaming', content: 'Streaming', component: <StreamingTab /> },
    
    // AI/ML (5)
    { id: 'winner', content: 'Winner', component: <WinnerSelectionTab /> },
    { id: 'predictions', content: 'Predictions', component: <PredictionsTab /> },
    { id: 'anomalies', content: 'Anomalies', component: <AnomaliesTab /> },
    { id: 'hypotheses', content: 'Hypotheses', component: <HypothesesTab /> },
    { id: 'causal', content: 'Causal', component: <CausalInferenceTab /> },
    
    // Advanced (4)
    { id: 'versions', content: 'Versions', component: <VersionControlTab /> },
    { id: 'templates', content: 'Templates', component: <TemplatesTab /> },
    { id: 'compliance', content: 'Compliance', component: <ComplianceTab /> },
    { id: 'governance', content: 'Governance', component: <GovernanceTab /> }
  ];

  return (
    <Page
      title="AB Testing Suite V2"
      subtitle="Comprehensive experimentation platform with 246 endpoints"
      primaryAction={{ content: 'View Health', icon: AnalyticsMajor, onAction: () => {} }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Card.Section>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spinner size="large" />
                  </div>
                ) : (
                  tabs[selectedTab].component
                )}
              </Card.Section>
            </Tabs>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Platform Stats" sectioned>
            <Stack vertical>
              <Text variant="bodyMd">Total Experiments: {stats.totalExperiments || 0}</Text>
              <Text variant="bodyMd">Active: {stats.activeExperiments || 0}</Text>
              <Text variant="bodyMd">Bandit Models: {stats.banditModels || 0}</Text>
              <Text variant="bodyMd">Dashboards: {stats.dashboards || 0}</Text>
              <Text variant="bodyMd">AI Models: {stats.aiModels || 0}</Text>
            </Stack>
          </Card>

          <Card title="System Info" sectioned>
            <Stack vertical>
              <Text variant="bodyMd">Version: 2.0.0</Text>
              <Text variant="bodyMd">Total Endpoints: 246</Text>
              <Text variant="bodyMd">Modules: 8</Text>
              <Button plain icon={SettingsMajor}>Settings</Button>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={modalActive}
        onClose={() => setModalActive(false)}
        title="Create Experiment"
        primaryAction={{ content: 'Create', onAction: () => setModalActive(false) }}
        secondaryActions={[{ content: 'Cancel', onAction: () => setModalActive(false) }]}
      >
        <Modal.Section>
          <Stack vertical>
            <TextField label="Experiment Name" placeholder="Homepage CTA Test" />
            <TextField label="Description" multiline={3} />
            <Select
              label="Type"
              options={[
                { label: 'A/B Test', value: 'ab' },
                { label: 'Multivariate Test', value: 'mvt' },
                { label: 'Multi-Armed Bandit', value: 'bandit' }
              ]}
            />
            <TextField label="Variants (comma-separated)" placeholder="control,variant_a,variant_b" />
          </Stack>
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default ABTestingSuiteV2;
