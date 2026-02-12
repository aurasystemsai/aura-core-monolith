# Email Automation Builder - User Guide

**Welcome to the Email Automation Builder!**

This comprehensive guide will help you master the Email Automation Builder platform, from sending your first campaign to creating sophisticated cross-channel customer journeys powered by AI.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your First Campaign](#creating-your-first-campaign)
3. [Building Email Templates](#building-email-templates)
4. [AI-Powered Content Generation](#ai-powered-content-generation)
5. [Audience Segmentation](#audience-segmentation)
6. [Automation Workflows](#automation-workflows)
7. [Visual Workflow Builder](#visual-workflow-builder)
8. [Multi-Channel Orchestration](#multi-channel-orchestration)
9. [A/B Testing & Optimization](#ab-testing--optimization)
10. [Analytics & Reporting](#analytics--reporting)
11. [Predictive Analytics](#predictive-analytics)
12. [ESP Integration Setup](#esp-integration-setup)
13. [Domain Authentication](#domain-authentication)
14. [Best Practices](#best-practices)
15. [Troubleshooting](#troubleshooting)
16. [Advanced Features](#advanced-features)

---

## Getting Started

### Initial Setup

1. **Access the Platform**
   - Navigate to the Email Automation Builder from the main Aura dashboard
   - You'll see the Email Automation Builder interface with 7 main categories

2. **Configure Your Sender Profile**
   - Go to **Settings** → **Sender Profiles**
   - Click "Create Profile"
   - Enter your sender information:
     - **From Name**: Your brand name (e.g., "Acme Marketing")
     - **From Email**: Your sending email (e.g., "hello@yourbrand.com")
     - **Reply-To**: Where replies should go (e.g., "support@yourbrand.com")
   - Click "Create" to save

3. **Set Up Domain Authentication**
   - Go to **Settings** → **Domain Authentication**
   - Click "Add Domain"
   - Enter your domain (e.g., "yourbrand.com")
   - Copy the provided DNS records (SPF, DKIM, DMARC)
   - Add these records to your DNS provider
   - Return to the platform and click "Verify"
   - ✅ All three should show as verified for optimal deliverability

4. **Configure ESP Integration**
   - Go to **Tools** → **ESP Integrations**
   - Choose your email service provider (SendGrid, AWS SES, Mailgun, or Postmark)
   - Enter your API credentials
   - Click "Test Connection" to verify
   - The system will automatically handle failover between ESPs

### Understanding the Interface

The Email Automation Builder is organized into 7 main categories:

1. **MANAGE**: Campaign and contact management
2. **CREATE**: Campaign creation and design tools
3. **AUTOMATE**: Workflow automation and triggers
4. **OPTIMIZE**: Testing and optimization tools
5. **ANALYZE**: Analytics and performance tracking
6. **TOOLS**: Integrations and system configurations
7. **SETTINGS**: Account and domain settings

Each category contains multiple tabs for specific functions.

---

## Creating Your First Campaign

### Step 1: Plan Your Campaign

Before creating your campaign, determine:
- **Goal**: What do you want to achieve? (sales, engagement, education)
- **Audience**: Who are you targeting?
- **Message**: What's your core message?
- **Call-to-Action**: What action should recipients take?

### Step 2: Create the Campaign

1. Navigate to **CREATE** → **Campaign Builder**

2. Fill in the campaign details:
   - **Campaign Name**: Internal name for your campaign (e.g., "Summer Sale 2026")
   - **Subject Line**: What recipients will see (e.g., "Get 20% off this weekend only!")
   - **Preheader**: Preview text shown in inbox (e.g., "Limited time offer")
   - **From Name**: Choose from your sender profiles
   - **From Email**: Your verified sending email
   - **Reply-To**: Where replies should go
   - **Campaign Type**: Regular campaign

3. Select your audience:
   - **Segment**: Choose a pre-built segment (e.g., "VIP Customers")
   - **List**: Or select a contact list

4. Click "Save Campaign"

Your campaign is now created as a **draft**.

### Step 3: Design Your Email

1. Go to **CREATE** → **Email Designer**

2. Choose one of three approaches:

   **Option A: Use a Template**
   - Click "Templates Library"
   - Browse available templates
   - Click "Use This Template"
   - Customize the content and images

   **Option B: Use AI Content Generator**
   - Click "AI Content Generator"
   - Enter your campaign topic (e.g., "Summer furniture sale")
   - Choose your tone (professional, friendly, casual, urgent)
   - Select content length (short, medium, long)
   - Click "Generate"
   - Review and use the AI-generated content

   **Option C: Design from Scratch**
   - Use the HTML editor to write custom email HTML
   - Preview your design in real-time
   - Add dynamic variables like `{{firstName}}` for personalization

3. Click "Save Design"

### Step 4: Preview and Test

1. Go to **MANAGE** → **Campaign Details**
2. Review all campaign information
3. Click "Preview" to see how your email will look
4. Send a test email:
   - Click "Send Test"
   - Enter test email addresses
   - Click "Send"
   - Check your inbox and verify rendering

### Step 5: Schedule or Send

**Option A: Send Immediately**
1. Click "Send Now"
2. Confirm the send
3. Your campaign will start sending within seconds

**Option B: Schedule for Later**
1. Click "Schedule"
2. Choose date and time
3. The campaign will automatically send at the scheduled time

**Option C: Use AI Send Time Optimization**
1. Go to **OPTIMIZE** → **Send Time Optimization**
2. Click "Analyze Optimal Times"
3. The AI will recommend the best day and hour based on your audience's behavior
4. Click "Use This Time" to schedule automatically

### Step 6: Monitor Performance

1. Go to **ANALYZE** → **Campaign Analytics**
2. Select your campaign
3. View real-time metrics:
   - **Send Status**: How many emails have been sent
   - **Open Rate**: Percentage of recipients who opened
   - **Click Rate**: Percentage who clicked links
   - **Deliverability**: Bounces and spam complaints

---

## Building Email Templates

### Creating a Template

Templates allow you to reuse email designs across multiple campaigns.

1. Go to **CREATE** → **Template Editor**

2. Enter template details:
   - **Template Name**: Descriptive name (e.g., "Product Launch Template")
   - **Category**: Classify your template (promotional, transactional, newsletter)

3. Design your template:
   - Use HTML for full control
   - Include dynamic variables for personalization:
     - `{{firstName}}` - Contact's first name
     - `{{lastName}}` - Contact's last name
     - `{{email}}` - Contact's email
     - `{{company}}` - Contact's company
     - Custom fields work too: `{{customField.favoriteProduct}}`

4. Save your template

### Example Template with Personalization

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{{campaignName}}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="padding: 20px; background-color: #f5f5f5;">
    <h1 style="color: #333;">Hi {{firstName}}! 👋</h1>
    
    <div style="background-color: white; padding: 30px; border-radius: 8px;">
      <p style="font-size: 16px; line-height: 1.6;">
        We noticed you're interested in {{customField.favoriteCategory}}.
        We've got something special for you!
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #f0f8ff; border-left: 4px solid #007bff;">
        <h2 style="margin: 0 0 10px 0; color: #007bff;">Exclusive Offer</h2>
        <p style="font-size: 24px; font-weight: bold; margin: 0; color: #333;">
          20% Off {{customField.favoriteCategory}}
        </p>
      </div>
      
      <a href="{{shopUrl}}?utm_source=email&utm_campaign={{campaignId}}" 
         style="display: inline-block; padding: 15px 40px; background-color: #007bff; 
                color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Shop Now
      </a>
      
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Questions? Reply to this email - we're here to help!
      </p>
    </div>
    
    <div style="margin-top: 20px; padding: 20px; font-size: 12px; color: #999; text-align: center;">
      <p>{{companyName}} | {{companyAddress}}</p>
      <p>
        <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### Using Pre-Built Templates

1. Go to **MANAGE** → **Templates Library**
2. Browse available templates by category
3. Click "Duplicate" on any template to create your own copy
4. Customize the duplicated template
5. Use in campaigns

---

## AI-Powered Content Generation

The Email Automation Builder includes powerful AI capabilities to help you create high-performing content.

### Generating Subject Lines

**Why it matters**: Subject lines determine whether your email gets opened. AI can help you create compelling subject lines that drive higher open rates.

1. Go to **CREATE** → **AI Content Generator**

2. Select "Subject Line Generation"

3. Enter your campaign details:
   - **Campaign Goal**: "Promote summer sale"
   - **Product/Topic**: "Outdoor furniture"
   - **Offer**: "20% off"
   - **Tone**: "Professional"
   - **Count**: 5 (generates 5 variations)

4. Choose your AI model:
   - **GPT-4o-mini**: Fast, cost-effective, great for most use cases
   - **Claude 3.5 Sonnet**: Excellent for creative, engaging content
   - **GPT-4**: Most powerful, best for complex personalization

5. Click "Generate"

6. Review the results:
   - Each subject line shows a predicted open rate
   - Content quality score (0-100)
   - Spam score (lower is better)
   - Character count

7. Click "Use This" on your favorite option

**Example Output:**
```
1. "Transform Your Outdoor Space - Save 20% This Weekend" 
   Predicted Open Rate: 28.5% | Score: 92 | Spam: 12

2. "🌞 Summer Sale: 20% Off Outdoor Furniture"
   Predicted Open Rate: 26.7% | Score: 88 | Spam: 15

3. "Limited Time: Premium Outdoor Furniture at 20% Off"
   Predicted Open Rate: 25.3% | Score: 85 | Spam: 10
```

### Generating Email Body Content

1. Go to **CREATE** → **AI Content Generator**

2. Select "Email Body Generation"

3. Enter details:
   - **Topic**: "Summer furniture sale - 20% off outdoor furniture"
   - **Length**: Medium (200-300 words)
   - **Tone**: Professional
   - **Include CTA**: Yes

4. Click "Generate"

5. The AI will create a complete email body including:
   - Engaging introduction
   - Key selling points
   - Clear call-to-action
   - Professional closing

**Pro Tips:**
- Use **Best-of-N** strategy to generate 3 versions and automatically pick the best
- Use **Ensemble** to combine ideas from multiple AI models
- Provide more context for better results (target audience, key benefits, etc.)

### AI Content Optimization

**Check Spam Score**
1. Go to **OPTIMIZE** → **Spam Score Checker**
2. Enter your subject line and email body
3. Click "Check Spam Score"
4. Review the score (0-100, lower is better)
5. Follow recommendations to reduce spam triggers

**Readability Analysis**
- AI automatically calculates Flesch Reading Ease score
- Target score: 60-70 for general audiences
- Recommendations provided to improve readability

**Sentiment Analysis**
- Detects overall tone (positive, negative, neutral)
- Ensures your message aligns with campaign goals
- Suggests adjustments if needed

**CTA Optimization**
1. Enter your current call-to-action
2. AI generates 5 alternatives optimized for clicks
3. Test different CTAs to see what performs best

---

## Audience Segmentation

Effective segmentation is key to personalized, high-converting email campaigns.

### Types of Segments

**1. Static Segments**
- Manually added contacts
- Does not update automatically
- Use for: One-time campaigns, imported lists

**2. Dynamic Segments**
- Automatically updates based on conditions
- Real-time membership
- Use for: Ongoing campaigns, behavior-based targeting

**3. Behavioral Segments**
- Based on contact actions (opens, clicks, purchases)
- Tracks engagement over time
- Use for: Re-engagement campaigns, VIP programs

**4. Predictive Segments**
- AI-powered predictions (churn risk, purchase probability, LTV)
- Updates daily based on ML models
- Use for: Proactive retention, upselling

### Creating a Dynamic Segment

**Example: High-Value Active Customers**

1. Go to **MANAGE** → **Segments**

2. Click "Create Segment"

3. Enter segment details:
   - **Name**: "High-Value Active Customers"
   - **Type**: Dynamic
   - **Description**: "Customers with 5+ purchases and recent activity"

4. Set conditions:
   ```json
   {
     "totalPurchases": { "gte": 5 },
     "totalSpent": { "gte": 500 },
     "lastPurchaseDate": { "within": "30d" },
     "engagementScore": { "gte": 70 }
   }
   ```

5. Click "Create"

The segment will automatically update as contacts meet or no longer meet the criteria.

### Creating a Behavioral Segment

**Example: Recent Email Engagers**

1. Go to **MANAGE** → **Segments**

2. Click "Create Segment"

3. Select type: "Behavioral"

4. Configure:
   - **Event**: "email_opened"
   - **Timeframe**: "Last 7 days"
   - **Count**: At least 3 times

5. Click "Create"

This segment will include contacts who opened at least 3 emails in the past week.

### Creating a Predictive Segment

**Example: High Churn Risk**

1. Go to **MANAGE** → **Segments**

2. Click "Create Segment"

3. Select type: "Predictive - Churn Risk"

4. Configure:
   - **Risk Level**: High
   - **Lookback Period**: 30 days

5. Click "Create"

The AI will analyze contact behavior and predict churn risk, automatically adding high-risk contacts to this segment.

**Other Predictive Segments:**
- **Likely to Convert**: Contacts with high conversion probability
- **High LTV Prospects**: Contacts predicted to have high lifetime value
- **Next Purchase Prediction**: Contacts likely to purchase soon

### Using Segments in Campaigns

1. When creating a campaign, select your target segment
2. The campaign will only send to contacts in that segment
3. For dynamic segments, membership is evaluated at send time
4. You can combine multiple segments using AND/OR logic

---

## Automation Workflows

Workflows allow you to create automated, triggered email sequences that respond to customer actions.

### Understanding Workflows

**Components:**
1. **Trigger**: Event that starts the workflow
2. **Actions**: Steps that execute in sequence
3. **Conditions**: Logic to split paths based on data
4. **Wait Steps**: Delays between actions

**Common Workflow Types:**
- Welcome Series (trigger: contact created)
- Abandoned Cart (trigger: cart abandoned)
- Post-Purchase Follow-Up (trigger: purchase completed)
- Re-Engagement (trigger: inactivity)
- Birthday Campaign (trigger: date-based)

### Creating a Welcome Series Workflow

**Goal**: Send 3 emails to new subscribers over 1 week

1. Go to **AUTOMATE** → **Workflows**

2. Click "Create Workflow"

3. Configure the trigger:
   - **Name**: "Welcome Series"
   - **Trigger Type**: "Contact Created"
   - **Description**: "3-email welcome sequence for new subscribers"

4. Add actions:

   **Action 1: Send Welcome Email (immediately)**
   - Type: Send Email
   - Template: "Welcome Email 1 - Introduction"
   - Delay: 0 seconds

   **Action 2: Wait**
   - Type: Wait
   - Duration: 2 days (172,800 seconds)

   **Action 3: Send Educational Email**
   - Type: Send Email
   - Template: "Welcome Email 2 - How to Get Started"
   - Delay: 0 seconds

   **Action 4: Wait**
   - Type: Wait
   - Duration: 3 days (259,200 seconds)

   **Action 5: Send Offer Email**
   - Type: Send Email
   - Template: "Welcome Email 3 - Special Offer"
   - Delay: 0 seconds

5. Click "Save Workflow"

6. Click "Activate" to start the workflow

Now, every new contact will automatically receive this 3-email series!

### Using Workflow Templates

Pre-built templates make it easy to get started:

1. Go to **AUTOMATE** → **Workflow Templates**

2. Browse available templates:
   - **Welcome Series**: 3-email onboarding sequence
   - **Abandoned Cart Recovery**: Cart reminder + offers
   - **Win-Back Campaign**: Re-engage inactive contacts
   - **Post-Purchase**: Thank you + cross-sell
   - **Birthday Campaign**: Automated birthday emails

3. Click "Use Template" on your chosen workflow

4. Customize the emails and timing

5. Activate the workflow

### Advanced: Conditional Split Workflow

**Example: Abandoned Cart with Value-Based Offers**

This workflow sends different offers based on cart value.

```
Trigger: Cart Abandoned (1 hour)
  ↓
Action: Wait 1 hour
  ↓
Conditional Split: Cart Value > $100?
  ↓                           ↓
YES                          NO
  ↓                           ↓
Send Email:                 Send Email:
"High-Value Cart            "Standard Cart
 Reminder + 15% Off"        Reminder + 10% Off"
  ↓                           ↓
Wait 24 hours               Wait 24 hours
  ↓                           ↓
Conditional: Cart still abandoned?
  ↓
YES: Send SMS Reminder
NO: Exit workflow
```

**To create:**

1. Create workflow with trigger "Cart Abandoned"
2. Add action: "Wait" (3600 seconds)
3. Add action: "Conditional Split"
   - Condition: `cartValue > 100`
   - True Path: Send high-value offer email
   - False Path: Send standard offer email
4. Both paths converge to another wait step
5. Add another conditional to check if purchase was made
6. If not, send SMS reminder

### Workflow Analytics

Monitor workflow performance:

1. Go to **AUTOMATE** → **Workflows**
2. Click "Analytics" on any active workflow
3. View metrics:
   - **Total Executions**: How many times workflow has run
   - **Success Rate**: Percentage completed successfully
   - **Average Duration**: Time from start to finish
   - **Goal Completion**: If goals are set (e.g., purchase conversion)

---

## Visual Workflow Builder

The Visual Workflow Builder provides a drag-and-drop interface for creating complex automation flows.

### Interface Overview

**Key Elements:**
- **Canvas**: Main area where you build your flow
- **Trigger Panel**: Starting point for your workflow
- **Action Library**: Available actions you can add
- **Connection Lines**: Show the flow between steps
- **Properties Panel**: Configure selected step

### Creating a Visual Workflow

1. Go to **AUTOMATE** → **Workflow Builder**

2. Click "Add Trigger" to start

3. Select your trigger type from the library:
   - Contact Created
   - Email Opened
   - Link Clicked
   - Segment Joined
   - Purchase Completed
   - Cart Abandoned
   - Date-Based
   - API Event

4. Drag actions from the Action Library onto the canvas:
   - **Send Email**: Send an email template
   - **Send SMS**: Send a text message
   - **Add to Segment**: Add contact to a segment
   - **Remove from Segment**: Remove contact from segment
   - **Update Field**: Modify contact data
   - **Wait**: Add a delay
   - **Conditional Split**: Branch based on conditions
   - **Webhook**: Call external API
   - **End**: Terminate the workflow

5. Connect steps by clicking and dragging between connection points

6. Click any step to configure it in the Properties Panel

7. Test your workflow:
   - Click "Test Workflow"
   - Provide test data
   - Watch the flow execute in real-time
   - Review results at each step

8. When ready, click "Activate Workflow"

### Best Practices for Visual Workflows

- **Keep it simple**: Start with basic flows, add complexity gradually
- **Use descriptive names**: Label each step clearly
- **Test thoroughly**: Use test mode before activating
- **Monitor performance**: Check analytics regularly
- **Version control**: Save versions before making major changes

---

## Multi-Channel Orchestration

Reach customers across email, SMS, push notifications, WhatsApp, and in-app messages.

### Setting Up Multi-Channel Workflows

**Example: Cross-Channel Welcome Journey**

```
Trigger: Contact Created
  ↓
Day 0: Send Welcome Email
  ↓
Day 1: Send SMS "Thanks for joining!"
  ↓
Day 3: Send Push Notification "Check out your personalized recommendations"
  ↓
Day 7: Check engagement
  ↓
High Engagement: Send Email "Exclusive offer"
Low Engagement: Send WhatsApp "We'd love to hear from you"
```

### Channel-Specific Setup

**Email**
- Already configured via ESP integration
- No additional setup needed

**SMS**
1. Go to **TOOLS** → **SMS Providers**
2. Choose provider (Twilio, Plivo, AWS SNS)
3. Enter credentials:
   - Account SID
   - Auth Token
   - From Phone Number
4. Click "Test" to verify

**Push Notifications**
1. Configure push credentials in your mobile app
2. SDK will automatically register devices
3. View subscription stats in **TOOLS** → **Push Subscriptions**

**WhatsApp Business**
1. Set up WhatsApp Business API account
2. Create message templates (required by WhatsApp)
3. Configure in **TOOLS** → **WhatsApp Settings**
4. Use approved templates in workflows

**In-App Messages**
1. Integrate SDK in your app
2. Messages appear when user opens app
3. Target specific user segments

### Creating a Cross-Channel Journey

1. Go to **AUTOMATE** → **Journey Builder**

2. Enter journey details:
   - **Name**: "Product Launch Cross-Channel"
   - **Goal**: Drive product awareness and sales

3. Add journey steps:

   **Step 1**: Email announcement (Day 0)
   - Channel: Email
   - Content: "Introducing our new product"
   - Delay: 0

   **Step 2**: SMS reminder (Day 1)
   - Channel: SMS
   - Content: "Don't miss our new product launch!"
   - Delay: 86,400 seconds (1 day)

   **Step 3**: Push notification (Day 3)
   - Channel: Push
   - Content: "New product - 20% off launch special"
   - Delay: 172,800 seconds (2 days)

4. Set journey goals:
   - Goal metric: Purchase conversion
   - Target: 5% conversion rate

5. Click "Activate Journey"

### Channel Performance Analytics

Compare performance across channels:

1. Go to **ANALYZE** → **Engagement Metrics**
2. View by channel:
   - **Email**: Open rate, click rate, conversion
   - **SMS**: Delivery rate, click rate, conversion
   - **Push**: Open rate, click rate, conversion
   - **WhatsApp**: Delivery rate, read rate, conversion

3. Optimize based on data:
   - Which channel drives highest engagement?
   - Which channel converts best?
   - What's the optimal channel mix?

---

## A/B Testing & Optimization

Continuously improve your campaigns through systematic testing.

### Creating an A/B Test

**Example: Test Subject Lines**

1. Go to **OPTIMIZE** → **A/B Testing**

2. Click "Create A/B Test"

3. Configure test:
   - **Name**: "Summer Sale Subject Line Test"
   - **Campaign**: Select your campaign
   - **Test Type**: Subject Line
   - **Sample Size**: 20% (sends variants to 20% of list, winner to remaining 80%)
   - **Duration**: 24 hours (determines winner after 24 hours)
   - **Success Metric**: Open Rate

4. Add variants:
   
   **Variant A (Control)**
   - Subject: "Get 20% off this weekend only!"
   
   **Variant B**
   - Subject: "Limited Time: Save 20% on Everything"

5. Click "Start Test"

6. After 24 hours, view results:
   - Variant A: 21.5% open rate
   - Variant B: 28.5% open rate ✅ Winner!
   - Confidence: 95.5%
   - Uplift: +32.6%

7. Click "Apply Winner" to send Variant B to the remaining audience

### A/B Test Types

**Subject Line Testing**
- Test different subject lines
- Success metric: Open rate
- Sample: 2-5 variants

**Content Testing**
- Test email body variations
- Success metric: Click rate or conversion
- Sample: 2-3 variants

**Send Time Testing**
- Test different send times
- Success metric: Open rate and engagement
- Sample: Multiple time slots

**From Name Testing**
- Test different sender names
- Success metric: Open rate
- Sample: 2-3 variants

### Multivariate Testing

Test multiple elements simultaneously.

**Example: Test subject + CTA + image**

1. Go to **OPTIMIZE** → **A/B Testing** → **Multivariate**

2. Define elements to test:
   - **Element 1**: Subject Line (2 variants)
   - **Element 2**: CTA Button (2 variants)
   - **Element 3**: Hero Image (2 variants)

3. This creates 8 combinations (2 × 2 × 2)

4. System tests all combinations

5. Results show best performing combination:
   - Subject B + CTA A + Image B = highest conversion

### Send Time Optimization

Let AI determine the optimal send time for your audience.

1. Go to **OPTIMIZE** → **Send Time Optimization**

2. Click "Analyze Optimal Times"

3. Configure:
   - **Segment**: Choose your target segment
   - **Lookback Period**: 30 days (analyzes past 30 days)

4. Click "Analyze"

5. AI recommendations:
   ```
   Optimal Send Times:
   
   #1: Tuesday at 10:00 AM
   Predicted Open Rate: 28.5%
   Confidence: 89%
   
   #2: Wednesday at 2:00 PM  
   Predicted Open Rate: 26.7%
   Confidence: 84%
   
   #3: Thursday at 9:00 AM
   Predicted Open Rate: 25.3%
   Confidence: 81%
   ```

6. Click "Use This Time" to schedule your campaign automatically

### Frequency Capping

Prevent email fatigue by limiting email frequency.

1. Go to **OPTIMIZE** → **Frequency Capping**

2. Create a cap:
   - **Max Emails**: 7
   - **Period**: Week
   - **Applied To**: All contacts (or specific segments)

3. Click "Save"

Now, no contact will receive more than 7 emails per week.

**Check if a contact is at their limit:**
1. Go to **OPTIMIZE** → **Frequency Capping**
2. Enter contact ID
3. View current count vs. limit

---

## Analytics & Reporting

Measure campaign performance and make data-driven decisions.

### Campaign Analytics Dashboard

1. Go to **ANALYZE** → **Campaign Analytics**

2. Select your campaign

3. View key metrics:

   **Delivery Metrics**
   - Sent: 10,000
   - Delivered: 9,800 (98%)
   - Bounces: 200 (2%)

   **Engagement Metrics**
   - Opens: 2,450
   - Unique Opens: 2,100 (21.4% open rate)
   - Clicks: 735
   - Unique Clicks: 650 (6.6% click rate)
   - Click-to-Open Rate: 31%

   **Negative Metrics**
   - Unsubscribes: 15 (0.15%)
   - Spam Complaints: 5 (0.05%)

4. Deeper insights:

   **Engagement Timeline**
   - Hourly breakdown of opens and clicks
   - See when recipients are most active

   **Top Clicked Links**
   - Which links got the most clicks
   - Optimize future content based on interest

   **Device Breakdown**
   - Desktop: 60%
   - Mobile: 35%
   - Tablet: 5%
   - Optimize design for primary devices

   **Geographic Distribution**
   - Where your audience is located
   - Consider time zones for send time

   **Email Clients**
   - Gmail: 45%
   - Apple Mail: 25%
   - Outlook: 20%
   - Other: 10%
   - Test rendering on top clients

### Engagement Metrics Overview

1. Go to **ANALYZE** → **Engagement Metrics**

2. Select time period (7d, 30d, 90d, 1y)

3. View aggregate metrics:
   - Average Open Rate: 22.5%
   - Average Click Rate: 6.8%
   - Average Bounce Rate: 1.8%
   - Average Unsubscribe Rate: 0.12%
   - Overall Engagement Score: 78/100

4. View trends over time:
   - Are metrics improving or declining?
   - Identify seasonal patterns
   - Spot issues early

5. Engagement Heatmap:
   - See which days and hours drive highest engagement
   - Optimize send times based on data

### Revenue Attribution

Track revenue generated by email campaigns.

1. Go to **ANALYZE** → **Revenue Attribution**

2. View revenue metrics:

   **Campaign Revenue Example**
   - Campaign: Summer Sale 2026
   - Total Revenue: $15,678.50
   - Orders: 347
   - Average Order Value: $45.19
   - Revenue per Recipient: $1.57
   - ROI: 4.5x

3. Compare attribution models:

   **Last-Click Attribution**
   - Full credit to last touchpoint before purchase
   - Revenue: $234,567.89

   **First-Click Attribution**
   - Full credit to first touchpoint
   - Revenue: $189,234.56

   **Linear Attribution**
   - Equal credit to all touchpoints
   - Revenue: $207,891.23

   **Time-Decay Attribution**
   - More credit to recent touchpoints
   - Revenue: $218,456.78

4. Create custom attribution:
   - Set weights for first, middle, last touch
   - Example: 30% first, 20% middle, 50% last

### Executive Summary Report

1. Go to **ANALYZE** → **Custom Reports**

2. Click "Generate Summary Report"

3. Select period (e.g., last 30 days)

4. Report includes:
   - Campaigns sent
   - Total emails delivered
   - Average performance metrics
   - Total revenue generated
   - ROI
   - Top performing campaigns
   - Improvement opportunities

5. Export as PDF or CSV for stakeholders

---

## Predictive Analytics

Use AI to predict customer behavior and take proactive action.

### Churn Prediction

Identify contacts at risk of churning before they leave.

1. Go to **ANALYZE** → **Predictive Analytics** → **Churn Prediction**

2. View churn risk distribution:
   - High Risk: 1,250 contacts (5%)
   - Medium Risk: 3,750 contacts (15%)
   - Low Risk: 20,000 contacts (80%)

3. Review top churn factors:
   - Low engagement (< 2 opens in 30 days): 35% impact
   - No purchases in 90 days: 28% impact
   - Decreased session frequency: 22% impact
   - Support tickets filed: 15% impact

4. Take action:
   - Create segment: "High Churn Risk"
   - Build re-engagement workflow
   - Send personalized win-back offers
   - Monitor churn rate reduction

**Estimated Impact**: Reduce churn by 15-25% through proactive engagement

### Lifetime Value (LTV) Prediction

Predict future customer value to prioritize high-value prospects.

1. Go to **ANALYZE** → **Predictive Analytics** → **LTV Prediction**

2. Select segment (or all contacts)

3. View LTV distribution:
   - Low (0-$100): 5,000 contacts, avg LTV $45
   - Medium ($100-$500): 15,000 contacts, avg LTV $287
   - High ($500+): 5,000 contacts, avg LTV $1,235

4. Identify high-LTV prospects early:
   - Create segment: "High LTV Potential"
   - Provide white-glove service
   - Offer premium products
   - Build loyalty programs

### Next Purchase Prediction

Predict when a customer is likely to purchase next.

1. Go to **ANALYZE** → **Predictive Analytics** → **Next Purchase**

2. Enter contact ID or select segment

3. View prediction:
   - **Probability**: 78% likely to purchase
   - **Estimated Date**: February 25, 2026
   - **Confidence**: 85%
   - **Recommended Products**:
     - Product A (65% probability)
     - Product B (48% probability)
     - Product C (32% probability)

4. Take action:
   - Send targeted email with recommended products
   - Time the send for a few days before predicted date
   - Include special offer to accelerate purchase

### Channel Preference Prediction

Determine which channel each contact prefers.

1. Go to **ANALYZE** → **Predictive Analytics** → **Best Channel**

2. Enter contact ID

3. View channel recommendations:
   - **Email**: 85% engagement probability (recommended ✅)
   - **SMS**: 62% engagement probability
   - **Push**: 45% engagement probability

4. Optimize your multi-channel strategy:
   - Send important messages via preferred channel
   - Use secondary channels for reinforcement
   - Respect channel preferences to reduce fatigue

---

## ESP Integration Setup

### SendGrid Integration

1. **Get SendGrid API Key**
   - Log in to SendGrid dashboard
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Select "Full Access"
   - Copy the API key

2. **Configure in Platform**
   - Go to **TOOLS** → **ESP Integrations**
   - Select "SendGrid"
   - Paste API key
   - Click "Save"
   - Click "Test Connection"
   - ✅ Connection successful

3. **Verify Sending Domain**
   - In SendGrid, go to Settings → Sender Authentication
   - Add your domain
   - Copy DNS records
   - Add to your DNS provider
   - Verify in SendGrid

### AWS SES Integration

1. **Set Up AWS SES**
   - Log in to AWS Console
   - Navigate to SES (Simple Email Service)
   - Request production access (if in sandbox)
   - Create SMTP credentials or API keys

2. **Configure in Platform**
   - Go to **TOOLS** → **ESP Integrations**
   - Select "AWS SES"
   - Enter:
     - AWS Access Key ID
     - AWS Secret Access Key
     - Region (e.g., us-east-1)
   - Click "Save"
   - Click "Test Connection"

3. **Verify Domain in SES**
   - In SES dashboard, go to "Verified Identities"
   - Click "Create Identity"
   - Select "Domain"
   - Enter your domain
   - Copy DNS records
   - Add to DNS provider
   - Verify

### Mailgun Integration

1. **Get Mailgun API Key**
   - Log in to Mailgun
   - Go to Settings → API Keys
   - Copy the Private API Key

2. **Configure in Platform**
   - Go to **TOOLS** → **ESP Integrations**
   - Select "Mailgun"
   - Enter:
     - API Key
     - Domain
     - Region (US or EU)
   - Click "Save"
   - Click "Test Connection"

### ESP Failover Configuration

The platform automatically handles failover between ESPs.

**How it works:**
1. Platform monitors ESP health every 5 minutes
2. If primary ESP fails or is slow, traffic routes to backup
3. When primary recovers, traffic returns automatically

**Configure failover priority:**
1. Go to **TOOLS** → **ESP Integrations**
2. Drag ESPs to reorder priority:
   - 1st: Primary ESP (handles most traffic)
   - 2nd: Backup ESP (activates on primary failure)
   - 3rd: Tertiary backup

**View ESP Health:**
- Go to **TOOLS** → **ESP Integrations**
- View health status for each ESP:
  - ✅ Healthy: Green status, normal latency
  - ⚠️ Degraded: Yellow status, slow response
  - ❌ Down: Red status, unavailable

---

## Domain Authentication

Proper domain authentication is critical for email deliverability.

### Why Domain Authentication Matters

**Without authentication:**
- Emails may go to spam
- Low deliverability rates
- Damaged sender reputation
- Poor engagement

**With authentication:**
- Inbox placement
- High deliverability (98%+)
- Trusted sender status
- Better engagement rates

### SPF (Sender Policy Framework)

**What it does**: Specifies which mail servers can send on behalf of your domain.

**Setup:**
1. Go to **Settings** → **Domain Authentication**
2. Click on your domain
3. Copy the SPF record:
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:_spf.youresp.com ~all
   ```
4. Add to your DNS provider
5. Wait 24-48 hours for propagation
6. Click "Verify SPF"
7. ✅ SPF should show as verified

### DKIM (DomainKeys Identified Mail)

**What it does**: Adds a digital signature to your emails proving authenticity.

**Setup:**
1. Go to **Settings** → **Domain Authentication**
2. Click on your domain
3. Copy the DKIM record:
   ```
   Type: TXT
   Host: default._domainkey
   Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA...
   ```
4. Add to your DNS provider
5. Wait 24-48 hours
6. Click "Verify DKIM"
7. ✅ DKIM should show as verified

### DMARC (Domain-based Message Authentication)

**What it does**: Tells receiving servers what to do if SPF or DKIM checks fail.

**Setup:**
1. Go to **Settings** → **Domain Authentication**
2. Click on your domain
3. Copy the DMARC record:
   ```
   Type: TXT
   Host: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
   ```
4. Add to your DNS provider
5. Wait 24-48 hours
6. Click "Verify DMARC"
7. ✅ DMARC should show as verified

### DMARC Policy Levels

- **p=none**: Monitor only, don't reject (recommended for testing)
- **p=quarantine**: Send failing emails to spam (recommended)
- **p=reject**: Reject failing emails entirely (strictest)

### Verification Checklist

✅ **Fully Authenticated Domain:**
- SPF: Verified ✅
- DKIM: Verified ✅
- DMARC: Verified ✅
- Status: Active ✅
- Expected Deliverability: 98%+

Review your domain status regularly in **Settings** → **Domain Authentication**.

---

## Best Practices

### Subject Line Best Practices

**Do:**
- Keep it under 50 characters
- Create urgency without being spammy
- Personalize with recipient name or details
- Be specific about the value proposition
- Test with A/B testing
- Use emojis sparingly (1-2 max)

**Don't:**
- Use all caps (LOOKS LIKE SPAM)
- Overuse exclamation marks!!!!!
- Make false promises
- Use spam trigger words (FREE, URGENT, CASH, WINNER)
- Mislead about email content

**Examples:**

✅ Good:
- "John, your exclusive 20% discount expires tonight"
- "5 ways to improve your marketing ROI"
- "Your order #12345 has shipped"

❌ Bad:
- "FREE CASH PRIZE!!! CLICK NOW!!!!"
- "You won't believe this amazing offer"
- "RE: Your Account" (if not a reply)

### Email Design Best Practices

**Mobile-First Design**
- 35-60% of emails are opened on mobile
- Use responsive templates
- Keep width under 600px
- Use large, tappable buttons (min 44×44px)
- Test on multiple devices

**Content Guidelines**
- Keep it concise (200-300 words for promotional)
- Use clear hierarchy (headings, bullet points)
- Include alt text for all images
- Use web-safe fonts (Arial, Georgia, Verdana)
- Maintain brand consistency

**Call-to-Action**
- One primary CTA per email
- Use action-oriented language ("Shop Now", "Get Started")
- Make buttons stand out visually
- Place CTA above the fold
- Repeat CTA at bottom for long emails

**Accessibility**
- Use semantic HTML
- Provide alt text for images
- Ensure sufficient color contrast (4.5:1 minimum)
- Use readable font sizes (14px minimum)
- Test with screen readers

### Sending Best Practices

**Timing**
- Send between 9 AM - 5 PM in recipient's timezone
- Avoid weekends for B2B (unless B2C retail)
- Tuesday, Wednesday, Thursday typically perform best
- Use Send Time Optimization for best results

**Frequency**
- Newsletter: Weekly or bi-weekly
- Promotional: 2-4 times per month
- Transactional: As needed
- Use frequency capping to prevent fatigue

**List Hygiene**
- Remove hard bounces immediately
- Remove soft bounces after 3-5 attempts
- Remove inactive contacts after 6-12 months
- Honor unsubscribe requests within 24 hours
- Maintain 2%+ engagement rate minimum

### Deliverability Best Practices

**Warm Up New Domains**
1. Start with small volumes (100-500 emails/day)
2. Gradually increase over 4-6 weeks
3. Send to engaged contacts first
4. Monitor bounce and complaint rates
5. Reach full volume after warmup period

**Maintain Sender Reputation**
- Keep bounce rate < 2%
- Keep complaint rate < 0.1%
- Keep unsubscribe rate < 0.5%
- Authenticate your domain (SPF, DKIM, DMARC)
- Monitor blacklists regularly

**Content Quality**
- Avoid spam trigger words
- Balance text-to-image ratio (60:40)
- Include unsubscribe link in every email
- Include physical mailing address
- Test spam score before sending

### Segmentation Best Practices

**Segment by:**
- Demographics (age, location, gender)
- Behavior (opens, clicks, purchases)
- Engagement level (active, at-risk, inactive)
- Purchase history (new customer, repeat, VIP)
- Lifecycle stage (prospect, customer, churned)
- Product interests (categories browsed/purchased)

**Targeting Strategy:**
- Send targeted content to specific segments
- Personalize based on segment characteristics
- Test different approaches per segment
- Monitor performance by segment
- Refine segments based on results

### Personalization Best Practices

**Basic Personalization:**
- First name in subject line
- First name in greeting
- Location-based content
- Recent browsing/purchase history

**Advanced Personalization:**
- Dynamic content blocks based on interests
- Behavioral triggers based on actions
- Predictive product recommendations
- Send time optimization per contact
- Channel preference optimization

**Example:**
```
Subject: {{firstName}}, exclusive offer on {{favoriteCategory}}

Hi {{firstName}},

We noticed you love {{favoriteCategory}}. Here are our newest arrivals:

[Dynamic product recommendations based on browsing history]

As a valued customer from {{city}}, here's a special offer:
[Location-based promotion]

Shop Now
```

### A/B Testing Best Practices

**What to Test:**
- Subject lines (highest impact)
- From name
- Send time
- Email content/layout
- CTA button text/color
- Images
- Personalization level

**Testing Guidelines:**
- Test one variable at a time (unless multivariate)
- Use statistical significance (95% confidence minimum)
- Test with sufficient sample size (minimum 1,000 per variant)
- Run for 24-48 hours minimum
- Document results for future reference
- Implement winners immediately

### Compliance Best Practices

**CAN-SPAM Compliance (US):**
- Include physical address
- Clear unsubscribe link
- Honor opt-outs within 10 business days
- Accurate "From" information
- Honest subject lines

**GDPR Compliance (EU):**
- Obtain explicit consent
- Provide clear privacy policy
- Allow data access/export
- Honor deletion requests within 30 days
- Maintain processing records

**Best Practices:**
- Double opt-in for new subscribers
- Clear consent checkboxes (unchecked by default)
- Easy one-click unsubscribe
- Preference center for granular control
- Regular compliance audits

---

## Troubleshooting

### Low Open Rates

**Symptoms**: Open rate below 15%

**Possible Causes:**
1. Poor subject lines
2. Sending to inactive contacts
3. Bad sender reputation
4. Emails going to spam
5. Sending at wrong times

**Solutions:**
1. Use AI to generate better subject lines
2. Clean your list (remove inactive contacts)
3. Improve domain authentication (SPF, DKIM, DMARC)
4. Check spam score before sending
5. Use Send Time Optimization
6. A/B test subject lines
7. Segment your list and send targeted content

### Low Click Rates

**Symptoms**: Click rate below 2%

**Possible Causes:**
1. Weak or unclear CTA
2. Content not relevant to audience
3. Poor email design
4. Mobile display issues
5. Links not compelling

**Solutions:**
1. Use AI CTA Optimization
2. Improve segmentation for relevance
3. Simplify email design
4. Test on mobile devices
5. Make buttons larger and more prominent
6. Use action-oriented language
7. Add urgency to CTAs

### High Bounce Rate

**Symptoms**: Bounce rate above 2%

**Hard Bounces** (permanent failures):
1. Remove hard bounces immediately
2. Verify email addresses at signup
3. Use double opt-in
4. Regularly clean your list

**Soft Bounces** (temporary failures):
1. Retry after 24 hours
2. Remove after 3-5 consecutive soft bounces
3. Check for oversized emails (< 102KB recommended)

### High Unsubscribe Rate

**Symptoms**: Unsubscribe rate above 0.5%

**Possible Causes:**
1. Sending too frequently
2. Content not relevant
3. Expectations not set at signup
4. Poor list quality

**Solutions:**
1. Implement frequency capping
2. Improve segmentation
3. Set clear expectations at signup
4. Use preference center
5. Survey unsubscribers to learn why
6. Reduce send frequency
7. Improve content relevance

### Emails Going to Spam

**Symptoms**: Low deliverability, high spam complaint rate

**Solutions:**
1. Verify domain authentication (SPF, DKIM, DMARC)
2. Check spam score (aim for < 5)
3. Avoid spam trigger words
4. Balance text-to-image ratio
5. Include unsubscribe link
6. Warm up new sending domains
7. Monitor sender reputation
8. Remove spam traps from list
9. Use double opt-in

**Check Spam Score:**
1. Go to **OPTIMIZE** → **Spam Score Checker**
2. Enter subject and body
3. Review score and recommendations
4. Fix issues before sending

### ESP Connection Issues

**Symptoms**: "ESP connection failed" error

**Solutions:**
1. Verify API credentials are correct
2. Check API key hasn't expired
3. Ensure API key has proper permissions
4. Check ESP service status
5. Review ESP quota limits
6. Test connection in **TOOLS** → **ESP Integrations**
7. Contact ESP support if issues persist

### Workflow Not Triggering

**Symptoms**: Workflow exists but not executing

**Checklist:**
1. ✅ Is workflow activated?
2. ✅ Is trigger condition met?
3. ✅ Are contacts in the right segment?
4. ✅ Does workflow have any errors?
5. ✅ Is frequency cap blocking sends?

**Debug Steps:**
1. Go to **AUTOMATE** → **Workflows**
2. Click on the workflow
3. Check "Executions" tab
4. Review any error messages
5. Use "Test Workflow" to simulate
6. Check audit log for details

### Contact Import Errors

**Common Errors:**
- "Missing required fields": Ensure email address is included
- "Invalid email format": Check email addresses are valid
- "Duplicate contacts": Use "overwrite existing" option
- "File too large": Split into smaller batches (< 100MB)

**Import Checklist:**
1. CSV file format
2. First row contains headers
3. Email column is included
4. Email addresses are valid
5. File is UTF-8 encoded
6. File size < 100MB
7. No special characters in headers

---

## Advanced Features

### Custom Webhook Events

Trigger workflows based on events from your application.

**Setup:**
1. Go to **TOOLS** → **Webhooks**
2. Note your webhook endpoint URL
3. Send POST requests from your app:

```javascript
fetch('https://api.aura-core.ai/email-automation/webhooks/custom', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ea_your_api_key'
  },
  body: JSON.stringify({
    event: 'custom.event',
    contactEmail: 'user@example.com',
    data: {
      productId: '12345',
      action: 'viewed'
    }
  })
});
```

4. Create workflow with trigger "API Event"
5. Configure trigger to listen for your custom event
6. Workflow executes when event is received

### Advanced Segmentation with SQL

For complex segmentation logic:

**Example: Customers who purchased in category A but not B in last 90 days**

```sql
SELECT contact_id
FROM contacts c
WHERE EXISTS (
  SELECT 1 FROM purchases p
  WHERE p.contact_id = c.id
  AND p.category = 'A'
  AND p.date >= NOW() - INTERVAL 90 DAY
)
AND NOT EXISTS (
  SELECT 1 FROM purchases p
  WHERE p.contact_id = c.id
  AND p.category = 'B'
  AND p.date >= NOW() - INTERVAL 90 DAY
)
```

### API Integration

Programmatic access to all platform features.

**Example: Create campaign via API**

```javascript
const response = await fetch('https://api.aura-core.ai/email-automation/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ea_your_api_key'
  },
  body: JSON.stringify({
    name: 'My Campaign',
    subject: 'Great offer inside',
    body: '<html>...</html>',
    fromEmail: 'hello@yourbrand.com',
    segmentId: 5
  })
});

const campaign = await response.json();
console.log('Campaign created:', campaign.id);
```

See full API documentation for all endpoints.

### Advanced AI Features

**Fine-tuning AI Models:**
Train AI models on your specific content for better results.

1. Go to **CREATE** → **AI Content Generator** → **Advanced**
2. Click "Create Fine-Tuning Job"
3. Upload training data (100+ examples)
4. Wait for training to complete (2-4 hours)
5. Use your custom model for generation

**Active Learning:**
AI selects uncertain samples for human review to improve accuracy.

1. Go to **CREATE** → **AI Content Generator** → **Training**
2. Click "Review Active Learning Samples"
3. Review 10 AI-generated samples
4. Rate quality (1-5 stars)
5. Provide feedback
6. AI improves based on feedback

### Real-Time Personalization

Dynamically generate content at send time based on real-time data.

**Example: Real-time inventory-based offers**

```html
{{#if inventory.winterCoats > 0}}
  <div class="product-offer">
    <h2>Winter Coats in Stock!</h2>
    <p>Only {{inventory.winterCoats}} left at this price.</p>
    <a href="/shop/winter-coats">Shop Now</a>
  </div>
{{else}}
  <div class="product-offer">
    <h2>Coming Soon: Winter Coat Restock</h2>
    <p>Sign up to be notified when they're back.</p>
    <a href="/notify-me">Get Notified</a>
  </div>
{{/if}}
```

The system queries inventory at send time and shows the appropriate content.

### Cohort-Based Campaigns

Target campaigns based on signup cohort for lifecycle marketing.

**Example: Send different content to each monthly cohort**

1. Create segments by signup month:
   - "Jan 2026 Signups"
   - "Feb 2026 Signups"
   - "Mar 2026 Signups"

2. Create campaigns for each cohort:
   - Month 1: Welcome + education
   - Month 2: Feature highlights
   - Month 3: Success stories
   - Month 4: Upgrade offers

3. Automate with workflows triggered on contact creation date

---

## Conclusion

You now have comprehensive knowledge of the Email Automation Builder platform! 

**Key Takeaways:**
- Start simple: Create basic campaigns and iterate
- Use AI: Let AI help with content generation and optimization
- Segment ruthlessly: Send targeted, relevant content
- Test everything: A/B test to continuously improve
- Monitor metrics: Make data-driven decisions
- Automate workflows: Scale personalized communication
- Multi-channel: Reach customers where they are
- Stay compliant: Follow CAN-SPAM and GDPR guidelines

**Next Steps:**
1. Complete initial setup (sender profile, domain auth, ESP)
2. Create your first campaign
3. Set up your welcome series workflow
4. Implement segmentation
5. Start A/B testing
6. Review analytics weekly
7. Continuously optimize

**Support Resources:**
- Email: support@aura-core.ai
- Documentation: https://docs.aura-core.ai/email-automation
- Community: https://community.aura-core.ai
- API Reference: See email-automation-api-reference.md

Happy emailing! 🚀

---

**Last Updated:** February 11, 2026  
**Version:** 2.0  
**Document:** Email Automation Builder User Guide
