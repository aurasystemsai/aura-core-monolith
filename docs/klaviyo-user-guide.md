# Klaviyo Flow Automation - User Guide

**Version 2.0** | **Last Updated:** February 11, 2026

Welcome to Klaviyo Flow Automation 2.0 - your world-class platform for building, optimizing, and scaling customer engagement flows.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Managing Flows](#managing-flows)
4. [AI-Powered Optimization](#ai-powered-optimization)
5. [Team Collaboration](#team-collaboration)
6. [Security & Compliance](#security--compliance)
7. [Analytics & Insights](#analytics--insights)
8. [Developer Tools](#developer-tools)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Platform

1. Navigate to **Klaviyo Flow Automation** in the main navigation
2. You'll see 7 main categories:
   - **Manage** - Create and organize flows
   - **Optimize** - Improve performance
   - **Advanced** - AI and ML features
   - **Tools** - Utilities
   - **Monitoring** - Analytics and health
   - **Settings** - Configuration
   - **World-Class** - Enterprise features

### Your First Flow

1. Click the **Manage** category
2. Select **Flows List** tab
3. Click **+ New Flow**
4. Choose a template or start from scratch
5. Configure your trigger (signup, abandoned cart, etc.)
6. Add nodes to build your flow
7. Click **Publish** when ready

---

## Core Features

### 1. Flow Builder

The visual flow builder lets you create sophisticated automation workflows:

**Available Node Types:**
- **Triggers** - What starts the flow (signup, purchase, abandoned cart, etc.)
- **Conditions** - Branch logic based on customer data
- **Actions** - Send email, SMS, push notification
- **Waits** - Time delays or wait for events
- **External Data** - Fetch data from APIs
- **Custom Nodes** - Your own JavaScript logic

**Example Flow Structure:**
```
Trigger: Abandoned Cart
  ↓
Wait: 1 hour
  ↓
Condition: Cart value > $50
  ↓ Yes                    ↓ No
Send High-Value Email    Send Standard Email
  ↓                        ↓
Wait: 24 hours          Wait: 24 hours
  ↓                        ↓
Check: Did they purchase?
```

### 2. Segments Manager

Create dynamic customer segments:

1. Go to **Manage → Segments Manager**
2. Click **+ New Segment**
3. Define criteria:
   - Demographics (age, location, etc.)
   - Behavior (purchase history, engagement)
   - Custom properties
4. Use AI-powered **Smart Split** for optimization

### 3. Templates Library

Access 100+ pre-built flow templates:

- Welcome series
- Abandoned cart recovery
- Post-purchase follow-up
- Win-back campaigns
- Birthday/Anniversary flows
- Product recommendations

**To use a template:**
1. Go to **Manage → Templates Library**
2. Browse or search templates
3. Click **Use Template**
4. Customize to your needs

---

## AI-Powered Optimization

### AI Content Generation

Generate high-quality email content instantly:

1. Navigate to **Advanced → AI Generation**
2. Enter your prompt:
   ```
   Generate 5 subject lines for an abandoned cart email
   promoting a 10% discount for fashion products
   ```
3. Select your AI model (GPT-4 for quality, GPT-3.5 for speed)
4. Click **✨ Generate with AI**
5. Review and select the best option

### AI Orchestration

Optimize costs and quality across multiple AI models:

1. Go to **World-Class → AI Orchestration**
2. View your AI agents (Content Generator, Flow Optimizer, etc.)
3. Configure **Model Routing** to balance cost/quality
4. Set up **Fallback Chains** for reliability
5. Monitor **Cost Optimization** for savings

**Cost Optimization Tips:**
- Route simple tasks to GPT-3.5-turbo (cheaper)
- Use GPT-4 for complex content generation
- Enable batch processing for efficiency
- Cache repetitive prompts

### Predictive Scores

ML-powered predictions for each contact:

- **Engagement Score** - Likelihood to open/click
- **Conversion Score** - Likelihood to purchase
- **Churn Score** - Risk of becoming inactive
- **LTV Prediction** - Estimated lifetime value

Access via **Advanced → Predictive Scores**

---

## Team Collaboration

### Real-Time Collaboration Features

**Live Editing:**
- Multiple team members can edit flows simultaneously
- See live cursors showing who's editing what
- Auto-save prevents conflicts

**Comments & Feedback:**
1. Click any flow node
2. Add a comment with **💬 Comment**
3. Tag teammates with `@username`
4. Comments appear in **Collaboration → Activity Feed**

**Team Management:**
1. Go to **World-Class → Collaboration**
2. Create teams: **+ New Team**
3. Set permissions (read, write, delete)
4. Assign flows to teams

**Activity Feed:**
Track all team actions:
- Flow creations/updates
- Published changes
- Comments and approvals
- Access in **Collaboration → Activity Feed**

---

## Security & Compliance

### Enterprise Security Dashboard

Access via **World-Class → Security**

**Features:**
- ✅ **SSO (Single Sign-On)** - SAML 2.0 integration
- ✅ **MFA (Multi-Factor Auth)** - Required for all users
- ✅ **RBAC (Role-Based Access)** - Granular permissions
- ✅ **Encryption** - AES-256 at rest, TLS 1.3 in transit

### Compliance Management

**Supported Standards:**
- **GDPR** (EU General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **SOC 2** - In progress
- **HIPAA** - Healthcare compliance

**Compliance Features:**
1. Go to **Settings → Compliance Toggles**
2. Enable required regulations:
   - Consent tracking
   - Right to be forgotten
   - Data portability
   - Privacy preferences
3. View status in **Security → Compliance Status**

### Audit Logs

Every action is logged:

1. Navigate to **Monitoring → Audit Logs**
2. Filter by:
   - User
   - Action type
   - Date range
   - Resource
3. Export logs for compliance audits

---

## Analytics & Insights

### Analytics Dashboard

Real-time performance metrics:

**Key Metrics:**
- **Total Flows** - Active and draft count
- **Send Volume** - Messages sent per period
- **Engagement Rate** - Opens, clicks, conversions
- **Revenue Attribution** - Sales from flows

Access via **Monitoring → Analytics Dashboard**

### Predictive BI

Advanced business intelligence:

1. Navigate to **World-Class → Predictive BI**
2. View forecasts:
   - **Revenue Forecast** - Next 3 months
   - **Churn Prediction** - At-risk customers
   - **LTV Analysis** - Customer lifetime value
   - **Cohort Retention** - Retention curves

### Journey Analytics

Visualize customer paths:

1. Go to **Optimize → Journey Analytics**
2. See how customers move through your flows
3. Identify drop-off points
4. Optimize underperforming steps

### A/B Testing

Run experiments:

1. Navigate to **Optimize → A/B Testing**
2. Click **+ New Experiment**
3. Select what to test:
   - Subject lines
   - Send times
   - Content variants
   - Flow structures
4. Set traffic split (50/50, 70/30, etc.)
5. Define success metric
6. Monitor results in real-time

---

## Developer Tools

### API Access

Full REST API with 200+ endpoints:

1. Go to **World-Class → Developer Platform**
2. View **API Documentation**
3. Manage API keys in **Settings → API Keys & Webhooks**

**Quick Start:**
```bash
curl https://api.aura.ai/klaviyo/flows \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Webhooks

Real-time event notifications:

1. Navigate to **World-Class → Developer Platform**
2. Click **Register Webhook**
3. Enter your endpoint URL
4. Select events to subscribe to:
   - `flow.created`
   - `flow.updated`
   - `flow.published`
   - `segment.updated`
5. Test webhook delivery

### SDKs

Official SDKs available:

- **JavaScript/Node.js** - v2.1.0
- **Python** - v2.0.5
- **Ruby** - v2.0.3

```javascript
// JavaScript example
const client = new AuraKlaviyo({ apiKey: 'YOUR_KEY' });
const flows = await client.flows.list();
```

### Sandbox Testing

Test code safely:

1. Go to **Developer Platform → Sandbox**
2. Write custom node logic in JavaScript
3. Test with sample data
4. Deploy to production when ready

---

## Best Practices

### Flow Design

✅ **DO:**
- Keep flows simple and focused
- Use clear, descriptive names
- Test with sample data before publishing
- Set appropriate wait times
- Monitor performance regularly

❌ **DON'T:**
- Create overly complex flows (>15 nodes)
- Send too frequently (respect preferences)
- Ignore engagement metrics
- Forget to segment your audience
- Skip A/B testing

### Performance Optimization

**Flow Optimizer Recommendations:**

1. Navigate to **Optimize → Flow Optimizer**
2. Review AI-generated suggestions:
   - Reduce unnecessary waits
   - Optimize send times
   - Personalize content
   - Add product recommendations
   - Remove low-performing paths

**Channel Optimization:**

Use **Optimize → Channel Optimizer** to:
- Identify best channel per customer (email vs. SMS)
- Optimize send times by timezone
- Balance frequency across channels

### Segment Strategy

**Effective Segmentation:**

1. **Behavioral Segments:**
   - High-value customers (LTV > $500)
   - Engaged users (opened in last 30 days)
   - At-risk customers (no activity in 60 days)

2. **Product Segments:**
   - Category preferences (fashion, electronics, etc.)
   - Price sensitivity (discount seekers vs. premium)
   - Purchase frequency (one-time vs. recurring)

3. **Lifecycle Segments:**
   - New customers (first 30 days)
   - Loyal customers (5+ purchases)
   - Win-back candidates (inactive 90+ days)

Use **Smart Split** to automatically optimize segment divisions.

---

## Troubleshooting

### Common Issues

#### Flow Not Sending

**Check:**
1. Flow status is **Active** (not Draft)
2. Trigger conditions are met
3. Segment has matching contacts
4. No conflicts with other flows
5. Review **Health Checks** for errors

#### Low Engagement

**Solutions:**
1. Run A/B tests on subject lines
2. Optimize send times (check **Journey Analytics**)
3. Improve personalization
4. Segment more granularly
5. Use **Flow Optimizer** recommendations

#### API Errors

**Common Fixes:**
- Verify API key is valid
- Check rate limits (1000/hour)
- Ensure proper authentication header
- Review error messages in response
- Check **APM → Health Status**

#### Performance Issues

**Diagnostics:**
1. Go to **Monitoring → APM Monitoring**
2. Check **Performance Metrics**:
   - Avg Response Time should be <200ms
   - Error Rate should be <1%
3. View **Traces** for slow requests
4. Contact support if issues persist

### Getting Help

**Resources:**
- **Documentation:** [docs.aura.ai/klaviyo](https://docs.aura.ai/klaviyo)
- **API Reference:** [api-docs in platform]
- **Support:** support@aura.ai
- **Community:** [community.aura.ai](https://community.aura.ai)

**Support Tiers:**
- **Community** - Forum support
- **Pro** - Email support (24hr SLA)
- **Enterprise** - 24/7 phone + dedicated CSM

---

## Advanced Features

### White-Label Customization

Enterprise customers can customize branding:

1. Go to **World-Class → White-Label**
2. **Themes:** Create custom color schemes
3. **Branding:** Upload logo, set company name
4. **Custom Domains:** Use your own domain (klaviyo.yourcompany.com)

### APM Monitoring

Application performance monitoring:

1. Navigate to **World-Class → APM Monitoring**
2. View real-time metrics:
   - Response times (avg, p95, p99)
   - Request volume
   - Error rates
   - Service health
3. Set up alerts for anomalies

### Custom ML Models

Build your own predictive models:

1. Go to **Predictive BI → Custom Models**
2. Select model type (regression, classification)
3. Choose features (engagement, revenue, etc.)
4. Define target variable (churn, conversion, etc.)
5. Train model on your data
6. Deploy to production

---

## Quick Reference

### Keyboard Shortcuts

- `Ctrl+N` - New flow
- `Ctrl+S` - Save flow
- `Ctrl+P` - Publish flow
- `Ctrl+F` - Search
- `Ctrl+/` - Command palette
- `Esc` - Close modal

### Status Indicators

- 🟢 **Active** - Flow is running
- 🟡 **Draft** - Not published
- 🔴 **Paused** - Temporarily stopped
- ⚪ **Archived** - Inactive, preserved

### Category Legend

1. **Manage** (8 tabs) - Flow creation and organization
2. **Optimize** (6 tabs) - Performance improvements
3. **Advanced** (6 tabs) - AI and ML features
4. **Tools** (5 tabs) - Utilities and bulk operations
5. **Monitoring** (5 tabs) - Analytics and health
6. **Settings** (5 tabs) - Configuration and preferences
7. **World-Class** (9 tabs) - Enterprise features

---

## Release Notes

### Version 2.0 (February 2026)

**New Features:**
- ✨ 200+ API endpoints (44 new)
- ✨ 44 interactive tabs (7 categories)
- ✨ Multi-model AI orchestration
- ✨ Real-time team collaboration
- ✨ Enterprise security dashboard
- ✨ Predictive BI & analytics
- ✨ Developer platform (API, SDKs, webhooks)
- ✨ White-label customization
- ✨ APM monitoring
- ✨ Edge computing support

**Improvements:**
- 🚀 3x faster flow loading
- 🚀 Enhanced AI content generation
- 🚀 Improved segment performance
- 🚀 Better mobile experience
- 🚀 Upgraded analytics dashboard

**Bug Fixes:**
- Fixed flow duplication edge cases
- Resolved segment caching issues
- Improved error handling
- Enhanced validation

---

**Need more help?** Contact us at support@aura.ai or visit [docs.aura.ai](https://docs.aura.ai)
