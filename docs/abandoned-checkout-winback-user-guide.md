# Abandoned Checkout Winback - User Guide

**Version:** 2.0  
**Last Updated:** Week 8 Deliverable  
**For:** Merchants, Marketers, and Operations Teams

Complete user guide for the world-class Abandoned Checkout Winback platform with 44 tabs across 7 categories.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Category 1: Manage](#category-1-manage)
4. [Category 2: Optimize](#category-2-optimize)
5. [Category 3: Advanced](#category-3-advanced)
6. [Category 4: Tools](#category-4-tools)
7. [Category 5: Monitoring](#category-5-monitoring)
8. [Category 6: Settings](#category-6-settings)
9. [Category 7: World-Class](#category-7-world-class)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Getting Started

### What is Abandoned Checkout Winback?

Abandoned Checkout Winback is an AI-powered revenue recovery platform that helps you:
- Automatically recover abandoned shopping carts
- Personalize recovery campaigns with AI
- Optimize incentives and messaging
- Track performance across multiple channels
- Collaborate with your team
- Ensure GDPR compliance

### Quick Start (5 Minutes)

1. **Navigate** to Aura Console → Abandoned Checkout Winback
2. **Create your first segment** in Manage → Customer Segments
3. **Design a template** in Manage → Templates
4. **Launch a campaign** in Manage → Recovery Campaigns
5. **Monitor results** in Monitoring → Real-Time Dashboard

---

## Dashboard Overview

### Navigation Structure

The platform is organized into 7 categories with 44 total tabs:

- **Manage (8 tabs):** Create and manage campaigns, segments, and schedules
- **Optimize (7 tabs):** Test and optimize performance
- **Advanced (6 tabs):** AI-powered features for power users
- **Tools (5 tabs):** Data export, API testing, integrations
- **Monitoring (6 tabs):** Real-time analytics and alerts
- **Settings (6 tabs):** Configure platform settings
- **World-Class (6 tabs):** Enterprise-grade analytics and reporting

### Key Metrics

At the top of your dashboard, you'll see:
- **Carts Abandoned (24h):** Number of carts abandoned today
- **Recoveries In Progress:** Active recovery campaigns
- **Revenue Recovered:** Total recovered revenue
- **Conversion Rate:** Cart recovery success rate

---

## Category 1: Manage

### Recovery Campaigns Tab

**Purpose:** Create, launch, and manage recovery campaigns.

**How to Create a Campaign:**

1. Click **"+ New Campaign"**
2. **Name your campaign:** e.g., "Weekend VIP Recovery"
3. **Select target segment:** Choose from existing segments
4. **Choose template:** Pick email/SMS template
5. **Set timing:** Immediate, scheduled, or trigger-based
6. **Configure incentive:** Discount code or free shipping
7. **Click "Launch Campaign"**

**Campaign Table Columns:**
- **Campaign Name:** Click to edit
- **Status:** Active, Paused, Completed
- **Recovery Rate:** % of carts recovered
- **Revenue:** Total revenue from campaign
- **Actions:** Edit, Pause, Delete

**Pro Tips:**
- Test campaigns on small segments first
- A/B test different subject lines
- Send follow-up campaigns 24-48 hours later

---

### Customer Segments Tab

**Purpose:** Group customers by behavior, value, or cart attributes.

**Pre-Built Segments:**
- **High-Value Carts:** >$100 cart value
- **VIP Customers:** Repeat buyers with 5+ orders
- **New Visitors:** First-time cart abandoners
- **International:** Customers outside your primary region

**Creating Custom Segments:**

1. Click **"+ New Segment"**
2. **Name segment:** e.g., "Holiday Shoppers"
3. **Add filters:**
   - Cart Value: Greater than $50
   - Items in Cart: At least 2
   - Customer Tags: Contains "holiday"
   - Abandoned Within: Last 7 days
4. **Preview segment size**
5. **Save segment**

**Segment Actions:**
- **Edit:** Modify filters
- **Duplicate:** Clone and adjust
- **Delete:** Remove unused segments
- **Export:** Download customer list

---

### Cart Inventory Tab

**Purpose:** View all abandoned carts awaiting recovery.

**Table Columns:**
- Customer Name
- Cart Value
- Items Count
- Abandoned Date
- Last Contact
- Recovery Status

**Quick Actions:**
- **Send Email:** Immediate email recovery
- **Send SMS:** Text message recovery
- **Apply Discount:** Auto-generate discount code
- **Mark Recovered:** Manual status update

**Filters:**
- Cart value range
- Abandoned date range
- Customer segment
- Recovery status

---

### Templates Tab

**Purpose:** Create reusable email and SMS templates.

**Template Types:**
- **Email Templates:** HTML emails with personalization
- **SMS Templates:** Short text messages (160 chars)
- **Push Notifications:** Mobile app messages

**Creating a Template:**

1. Click **"+ New Template"**
2. **Choose type:** Email or SMS
3. **Name template:** e.g., "Initial Recovery Email"
4. **Design content:**
   - Use **personalization tags:** `{customer_name}`, `{cart_value}`, `{discount_code}`
   - Add **product images** from cart
   - Include **CTA button:** "Complete Your Purchase"
5. **Preview template**
6. **Save and activate**

**Best Practices:**
- Keep subject lines under 50 characters
- Personalize with customer name
- Include urgency ("Limited time offer!")
- Test on multiple devices

---

### Schedules Tab

**Purpose:** Automate campaign timing and frequency.

**Schedule Types:**
- **One-time:** Launch at specific date/time
- **Recurring:** Daily, weekly, monthly
- **Triggered:** Based on cart abandonment event
- **Drip Campaign:** Series of messages over time

**Creating a Schedule:**

1. **Select campaign** to schedule
2. **Choose schedule type**
3. **Set timing:**
   - One-time: Pick date and time
   - Recurring: Define frequency
   - Triggered: Set delay (e.g., 2 hours after abandonment)
   - Drip: Define message sequence
4. **Set timezone**
5. **Activate schedule**

**Example Drip Campaign:**
- Message 1: 2 hours after abandonment (reminder)
- Message 2: 24 hours later (10% discount)
- Message 3: 48 hours later (final reminder, 15% discount)

---

### Bulk Actions Tab

**Purpose:** Perform operations on multiple campaigns at once.

**Available Bulk Actions:**
- **Activate:** Turn on multiple paused campaigns
- **Pause:** Stop multiple active campaigns
- **Delete:** Remove multiple campaigns
- **Clone:** Duplicate campaigns for testing
- **Export:** Download campaign data
- **Change Segment:** Reassign target audience

**How to Use:**

1. **Select campaigns** using checkboxes
2. **Click "Bulk Actions"** dropdown
3. **Choose action**
4. **Confirm** operation

---

### Campaign History Tab

**Purpose:** Review past campaign performance.

**Historical Data:**
- Campaign results over time
- Conversion trends
- Revenue attribution
- Channel performance comparison

**Filtering:**
- Date range
- Campaign type
- Customer segment
- Revenue threshold

**Export Options:**
- CSV download
- PDF report
- Email summary

---

### Quick Actions Tab

**Purpose:** One-click recovery workflows for instant results.

**Pre-Built Quick Actions:**

**1. Send SMS to High-Value Carts**
- Target: Carts over $100
- Action: Immediate SMS with 10% discount
- Click **"Send Now"**

**2. Email Abandoned <24h**
- Target: Carts abandoned in last 24 hours
- Action: Friendly reminder email
- Click **"Send Now"**

**3. VIP Weekend Promo**
- Target: VIP customer segment
- Action: Exclusive weekend discount
- Click **"Send Now"**

**4. Flash Sale Recovery**
- Target: All abandoned carts
- Action: Limited-time 20% off
- Click **"Send Now"**

**Custom Quick Actions:**
Create your own by combining:
- Target segment
- Message template
- Incentive
- Channel (email/SMS)

---

## Category 2: Optimize

### A/B Testing Tab

**Purpose:** Test variations to improve recovery rates.

**What You Can Test:**
- Subject lines
- Email content
- Discount amounts
- Send timing
- Channel (email vs SMS)

**Creating an A/B Test:**

1. **Click "Start A/B Test"**
2. **Name test:** e.g., "Subject Line Test"
3. **Choose variable:** Subject Line
4. **Create variants:**
   - Variant A: "Your cart is waiting!"
   - Variant B: "Save 15% on your order"
5. **Set split:** 50/50 or custom
6. **Define success metric:** Open rate, click rate, conversion
7. **Set duration:** 7 days
8. **Launch test**

**Viewing Results:**
- Variant performance comparison
- Statistical significance indicator
- Winner recommendation
- Detailed analytics

**Best Practices:**
- Test one variable at a time
- Run tests for at least 7 days
- Ensure sample size is large enough (100+ per variant)
- Implement winning variant immediately

---

### Incentive Optimizer Tab

**Purpose:** AI-powered optimal discount calculation.

**How It Works:**
- AI analyzes cart value, customer history, and abandonment patterns
- Recommends the minimum discount needed to recover cart
- Maximizes revenue while maintaining conversion

**Using Incentive Optimizer:**

1. **View recommendations** dashboard
2. **See optimal discount** for each segment
3. **Review projected impact:**
   - Expected recovery rate
   - Projected revenue
   - Cost of discount
4. **Apply recommendations** to campaigns

**Example:**
- Cart Value: $150
- Recommended Discount: 12%
- Expected Recovery Rate: 68%
- Projected Revenue: $132 (vs $0 without campaign)

---

### Channel Performance Tab

**Purpose:** Compare effectiveness of email, SMS, and push.

**Metrics by Channel:**
- Delivery rate
- Open rate
- Click rate
- Conversion rate
- Revenue per send
- Cost per acquisition

**Insights:**
- Best-performing channel for each segment
- Optimal channel mix
- Channel fatigue indicators
- ROI by channel

**Optimization Recommendations:**
- When to use email vs SMS
- Ideal multi-channel sequences
- Budget allocation suggestions

---

### Timing Analysis Tab

**Purpose:** Discover optimal contact timing for each segment.

**Analysis Dimensions:**
- Hour of day
- Day of week
- Time since abandonment
- Customer timezone

**Heatmap Visualization:**
Shows conversion rates by:
- X-axis: Hour of day (0-23)
- Y-axis: Day of week (Mon-Sun)
- Color: Conversion rate (green = high, red = low)

**Recommendations:**
- Best send time for each segment
- Avoid hours (low engagement)
- Peak conversion windows

**Apply Timing:**
Automatically adjust campaign schedules based on insights.

---

### Message Optimization Tab

**Purpose:** Test and refine message variants.

**Optimization Areas:**
- Subject lines
- Email copy
- Call-to-action buttons
- Personalization tokens
- Image selection

**AI-Powered Suggestions:**
- Subject line generator
- Sentiment analysis
- Readability score
- Spam filter check

**Testing:**
- A/B test different messages
- Track engagement metrics
- Identify winning variants

---

### Conversion Funnels Tab

**Purpose:** Analyze customer journey from cart to conversion.

**Funnel Stages:**
1. Cart Abandoned
2. Campaign Sent
3. Email/SMS Opened
4. Link Clicked
5. Cart Viewed
6. Purchase Completed

**Drop-Off Analysis:**
- Percentage lost at each stage
- Reasons for abandonment
- Friction points

**Optimization Opportunities:**
- Improve stage with highest drop-off
- Reduce friction in checkout
- Optimize landing pages

---

### Recommendations Tab

**Purpose:** AI-generated optimization suggestions.

**Types of Recommendations:**

**1. Segment Recommendations**
- "Create segment for carts $200+ (32% recovery rate)"
- "Target mobile abandoners separately (18% higher conversion)"

**2. Timing Recommendations**
- "Send emails Tuesdays at 10am (42% higher open rate)"
- "Follow up after 6 hours, not 24 hours"

**3. Incentive Recommendations**
- "Reduce discount to 12% for VIP segment (same recovery rate)"
- "Offer free shipping instead of discount for carts <$75"

**4. Template Recommendations**
- "Add product images (28% lift in click-through)"
- "Shorter subject lines (15% higher open rate)"

**Implementing Recommendations:**
- Click **"Apply"** on any recommendation
- Review changes before going live
- Track impact in Campaign History

---

## Category 3: Advanced

### AI Orchestration Tab

**Purpose:** Create intelligent, multi-step recovery workflows.

**What are AI Workflows?**
Automated sequences that adapt based on customer behavior and AI predictions.

**Example Workflow:**

```
Trigger: Cart Abandoned (value > $50)
↓
AI Intent Score Analysis
↓
High Intent (>70%) → Send SMS immediately
Medium Intent (40-70%) → Send email in 2 hours
Low Intent (<40%) → Send email in 24 hours with 15% discount
```

**Creating an AI Workflow:**

1. **Click "+ New Workflow"**
2. **Name workflow:** e.g., "Smart VIP Recovery"
3. **Set trigger:**
   - Event: Cart Abandoned
   - Conditions: Cart value > $100, Customer = VIP
4. **Add AI decision nodes:**
   - Intent Score Analysis
   - Channel Preference Detection
   - Optimal Discount Calculation
5. **Configure actions:**
   - Send personalized message
   - Apply recommended discount
   - Log activity
6. **Set fallback rules**
7. **Test workflow** with sample data
8. **Activate**

**Workflow Performance:**
- View execution logs
- Track conversion rates
- Optimize decision thresholds

---

### Predictive Intent Tab

**Purpose:** See customer purchase probability scores.

**Intent Score Components:**
- Cart value and items
- Browse history
- Past purchase behavior
- Session duration
- Device type
- Time on site

**Score Interpretation:**
- **90-100:** Very High - Send SMS immediately
- **70-89:** High - Send email within 1 hour
- **50-69:** Medium - Send email within 4 hours with discount
- **30-49:** Low - Send email in 24 hours with strong incentive
- **0-29:** Very Low - Skip or wait 48 hours

**Using Intent Scores:**

1. **View customer list** with intent scores
2. **Filter by score range**
3. **Create targeted campaigns** based on intent
4. **Automate actions** in AI workflows

---

### Dynamic Pricing Tab

**Purpose:** Real-time discount optimization per customer.

**How It Works:**
AI calculates the minimum discount needed to convert each customer based on:
- Historical response to discounts
- Cart value and margins
- Competitive pricing
- Customer lifetime value
- Inventory levels

**Dynamic Pricing Rules:**

**Example 1: Value-Based Pricing**
- Cart $0-50: No discount needed (high intent)
- Cart $50-100: 10% discount
- Cart $100-200: 15% discount
- Cart $200+: 20% discount + free shipping

**Example 2: Customer-Based Pricing**
- New Customers: 15% to incentivize first purchase
- Regular Customers: 10% standard offer
- VIP Customers: Exclusive perks instead of discount

**Margin Protection:**
- Set minimum margin thresholds
- AI won't recommend discounts that harm profitability

---

### Multi-Channel Tab

**Purpose:** Coordinate recovery across email, SMS, and push.

**Multi-Channel Strategies:**

**1. Sequential Multi-Channel**
```
Hour 0: Email reminder
Hour 6: SMS follow-up (if email not opened)
Hour 24: Push notification (if cart still abandoned)
```

**2. Simultaneous Multi-Channel**
```
Send email AND SMS at same time for high-value carts
```

**3. Preference-Based**
```
Send via customer's preferred channel (detected by AI)
```

**Channel Configuration:**
- Email: Configure SMTP or SendGrid
- SMS: Connect Twilio account
- Push: Integrate mobile app

**Performance Tracking:**
- Compare channel effectiveness
- Monitor cross-channel attribution
- Optimize channel sequencing

---

### Custom Scripts Tab

**Purpose:** Developer-defined custom recovery logic.

**Use Cases:**
- Custom cart value calculations
- Third-party API integrations
- Complex business rules
- Data transformations

**Creating a Custom Script:**

1. **Click "+ New Script"**
2. **Name script:** e.g., "Custom Eligibility Check"
3. **Choose trigger:** When to execute
4. **Write JavaScript code:**

```javascript
function isEligible(cart, customer) {
  // Custom logic
  if (cart.value > 100 && customer.orders > 5) {
    return true;
  }
  return false;
}
```

5. **Test with sample data**
6. **Save and activate**

**Script Variables Available:**
- `cart`: Cart object (value, items, customerId)
- `customer`: Customer object (email, orders, tags)
- `config`: Shop configuration
- `helpers`: Utility functions

**Security:**
- Scripts run in sandboxed environment
- No access to sensitive data
- Rate limited execution

---

### Advanced Filters Tab

**Purpose:** Complex segmentation with multiple conditions.

**Filter Types:**
- Cart attributes
- Customer behaviors
- Product categories
- Order history
- Marketing tags
- Custom fields

**Building Complex Segments:**

**Example: Black Friday VIP Segment**
```
Cart Value: >= $200
AND
Customer Lifetime Orders: >= 10
AND
Product Categories: Contains "Electronics"
AND
Abandoned Within: Last 3 days
AND
Previous Recovery: NOT responded in last 30 days
```

**Operators:**
- Equals, Not Equals
- Greater Than, Less Than
- Contains, Not Contains
- In List, Not In List
- Exists, Not Exists

**Segment Preview:**
- See customer count matching filters
- View sample customers
- Export segment data

---

## Category 4: Tools

### Export/Import Tab

**Purpose:** Migrate data and create backups.

**Export Options:**

**1. Export Campaigns**
- Format: JSON, CSV, Excel
- Includes: Campaign settings, performance data, templates

**2. Export Segments**
- Customer lists with filters
- Segment definitions

**3. Export Workflows**
- AI workflow configurations
- Performance history

**4. Export All Data**
- Complete backup of all tool data

**Import Process:**

1. **Select import type**
2. **Upload file** (JSON/CSV/XLSX)
3. **Preview import** data
4. **Map fields** (if column names differ)
5. **Validate** data integrity
6. **Confirm import**

**Use Cases:**
- Backup before major changes
- Migrate between shops
- Share configurations with team
- Restore previous settings

---

### API Playground Tab

**Purpose:** Test API endpoints interactively.

**Features:**
- Test all 184 endpoints
- Live request/response viewer
- Authentication handled automatically
- Request history

**How to Use:**

1. **Select HTTP method:** GET, POST, PUT, DELETE
2. **Enter endpoint:** `/api/abandoned-checkout-winback/campaigns`
3. **Add request body** (if POST/PUT):
   ```json
   {
     "name": "Test Campaign",
     "segment": "high-value"
   }
   ```
4. **Click "Send Request"**
5. **View response:**
   - Status code
   - Response body (formatted JSON)
   - Headers
   - Latency

**Example Workflows:**
- Test campaign creation before building in UI
- Debug integration issues
- Explore API capabilities
- Verify data structure

---

### Webhooks Tab

**Purpose:** Receive real-time event notifications.

**Supported Events:**
- `cart.abandoned` - New cart abandoned
- `campaign.sent` - Recovery message sent
- `recovery.success` - Cart recovered
- `recovery.failed` - Recovery failed
- `workflow.triggered` - AI workflow started

**Creating a Webhook:**

1. **Click "+ New Webhook"**
2. **Enter webhook URL:** `https://yourapp.com/webhooks/abandoned-cart`
3. **Select event:** cart.abandoned
4. **Add secret key** for verification
5. **Test webhook** delivery
6. **Save**

**Webhook Payload:**

```json
{
  "event": "cart.abandoned",
  "shop": "your-shop.myshopify.com",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "cartId": "cart_123",
    "customerId": "customer_456",
    "cartValue": 150.00,
    "items": 3,
    "currency": "USD"
  }
}
```

**Verifying Webhooks:**
- Check `X-Aura-Signature` header
- Compare with HMAC-SHA256 hash using your secret key

---

### Integrations Tab

**Purpose:** Connect third-party platforms.

**Available Integrations:**

**1. Shopify** (Pre-Connected)
- Automatic cart sync
- Customer data sync
- Order tracking

**2. Klaviyo** (Email Marketing)
- Sync segments
- Share templates
- Cross-platform analytics

**3. Twilio** (SMS)
- SMS delivery
- Phone number verification
- Delivery tracking

**4. Stripe** (Payments)
- Revenue tracking
- Refund detection
- Payment method sync

**Connecting an Integration:**

1. **Click integration card**
2. **Click "Connect"**
3. **Enter API credentials**
4. **Test connection**
5. **Configure sync settings**
6. **Save**

**Managing Integrations:**
- View connection status
- Edit credentials
- Disable/enable syncing
- Disconnect

---

### Migration Tools Tab

**Purpose:** Migrate from other platforms.

**Supported Platforms:**
- Mailchimp
- Klaviyo (migration)
- ActiveCampaign
- HubSpot
- Custom CSV import

**Migration Process:**

1. **Select source platform**
2. **Authenticate** with platform API
3. **Select data to migrate:**
   - Campaigns
   - Segments
   - Templates
   - Customer lists
4. **Preview migration** data
5. **Start migration**
6. **Monitor progress**
7. **Verify imported data**

**Post-Migration:**
- Review imported campaigns
- Update integrations
- Test workflows
- Archive old platform data

---

## Category 5: Monitoring

### Real-Time Dashboard Tab

**Purpose:** Live performance monitoring with 5-second updates.

**Live Metrics:**

**Carts Abandoned (24h)**
- Count of new abandoned carts today
- Trend vs yesterday

**Recoveries In Progress**
- Active campaigns sending
- Pending follow-ups

**Revenue Recovered**
- Total revenue from successful recoveries
- Average order value

**Conversion Rate**
- % of abandoned carts recovered
- Trend over time

**Live Activity Feed:**
Real-time stream of events:
- "Cart abandoned: $150 - John D."
- "Email sent: Weekend Recovery Campaign"
- "Cart recovered: $95 - Sarah M."

**Auto-Refresh:**
Dashboard updates every 5 seconds automatically.

---

### Performance Metrics Tab

**Purpose:** Key performance indicators and trends.

**Core Metrics:**

**Average Response Time**
- API latency: 142ms
- Trend: ↓ 5% (improving)

**API Call Success Rate**
- 99.7% success rate
- Errors: 0.3%

**Email Deliverability**
- 98.3% delivered
- Bounces: 1.2%
- Spam: 0.5%

**Campaign Conversion Rate**
- 12.4% average
- Trend: ↓ 0.8% (needs attention)

**Custom Metrics:**
- Add your own KPIs
- Set targets and thresholds
- View historical trends

**Metric Alerts:**
Set alerts when metrics:
- Fall below threshold
- Spike above normal
- Change significantly

---

### Activity Log Tab

**Purpose:** Complete audit trail of all actions.

**Logged Events:**
- Campaign created/edited/deleted
- Segment modifications
- User logins
- Settings changes
- API calls
- Integration events

**Log Entry Details:**
- **Action:** "Campaign created"
- **User:** john@shopify.com
- **Details:** Created "Weekend Recovery" campaign
- **Timestamp:** 2024-01-15 10:30:45
- **IP Address:** 192.168.1.100

**Filtering:**
- Date range
- Event type
- User
- Resource (campaign, segment, etc.)

**Export Options:**
- CSV download for compliance
- PDF report
- JSON export for analysis

---

###Alerts Tab

**Purpose:** Proactive system alerts and notifications.

**Alert Types:**

**Performance Alerts:**
- High latency detected
- API error rate spike
- Low deliverability

**Campaign Alerts:**
- Campaign paused (budget exceeded)
- Low conversion rate
- High unsubscribe rate

**System Alerts:**
- Integration disconnected
- Storage limit approaching
- Security event detected

**Creating Alert Rules:**

1. **Click "+ Create Alert Rule"**
2. **Name alert:** e.g., "Low Conversion Alert"
3. **Set condition:**
   - Metric: Conversion Rate
   - Operator: Falls Below
   - Threshold: 10%
4. **Choose severity:** Info, Warning, Critical
5. **Set notification:**
   - Email to: team@shop.com
   - SMS to: +1-555-0100
6. **Save rule**

**Managing Alerts:**
- View active alerts
- Dismiss alerts
- Snooze temporarily
- Edit alert rules

---

### Error Tracking Tab

**Purpose:** Monitor and debug system errors.

**Error Dashboard:**
- Total errors (24h)
- Error rate trend
- Error types breakdown
- Affected endpoints

**Error Details:**
- Timestamp
- Error message
- Stack trace
- Request details
- User impact

**Error Resolution:**
- Mark as resolved
- Link to fix
- Add notes

**No Errors State:**
"No errors detected in the last 24 hours 🎉"

---

### Health Status Tab

**Purpose:** Overall system health monitoring.

**Health Indicators:**

**System Status**
- ✓ HEALTHY
- Current uptime: 99.9%

**Service Health:**
- Database: ✓ Healthy
- API: ✓ Healthy
- Workers: ✓ Healthy
- Integrations: ✓ Healthy

**Last Health Check:**
- Just now (auto-check every 60 seconds)

**Historical Uptime:**
- Last 30 days: 99.9%
- Last 90 days: 99.8%
- Last year: 99.7%

**Incident History:**
View past incidents and resolutions.

---

## Category 6: Settings

### General Tab

**Purpose:** Basic shop and platform configuration.

**Shop Settings:**

**Shop Name**
- Your store name
- Used in email footers

**Timezone**
- UTC, Eastern Time, Pacific Time, etc.
- Affects campaign scheduling

**Currency**
- USD, EUR, GBP, etc.
- For revenue reporting

**Language**
- Default interface language
- Can override per user

**Email From Name**
- Sender name in recovery emails
- e.g., "Acme Store Team"

**Email From Address**
- Reply-to email address
- e.g., support@acmestore.com

**Save Settings** button to apply changes.

---

### Brands Tab

**Purpose:** White-label branding and customization.

**Brand Configuration:**

**Brand Name**
- Official business name

**Logo**
- Upload logo (recommended: 200x200px PNG)
- Used in emails and dashboard

**Primary Color**
- Hex code: #6366f1 (Aura default)
- Used for buttons and accents

**Secondary Color**
- Accent color for highlights

**Font Family**
- Inter (default), Arial, Helvetica, etc.

**Custom CSS**
- Advanced: Add custom styles

**Preview:**
See brand changes in real-time before saving.

**Multiple Brands:**
Create sub-brands for different product lines or stores.

---

### Teams & Permissions Tab

**Purpose:** User access and role management.

**Roles:**

**Admin**
- Full access to all features
- User management
- Billing access

**Editor**
- Create/edit campaigns and segments
- View analytics
- No settings access

**Viewer**
- Read-only access
- View campaigns and reports
- No edit capabilities

**Custom Roles:**
Create roles with specific permissions:
- Manage campaigns
- View analytics
- Export data
- Access API keys
- Manage users

**Adding Team Members:**

1. **Click "+ New Team"** or "+ Add Member"
2. **Enter email address**
3. **Assign role**
4. **Set permissions**
5. **Send invitation**

**Team Management:**
- View all members
- Edit roles
- Remove users
- View activity logs

---

### Compliance Tab

**Purpose:** GDPR and privacy settings.

**GDPR Consent Management:**

**Consent Records**
- Total records: View count
- Export consent data

**Privacy Settings:**

**Double Opt-In**
- ☐ Enable double opt-in for email campaigns
- Requires customers to confirm subscription

**Data Encryption**
- ☑ Encrypt customer data at rest (Enabled)
- AES-256 encryption

**Data Deletion**
- ☑ Auto-delete data after customer requests (30 days)
- GDPR right to be forgotten

**Cookie Consent**
- ☑ Show cookie banner on recovery pages
- Comply with GDPR/CCPA

**Data Retention:**
- Set retention period: 2 years
- Auto-archive old data

**Privacy Policy Link:**
- Add link to your privacy policy

**Save Privacy Settings**

---

### Localization Tab

**Purpose:** Multi-language and regional support.

**Supported Languages:**

**Active Languages:**
- English (en) - Default
- Spanish (es)
- French (fr)
- German (de)

**Adding a Language:**

1. **Click "+ Add Language"**
2. **Select language:** Japanese (ja)
3. **Upload translations** (JSON file) or use auto-translate
4. **Enable language**
5. **Set as default** (optional)

**Translation Management:**
- View translation coverage (%)
- Edit translations inline
- Import/export translations

**Regional Settings:**
- Date format (MM/DD/YYYY vs DD/MM/YYYY)
- Number format (1,000.00 vs 1.000,00)
- Currency placement ($100 vs 100$)

---

### API Keys Tab

**Purpose:** Manage API credentials for integrations.

**Existing API Keys:**

Table columns:
- **Key Name:** "Production API"
- **API Key:** `ak_live_abc123...` (partially hidden)
- **Created:** 2024-01-10
- **Last Used:** 2024-01-15 10:30
- **Actions:** Revoke

**Generating New API Key:**

1. **Click "+ Generate New Key"**
2. **Name key:** e.g., "Staging Environment"
3. **Set permissions:**
   - Read-only
   - Read + Write
   - Full access
4. **Click "Generate"**
5. **Copy API key** (shown once)
6. **Store securely**

**Security Best Practices:**
- Never share API keys
- Use read-only keys when possible
- Rotate keys regularly
- Revoke unused keys
- Monitor key usage in Activity Log

---

## Category 7: World-Class

### Revenue Forecasting Tab

**Purpose:** AI-powered future revenue predictions.

**Forecast Metrics:**

**Current Month (Projected)**
- $45,000
- Based on current trends

**Next Month Forecast**
- $52,000
- 15.6% increase expected

**Next Quarter Forecast**
- $165,000
- Seasonal adjustment applied

**Forecast Confidence:**
- 87.5% confidence level
- Based on 12 months historical data

**Trend Analysis:**
- ↑ Increasing trend
- Growth rate: +8% month-over-month

**Revenue Trend Chart:**
Line graph showing:
- Historical revenue (6 months)
- Forecasted revenue (3 months)
- Confidence interval (shaded area)

**Scenario Analysis:**
Run what-if scenarios:
- "What if conversion rate improves by 5%?"
- "What if average order value increases by $10?"

---

### CLV Analytics Tab

**Purpose:** Customer lifetime value modeling.

**CLV Metrics:**

**Average CLV**
- $450 per customer
- Based on historical purchase patterns

**Top Segment CLV**
- $1,200 (VIP customers)
- Highest value segment

**Low Segment CLV**
- $150 (one-time buyers)
- Opportunity for improvement

**CLV Distribution:**
Histogram showing customer count by CLV range:
- $0-100: 1,200 customers
- $100-500: 2,800 customers
- $500-1000: 800 customers
- $1000+: 200 customers

**CLV Trends:**
- Average CLV increasing 5% quarter-over-quarter
- VIP segment growing

**Optimization Recommendations:**
- "Focus on converting $100-500 segment to $500-1000"
- "Implement loyalty program for top 10% customers"
- "Reduce churn in one-time buyer segment"

**Segment CLV Comparison:**
Table comparing CLV across segments:
- VIP: $1,200
- Regular: $450
- New: $180

---

### Collaboration Tab

**Purpose:** Team communication and workflows.

**Comment Stream:**

Post comments on campaigns, segments, or system-wide:

**Example Comments:**
- **John D.** 2 hours ago: "The weekend campaign is performing well, let's increase budget"
  - **Reply** option
- **Sarah M.** 5 hours ago: "Should we A/B test the subject line?"
  - **1 reply**

**Posting a Comment:**

1. **Type in comment box**
2. **@mention team members** (@john@shop.com)
3. **Attach to entity** (optional: link to specific campaign)
4. **Click "Post Comment"**

**Approval Workflows:**

View pending approvals:
- Campaign: "Holiday Recovery Campaign"
- Requested by: Sarah M.
- Status: Pending
- **Approve** or **Reject** buttons

**Shared Assets:**
- Templates shared with team
- Segment definitions
- Workflow configurations

**Activity Feed:**
Team activity timeline:
- "John created new campaign"
- "Sarah approved workflow"
- "Marketing team invited 2 new members"

---

### Security Center Tab

**Purpose:** Security dashboard and compliance.

**Security Status:**

**Encryption Status**
- ✓ Enabled
- AES-256-GCM encryption

**API Key Security**
- ✓ Secure
- All keys valid and monitored

**RBAC Status**
- ✓ Active
- Teams and permissions configured

**Security Score:** 95/100

**Recent Audit Logs:**

Table of security events:
- **Event:** User login
- **User:** admin@shop.com
- **Timestamp:** 2024-01-15 10:00
- **IP:** 192.168.1.100
- **Status:** Success

**Security Recommendations:**
- "Enable two-factor authentication"
- "Rotate API keys every 90 days"
- "Review user permissions quarterly"

**Compliance Badges:**
- ✓ GDPR Compliant
- ✓ SOC 2 Type II
- ✓ PCI DSS

---

### Developer Platform Tab

**Purpose:** Developer tools and extensibility.

**Custom Scripts:**

**Active Scripts:**
- "Custom Eligibility Logic" - JavaScript
- "Third-Party Sync" - Python

**Create New Script:**
Click "+ New Custom Script"

**Quick Links:**

**Documentation**
- → API Documentation (184 endpoints)
- → Webhook Configuration Guide
- → Custom Script Examples

**Tools**
- → API Playground
- → Webhook Tester
- → Event Stream Viewer

**Developer Resources:**
- SDK Downloads (JavaScript, Python, PHP)
- Code samples on GitHub
- Developer community forum
- Changelog and release notes

**Event Streaming:**
- Real-time event data feed
- WebSocket connection details
- Event filter configuration

**API Statistics:**
- Total API calls (30 days): 45,230
- Average latency: 142ms
- Success rate: 99.7%

---

### Enterprise Reporting Tab

**Purpose:** Advanced analytics and executive dashboards.

**Report Types:**

**1. Executive Summary**
- High-level KPIs
- Revenue trends
- Customer insights
- YoY comparisons

**2. Campaign Performance**
- Detailed campaign analytics
- ROI by campaign
- Channel breakdown
- Time-series analysis

**3. Revenue Attribution**
- Multi-touch attribution
- First-click vs last-click
- Customer journey mapping

**4. Customer Insights**
- Behavioral segmentation
- Cohort analysis
- Churn prediction
- Engagement metrics

**Generating a Report:**

1. **Select report type**
2. **Choose date range:** Last 30 days, Quarter, Year
3. **Apply filters:** Segment, campaign, channel
4. **Click "Generate Report"**
5. **Wait for processing** (30-60 seconds)
6. **View report** in dashboard or download PDF

**Report Delivery:**
- Schedule automated reports
- Email to stakeholders
- Slack integration
- Export formats: PDF, Excel, PowerPoint

**Custom Dashboards:**
- Drag-and-drop widgets
- Create personalized views
- Share with team
- Embed in external tools

---

## Best Practices

### Campaign Best Practices

**1. Segment Smartly**
- Create targeted segments (don't send to everyone)
- Use behavioral data, not just demographics
- Test segment performance and refine

**2. Timing is Everything**
- Send recovery emails within 2-6 hours of abandonment
- Test different send times for your audience
- Use AI timing recommendations

**3. Personalization Wins**
- Always use customer's first name
- Show cart contents with images
- Reference past purchases

**4. Test, Test, Test**
- A/B test subject lines
- Try different discount amounts
- Experiment with email vs SMS

**5. Multi-Channel Strategy**
- Start with email
- Follow up with SMS for high-value carts
- Use push for mobile app users

### Optimization Best Practices

**1. Start Small**
- Launch pilot campaigns on small segments
- Measure results before scaling
- Iterate based on data

**2. Monitor Metrics**
- Check dashboard daily
- Set up alerts for anomalies
- Review weekly performance

**3. Learn from Data**
- Use Recommendations tab for AI insights
- Analyze conversion funnels
- Study channel performance

**4. Iterate Continuously**
- Update templates based on A/B tests
- Refine segments as you learn
- Adjust incentives for ROI

### Security Best Practices

**1. User Access**
- Use principle of least privilege
- Review team permissions quarterly
- Remove inactive users promptly

**2. API Security**
- Rotate API keys every 90 days
- Use read-only keys when possible
- Monitor API logs for unusual activity

**3. GDPR Compliance**
- Enable double opt-in
- Honor deletion requests within 30 days
- Maintain consent records

**4. Data Protection**
- Keep encryption enabled
- Backup data regularly
- Test recovery procedures

---

## Troubleshooting

### Common Issues

**Issue: Campaigns not sending**

**Causes:**
- Campaign paused
- No customers in segment
- Integration disconnected

**Solutions:**
1. Check campaign status (should be "Active")
2. Verify segment has customers
3. Test integration in Integrations tab
4. Check Activity Log for errors

---

**Issue: Low conversion rates**

**Causes:**
- Poor timing
- Generic messaging
- Weak incentive
- Wrong segment

**Solutions:**
1. Use Timing Analysis to find optimal send time
2. Personalize templates with customer data
3. Test different discount amounts
4. Refine segment filters

---

**Issue: High unsubscribe rate**

**Causes:**
- Too frequent emails
- Irrelevant content
- No value in emails

**Solutions:**
1. Reduce email frequency
2. Improve segmentation
3. Add value (tips, exclusive content)
4. Test email content

---

**Issue: API errors**

**Causes:**
- Invalid API key
- Rate limit exceeded
- Missing required parameters

**Solutions:**
1. Verify API key in Settings → API Keys
2. Check rate limits (100/min standard)
3. Use API Playground to test request
4. Review API documentation

---

**Issue: Webhooks not received**

**Causes:**
- Wrong webhook URL
- Firewall blocking
- Invalid secret key

**Solutions:**
1. Test webhook with "Test" button
2. Check webhook URL is accessible
3. Verify secret key matches
4. Review webhook logs

---

## FAQ

**Q: How many campaigns can I run simultaneously?**

A: Unlimited. The platform can handle as many concurrent campaigns as needed.

---

**Q: What's the difference between a segment and a campaign?**

A: A **segment** is a group of customers (e.g., "high-value carts"). A **campaign** is a recovery action (e.g., "send email to high-value carts").

---

**Q: Can I recover abandoned carts from multiple stores?**

A: Yes, if using multi-store setup. Each store has isolated data under Settings → White-Label → Multi-Store.

---

**Q: How accurate are revenue forecasts?**

A: Typically 85-90% accurate based on historical data. Accuracy improves with more data over time.

---

**Q: Can I customize email templates?**

A: Yes! Use Templates tab to create custom HTML emails with your branding, content, and personalization tokens.

---

**Q: What happens to customer data if I delete a campaign?**

A: Campaigns are soft-deleted. Customer data remains intact and can be used in other campaigns. For permanent deletion, use GDPR tools.

---

**Q: How do I know which channel (email vs SMS) works better?**

A: Check Optimize → Channel Performance tab. It shows conversion rates, ROI, and recommendations by channel.

---

**Q: Can I integrate with platforms not listed?**

A: Yes, use Webhooks or API to build custom integrations. See Developer Platform tab.

---

**Q: What's the API rate limit?**

A: Standard tier: 100 requests/minute. Premium: 1000/min. Enterprise: unlimited.

---

**Q: How do I export data for my own analysis?**

A: Use Tools → Export/Import tab. Export to JSON, CSV, or Excel.

---

**Q: Can I schedule campaigns in advance?**

A: Yes! Use Manage → Schedules tab to schedule one-time or recurring campaigns.

---

**Q: What if I don't want to offer discounts?**

A: Use Dynamic Pricing to optimize incentives, or create campaigns without discounts using urgency/scarcity instead.

---

**Q: How do AI workflows differ from regular campaigns?**

A: AI workflows adapt in real-time based on customer behavior and predictions. Regular campaigns follow fixed rules.

---

**Q: Can I see which team member made changes?**

A: Yes, all actions are logged in Monitoring → Activity Log with user, timestamp, and details.

---

**Q: Is my data secure?**

A: Yes. Data is encrypted (AES-256), access-controlled (RBAC), and GDPR-compliant. See Security Center for details.

---

**Q: How do I get support?**

A: Email support@aura.com or join our Slack community at slack.aura.com.

---

## Need More Help?

- **Documentation:** https://docs.aura.com/abandoned-checkout-winback
- **API Reference:** See `abandoned-checkout-winback-api-reference.md`
- **Video Tutorials:** https://aura.com/tutorials
- **Community Forum:** https://community.aura.com
- **Support:** support@aura.com

---

**End of User Guide**
