# Aura CDP - Customer Onboarding Guide

**Welcome to Aura CDP!** This guide will help you get started with the most powerful customer data platform for e-commerce brands.

---

## 📋 Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Initial Setup](#initial-setup)
3. [First Campaign](#first-campaign)
4. [Advanced Features](#advanced-features)
5. [Support & Resources](#support--resources)

---

## Quick Start (5 Minutes)

### Step 1: Connect Your Shopify Store (2 min)

1. Log in to your Aura CDP account
2. Navigate to **Settings → Integrations**
3. Click **Connect Shopify Store**
4. Enter your Shopify store URL (e.g., `your-store.myshopify.com`)
5. Click **Authorize** and approve the app installation

**What happens next?**
- Aura automatically imports your last 90 days of customer data
- Real-time sync begins for new orders, customers, and events
- Initial profile enrichment runs in the background (15-30 minutes)

### Step 2: Verify Data Import (1 min)

1. Go to **Dashboard → Overview**
2. Check these metrics:
   - **Total Profiles**: Should match your Shopify customer count
   - **Events Tracked**: Orders, cart updates, page views
   - **Sync Status**: Should show "Active" with green indicator

✅ **Success Indicator**: You should see your total customer count and recent orders appearing in the dashboard.

### Step 3: Create Your First Segment (2 min)

Let's create a high-value customer segment:

1. Navigate to **Audiences → Segments**
2. Click **Create New Segment**
3. Name it: `High-Value Customers`
4. Add conditions:
   - `Lifetime Value` **greater than** `$500`
   - `Orders` **greater than or equal to** `3`
   - `Last Purchase Date` **within last** `90 days`
5. Click **Save & Calculate**

**Expected result**: Segment calculates in 10-30 seconds, showing your top customers ready for activation.

---

## Initial Setup

### Account Configuration

#### 1. Business Profile Setup

Complete your business profile for better personalization:

- **Company Name**: Your brand name
- **Industry**: Select your vertical (Fashion, Beauty, Electronics, etc.)
- **Average Order Value**: Used for benchmarking and predictions
- **Time Zone**: Ensures accurate reporting
- **Currency**: Default currency for revenue reporting

📍 Location: **Settings → Business Profile**

#### 2. Team Members

Invite your team with role-based access:

- **Admin**: Full access to all features and settings
- **Marketer**: Create campaigns, view reports, manage segments
- **Analyst**: View-only access to reports and analytics
- **Developer**: API access, integration management

📍 Location: **Settings → Team & Permissions**

**Recommended Setup:**
- CMO/Marketing Director → Admin
- Marketing Manager → Marketer  
- Data Analyst → Analyst
- Engineering Lead → Developer

#### 3. Brand Assets

Upload your brand assets for better email personalization:

- **Logo** (PNG, max 500KB)
- **Brand Colors** (primary, secondary, accent)
- **Email Templates** (drag-and-drop editor)
- **Social Media Links**

📍 Location: **Settings → Branding**

### Data Integration

#### Connect Additional Data Sources

Beyond Shopify, connect these integrations:

**Marketing Channels:**
- **Klaviyo** (email marketing sync)
- **Facebook Ads** (attribution tracking)
- **Google Ads** (conversion tracking)
- **TikTok** (event tracking)

**Customer Service:**
- **Gorgias** (support ticket context)
- **Zendesk** (customer feedback)

**Analytics:**
- **Google Analytics** (web behavior)
- **Segment** (event streaming)

📍 Location: **Settings → Integrations**

#### Event Tracking Setup

Install the Aura JavaScript SDK on your storefront:

```html
<!-- Add to your theme.liquid before </head> -->
<script>
  (function(a,u,r,p){
    a[p]=a[p]||function(){(a[p].q=a[p].q||[]).push(arguments)};
    var s=u.createElement('script');s.async=1;s.src=r;
    u.getElementsByTagName('head')[0].appendChild(s);
  })(window,document,'https://cdn.auracdp.com/sdk.js','aura');
  
  aura('init', 'YOUR_PUBLIC_KEY');
  aura('page');
</script>
```

**Events automatically tracked:**
- Page views
- Product views
- Add to cart
- Checkout started
- Purchase completed
- Search queries
- Email clicks

📍 Find your public key: **Settings → API Keys**

---

## First Campaign

### Email Welcome Series

Create your first automated email campaign:

#### Step 1: Navigate to Email Automation

1. Go to **Automation → Email**
2. Click **Create New Flow**
3. Select template: **Welcome Series**

#### Step 2: Configure Trigger

- **Trigger**: Customer subscribed
- **Frequency**: Once per customer
- **Delay**: Send immediately

#### Step 3: Build Email Sequence

**Email 1: Welcome (Immediate)**
- Subject: `Welcome to [Your Brand]! Here's 10% off`
- Content: Brand story, discount code, product highlights
- CTA: Shop Now

**Email 2: Product Education (Day 3)**
- Subject: `How to get the most out of [Product Category]`
- Content: Use cases, customer reviews, styling tips
- CTA: Browse Collection

**Email 3: Social Proof (Day 7)**
- Subject: `Join 10,000+ happy customers`
- Content: Customer testimonials, UGC, community highlights
- CTA: Follow on Instagram

**Email 4: Urgency (Day 10)**
- Subject: `Your 10% discount expires in 48 hours`
- Content: Reminder about discount, bestsellers, inventory scarcity
- CTA: Shop Before It's Gone

#### Step 4: Personalization

Use Aura's dynamic content:

```liquid
Hi {{ customer.first_name | default: "there" }},

Based on your interest in {{ customer.favorite_category }}, 
we think you'll love...

{% if customer.predicted_ltv > 200 %}
  <!-- Show premium products -->
{% else %}
  <!-- Show entry-level products -->
{% endif %}
```

#### Step 5: A/B Testing

Test subject lines:

- **Variant A**: `Welcome to [Brand]! 10% off inside`
- **Variant B**: `[First Name], your exclusive gift is here 🎁`
- **Winner**: Automatically sends winning variant after 100 opens

#### Step 6: Launch

1. Click **Review & Test**
2. Send test email to your team
3. Verify personalization and links work
4. Click **Activate Flow**

**Expected Results (30 days):**
- Open rate: 40-50%
- Click rate: 8-12%
- Conversion rate: 5-8%
- Revenue per recipient: $15-25

---

## Advanced Features

### 1. Predictive Analytics

Aura's AI predicts customer behavior automatically:

**Churn Prediction**
- Identifies customers likely to churn in next 30 days
- Churn score: 0-100 (higher = more likely to churn)
- Use case: Create win-back campaigns for high churn risk

**Lifetime Value Prediction**
- Predicts total revenue from each customer
- Updated daily based on purchase patterns
- Use case: Identify high-value customers early for VIP treatment

**Next Purchase Date**
- Predicts when customer will buy again
- Accuracy improves with more purchase history
- Use case: Trigger replenishment emails at optimal time

**Product Affinity**
- Identifies which products each customer will likely buy
- Based on collaborative filtering + purchase patterns
- Use case: Personalized product recommendations

📍 Location: **Customers → [Select Customer] → Predictions Tab**

**Example Segment Using Predictions:**
```
High Churn Risk + High Value
- Churn Score > 70
- Predicted LTV > $1,000
- Last Purchase > 60 days ago

→ Trigger: VIP win-back campaign with 20% discount
```

### 2. Revenue Optimization

#### Dynamic Pricing Insights

Aura analyzes optimal discount levels:

- **Discount Sensitivity Score**: How price-sensitive each customer is (0-100)
- **Recommendation**: Minimize discounts for low-sensitivity customers
- **Expected Impact**: 5-15% margin improvement

📍 Location: **Insights → Pricing**

#### Product Recommendations

4 recommendation engines:

1. **Collaborative Filtering**: "Customers like you bought..."
2. **Content-Based**: Similar products by attributes
3. **Trending**: Popular products right now
4. **Personalized**: AI-optimized for each customer

**Embed on Product Pages:**
```html
<div id="aura-recommendations" 
     data-customer-id="{{ customer.id }}"
     data-placement="product-page">
</div>
```

**Expected Lift:**
- Add-to-cart rate: +15-25%
- Average order value: +10-18%
- Revenue per visitor: +12-20%

### 3. Attribution Tracking

Understand which channels drive revenue:

**Multi-Touch Attribution Models:**
- **First-Touch**: Credits first interaction
- **Last-Touch**: Credits final interaction  
- **Linear**: Equal credit to all touchpoints
- **Time-Decay**: More credit to recent interactions
- **Position-Based**: 40% first, 40% last, 20% middle

📍 Location: **Analytics → Attribution**

**Example Attribution Path:**
```
Facebook Ad → Visited Homepage → Abandoned Cart
→ Email Click → Viewed Product → Purchased

Linear Model: Each touchpoint gets 20% credit
Position-Based: Facebook 40%, Email 40%, others 6.67% each
```

**Use Case**: Optimize ad spend by understanding real customer journeys.

### 4. CDP Health Monitoring

Track your CDP implementation quality:

**Data Quality Score (0-100)**
- Profile completeness (do you have email, phone, address?)
- Event tracking coverage (are all critical events firing?)
- Integration status (are all sources syncing?)
- Freshness (is data updating in real-time?)

**Recommendations:**
- Score 90+: Excellent, ready for advanced features
- Score 70-89: Good, some improvements needed
- Score <70: Action required, missing critical data

📍 Location: **Settings → Data Health**

---

## Support & Resources

### Documentation

- **API Reference**: [docs.auracdp.com/api](https://docs.auracdp.com/api)
- **Integration Guides**: [docs.auracdp.com/integrations](https://docs.auracdp.com/integrations)
- **Video Tutorials**: [youtube.com/auracdp](https://youtube.com/auracdp)
- **Blog & Best Practices**: [auracdp.com/blog](https://auracdp.com/blog)

### Support Channels

**In-App Chat Support**
- Response time: <2 hours (business hours)
- Available: Mon-Fri 9am-6pm EST

**Email Support**
- Email: support@auracdp.com
- Response time: <24 hours

**Dedicated Slack Channel** (Growth+ plans)
- Real-time support from your Customer Success Manager
- Direct line to engineering for technical questions

**Office Hours** (Pro+ plans)
- Weekly video calls with CSM
- Strategy reviews and optimization recommendations

### Training & Certification

**Aura CDP Certification Program**
- Self-paced online courses
- Exam: 60 minutes, 50 questions
- Certificate upon completion
- Free for all customers

**Topics Covered:**
1. CDP Fundamentals
2. Audience Building
3. Email Automation
4. Predictive Analytics
5. Attribution & Measurement

📍 Enroll: **Settings → Training → Get Certified**

### Community

**Aura CDP Community Forum**
- Ask questions, share best practices
- Monthly AMAs with product team
- User-submitted templates and workflows

📍 Join: [community.auracdp.com](https://community.auracdp.com)

---

## Onboarding Checklist

Use this checklist to ensure successful setup:

### Week 1: Foundation Setup
- [ ] Connect Shopify store
- [ ] Verify data import (90 days history)
- [ ] Install JavaScript SDK on storefront
- [ ] Complete business profile
- [ ] Upload brand assets (logo, colors)
- [ ] Invite team members with appropriate roles
- [ ] Create 3 foundational segments (Active, At-Risk, VIP)
- [ ] Set up email integration (Klaviyo or native)

### Week 2: First Campaigns
- [ ] Create welcome email series (4 emails)
- [ ] Build abandoned cart flow
- [ ] Set up post-purchase follow-up
- [ ] Create browse abandonment campaign
- [ ] Configure A/B tests for each flow
- [ ] Test all emails on multiple devices
- [ ] Activate automated flows

### Week 3: Analytics & Optimization
- [ ] Review attribution reports
- [ ] Analyze customer segments performance
- [ ] Check predictive model accuracy
- [ ] Set up custom dashboards
- [ ] Configure Slack/email alerts for key metrics
- [ ] Schedule weekly reports

### Week 4: Advanced Features
- [ ] Enable product recommendations on site
- [ ] Create cohort retention reports
- [ ] Build revenue forecasting models
- [ ] Set up data exports (if needed)
- [ ] Configure API integrations (if applicable)
- [ ] Complete Aura CDP certification

### Ongoing: Monthly Reviews
- [ ] Review segment performance and update criteria
- [ ] Analyze email campaign results and optimize
- [ ] Check data quality score (target: 90+)
- [ ] Review predictive model accuracy
- [ ] Audit attribution and adjust budget allocation
- [ ] Compare against industry benchmarks
- [ ] Meet with CSM for strategy review (Pro+ plans)

---

## Glossary

**CDP (Customer Data Platform)**: Software that creates a unified customer database from multiple sources.

**Profile**: A single customer record containing all known data points.

**Event**: An action taken by a customer (purchase, page view, email click, etc.).

**Segment**: A group of customers sharing common attributes or behaviors.

**Audience**: A segment ready for activation (exported to marketing tools).

**Enrichment**: Process of adding additional data to customer profiles (demographics, psychographics, predictions).

**Attribution**: Crediting marketing touchpoints for conversions.

**Churn**: When a customer stops purchasing (typically 90-180 days inactive).

**LTV (Lifetime Value)**: Total revenue expected from a customer over their lifetime.

**Cohort**: A group of customers who share a common characteristic (signup month, first purchase date, etc.).

**Predictive Model**: AI algorithm that forecasts future behavior (churn, LTV, next purchase).

**A/B Test**: Experiment comparing two variants to determine which performs better.

**Conversion Rate**: Percentage of users who complete a desired action.

---

## Quick Reference: Key Metrics

| Metric | Formula | Good Benchmark | Where to Find |
|--------|---------|----------------|---------------|
| **Customer LTV** | Total Revenue / Customers | $200-$500+ | Dashboard → Overview |
| **Repeat Purchase Rate** | Customers with 2+ orders / Total | 30-40% | Analytics → Retention |
| **Churn Rate** | Churned / Total Active | <5% monthly | Analytics → Churn |
| **Email Open Rate** | Opens / Delivered | 40-50% | Automation → Performance |
| **Email Click Rate** | Clicks / Delivered | 8-12% | Automation → Performance |
| **Conversion Rate** | Purchases / Visitors | 2-4% | Dashboard → Overview |
| **Average Order Value** | Revenue / Orders | $75-150+ | Dashboard → Overview |
| **Customer Acquisition Cost** | Marketing Spend / New Customers | $30-60 | Analytics → Attribution |

---

## Next Steps

Now that you're onboarded, focus on these high-impact activities:

### Immediate (This Week)
1. **Create 5 Core Segments**: Active Customers, High-Value, At-Risk, New Subscribers, Win-Back
2. **Build 3 Automated Flows**: Welcome series, abandoned cart, post-purchase
3. **Set Up Tracking**: Ensure all events are firing correctly

### Short-Term (This Month)
1. **Launch Predictive Campaigns**: Use churn prediction for win-back offers
2. **Optimize Attribution**: Shift budget to high-ROI channels
3. **A/B Test Everything**: Subject lines, send times, offers, creative

### Long-Term (This Quarter)
1. **Hit 90+ Data Quality Score**: Ensure complete, accurate customer profiles
2. **Achieve 30%+ Repeat Rate**: Focus on retention and loyalty
3. **10x ROI on Email**: Aim for $10+ revenue per email sent

---

**Questions?** Contact your Customer Success Manager or email support@auracdp.com

**Welcome to the future of customer data!** 🚀
