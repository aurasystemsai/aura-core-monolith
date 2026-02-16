# Aura CDP Beta - Quick Start Guide

**Thank you for joining the Aura CDP Beta Program!** 🎉

This guide will get you up and running in **under 10 minutes**.

---

## 🚀 What You Get as a Beta User

### Exclusive Benefits

✨ **3 Months FREE** of Starter Plan ($99/mo value = $297 total)
- 10,000 customer profiles
- 100,000 events/month
- Unlimited segments
- Email automation
- Basic predictive analytics

🎯 **Direct Access to Founders**
- Weekly feedback calls
- Dedicated Slack channel
- Priority feature requests
- Influence product roadmap

📊 **Early Access to New Features**
- Test features before public release
- Shape product direction
- Exclusive beta-only capabilities

🏆 **Beta Perks**
- Case study participation (optional)
- Discounted upgrade path after beta
- Landing page feature (optional)
- Referral rewards

---

## ⚡ 10-Minute Setup

### Step 1: Create Your Account (2 min)

1. Visit your invitation link (sent via email)
2. Click **Sign Up for Beta**
3. Enter your details:
   - Business email
   - Company name
   - Password (min 8 characters)
4. Verify email (check inbox/spam)
5. Log in to dashboard

### Step 2: Connect Shopify (3 min)

1. In the dashboard, click **Get Started**
2. Select **Shopify** as your platform
3. Enter your store URL: `your-store.myshopify.com`
4. Click **Connect Store**
5. On Shopify's authorization page:
   - Review permissions requested
   - Click **Install App**
6. You'll be redirected back to Aura

**What's happening?**
- Aura imports last 90 days of data
- Customer profiles are being created
- Purchase history is syncing
- Events are being tracked

**Estimated time**: 5-15 minutes for initial import

### Step 3: Add Tracking Code (2 min)

For complete tracking, add Aura's SDK to your storefront:

1. In Aura dashboard, go to **Settings → Installation**
2. Copy the JavaScript snippet
3. In Shopify Admin:
   - Go to **Online Store → Themes**
   - Click **Actions → Edit Code**
   - Open `theme.liquid`
   - Paste snippet before `</head>` tag
   - Click **Save**

**Tracking snippet:**
```html
<!-- Aura CDP Tracking -->
<script>
  !function(a,u,r){a.aura=a.aura||function(){(a.aura.q=a.aura.q||[]).push(arguments)};
  var s=u.createElement('script');s.async=1;s.src=r;
  u.head.appendChild(s);}(window,document,'https://cdn.auracdp.com/sdk.js');
  
  aura('init', '{{ YOUR_PUBLIC_KEY }}');
  aura('identify', { 
    email: '{{ customer.email }}',
    firstName: '{{ customer.first_name }}',
    lastName: '{{ customer.last_name }}'
  });
  aura('page');
</script>
```

**What this enables:**
- Real-time page view tracking
- Product view events
- Add-to-cart tracking
- Search query capture
- Session duration
- Traffic source attribution

### Step 4: Create First Segment (3 min)

Let's build a "VIP Customers" segment:

1. Click **Audiences** in sidebar
2. Click **Create Segment**
3. Name: `VIP Customers`
4. Add conditions:
   ```
   Lifetime Revenue > $500
   AND
   Total Orders ≥ 3
   AND
   Last Order Date within last 90 days
   ```
5. Click **Calculate Segment**

**Result**: You'll see how many customers match (typically 5-15% of your base).

---

## 🎯 Your First Week Goals

### Day 1-2: Foundation
- ✅ Account created
- ✅ Shopify connected
- ✅ Tracking code installed
- ✅ First segment created
- [ ] Explore customer profiles (click **Customers** tab)
- [ ] Review auto-generated insights (Dashboard → Insights)
- [ ] Join beta Slack channel (link in welcome email)

### Day 3-4: First Campaign
- [ ] Create "Welcome Series" email flow
- [ ] Build "Abandoned Cart" automation
- [ ] Set up "Win-Back" campaign for inactive customers
- [ ] Test emails (send to yourself first)
- [ ] Activate flows

### Day 5-7: Optimization
- [ ] Review campaign performance
- [ ] Create 2 more segments (At-Risk, High-Intent)
- [ ] A/B test email subject lines
- [ ] Schedule first feedback call with founders
- [ ] Share initial thoughts in Slack

---

## 📊 Understanding Your Dashboard

### Main Metrics (Top Cards)

**Total Customers**
- All-time customer count
- ↑ Green = growing customer base

**Active Customers (30d)**
- Customers who ordered in last 30 days
- Target: 20-30% of total base

**Average LTV**
- Lifetime value per customer
- Benchmark: $150-$300 for DTC brands

**Repeat Rate**
- % of customers with 2+ orders
- Target: 30%+ (excellent brands hit 40%+)

**Revenue (30d)**
- Total revenue last 30 days
- Click to see breakdown by source

### Charts & Insights

**Revenue Trend** (Line chart)
- Daily/weekly/monthly revenue over time
- Use to spot trends and seasonality

**Top Products** (Table)
- Best sellers by revenue
- Shows units sold, AOV, margin

**Customer Cohorts** (Heatmap)
- Retention by signup month
- Identifies strong/weak cohorts

**Churn Risk** (List)
- Customers likely to churn in next 30 days
- Powered by Aura's predictive AI

---

## 🔥 Quick Wins: Do These First

### 1. Recover Abandoned Carts (15 min setup)

**Expected Impact**: 10-15% of abandoned sales recovered

**Setup:**
1. Go to **Automation → Flows**
2. Click **Templates → Abandoned Cart**
3. Customize 3 emails:
   - **1 hour after**: "You left something behind..."
   - **24 hours after**: "Still interested? Here's 10% off"
   - **48 hours after**: "Last chance! Your cart expires soon"
4. Enable dynamic product images (auto-populated)
5. Set discount code: `COMEBACK10`
6. Activate flow

**Pro Tip**: Include customer reviews in second email for social proof.

### 2. Win Back Inactive Customers (15 min setup)

**Expected Impact**: 5-8% of churned customers return

**Setup:**
1. Create segment: `Churned VIPs`
   ```
   Last Order Date > 90 days ago
   AND
   Lifetime Revenue > $300
   ```
2. Build email campaign:
   - Subject: "We miss you, [First Name] - 20% off to welcome you back"
   - Content: Personal message, bestsellers, generous discount
3. Send one-time campaign to segment
4. Track results in Analytics

**Pro Tip**: Send from founder's email for personal touch.

### 3. Cross-Sell to Recent Buyers (10 min setup)

**Expected Impact**: 8-12% of recipients make second purchase

**Setup:**
1. Go to **Automation → Flows**
2. Create trigger: "Order Placed"
3. Wait 7 days
4. Send email: "Complete the look"
5. Include AI product recommendations:
   ```liquid
   {% for product in customer.recommended_products limit: 4 %}
     {{ product.title }} - {{ product.price }}
   {% endfor %}
   ```
6. Activate flow

**Pro Tip**: Segment by product category purchased for better relevance.

---

## 🧪 Beta Testing: What We Need From You

### Weekly Feedback (15 min/week)

**Tuesday Feedback Calls** (optional but valuable)
- 30-minute video call with founders
- Share what's working and what's not
- Suggest features you need
- See roadmap sneak peeks

**Slack Check-ins** (daily, 2 min)
- Share wins, frustrations, questions
- Quick polls on feature priorities
- Direct line to engineering team

### Things to Test & Report

**Data Quality**
- Are customer profiles accurate?
- Any missing or incorrect data?
- Integration issues with Shopify?

**Feature Usability**
- Is anything confusing?
- Where do you get stuck?
- What takes longer than expected?

**Performance**
- Page load times acceptable?
- Segments calculating quickly?
- Email sends on time?

**Feature Requests**
- What's missing?
- What would make your life easier?
- Which integrations do you need?

### Reporting Bugs

**Use Slack for Fast Issues:**
```
🐛 BUG REPORT

What happened: Segment calculation stuck at 50%
Expected: Should complete in 30 seconds
Steps to reproduce:
1. Created segment with 10,000 customers
2. Added condition: LTV > $200
3. Clicked calculate
4. Stuck for 5+ minutes

Screenshot: [attach]
Browser: Chrome 120
Plan: Starter
Store: mystore.myshopify.com
```

**We'll respond within 2 hours** during business hours.

---

## 💡 Pro Tips from Early Beta Users

### From Sarah @ BeautyBrand ($2M/year)

> "Start simple. I tried to build 20 segments on day one and got overwhelmed. Focus on these 3 first: Active Customers, VIPs, and At-Risk. Everything else can wait."

**Her setup:**
- Active: Ordered in last 30 days
- VIP: LTV > $500 OR orders ≥ 5
- At-Risk: Last order 60-90 days ago + previously active

### From Mike @ FitnessGear ($5M/year)

> "Use the predictive churn scores! I set up an automation that triggers a 15% discount when churn score hits 70+. We've recovered $45K in revenue in just 6 weeks."

**His workflow:**
1. Daily: Check churn risk list
2. Segment: Churn score > 70 AND LTV > $300
3. Email: Personal offer from founder
4. Result: 12% reactivation rate

### From Jessica @ SustainableFashion ($800K/year)

> "The cohort retention report changed how we think about acquisition. We discovered customers from Instagram have 2x higher LTV than Facebook. Shifted all budget accordingly."

**Her process:**
- Export cohort report weekly
- Compare by acquisition source
- Double down on high-LTV channels
- Reduced CAC by 40%

---

## 📚 Essential Resources

### Documentation
- **Knowledge Base**: [docs.auracdp.com](https://docs.auracdp.com)
- **Video Tutorials**: [youtube.com/auracdp](https://youtube.com/auracdp)
- **API Reference**: [docs.auracdp.com/api](https://docs.auracdp.com/api)

### Support Channels
- **Beta Slack**: #beta-users (invite in welcome email)
- **Email**: beta@auracdp.com (response <2 hours)
- **Office Hours**: Tuesdays 2pm EST (Zoom link in Slack)
- **Emergency**: Text +1-XXX-XXX-XXXX (founders' direct line)

### Community
- **Beta Forums**: Share wins, ask questions
- **Monthly AMAs**: Ask founders anything
- **Peer Calls**: Connect with other beta users

---

## ✅ Beta Success Checklist

### Week 1: Getting Started
- [ ] Account created and verified
- [ ] Shopify store connected
- [ ] Tracking code installed
- [ ] Data import completed (90 days)
- [ ] Joined beta Slack channel
- [ ] Explored dashboard and customer profiles
- [ ] Created first segment (VIPs or High-Value)
- [ ] Scheduled first feedback call

### Week 2: First Campaigns
- [ ] Created welcome email series (3-4 emails)
- [ ] Built abandoned cart flow (3 emails)
- [ ] Set up post-purchase follow-up (2 emails)
- [ ] Tested all emails on mobile and desktop
- [ ] Activated automated flows
- [ ] Sent first one-time campaign
- [ ] Reviewed initial results

### Week 3: Optimization
- [ ] Created 5 core segments
- [ ] Set up A/B tests (subject lines, send times)
- [ ] Enabled product recommendations
- [ ] Reviewed attribution reports
- [ ] Checked churn predictions daily
- [ ] Provided feedback on Slack
- [ ] Attended office hours

### Week 4: Advanced Features
- [ ] Built cohort retention analysis
- [ ] Exported data to analyze externally
- [ ] Integrated additional tool (Klaviyo, Gorgias, etc.)
- [ ] Created custom dashboard with key metrics
- [ ] Set up Slack alerts for critical events
- [ ] Completed feedback survey
- [ ] Shared results/testimonial

---

## 🎁 Beta Exclusive Features

### Available Now

**Advanced Segmentation** (Pro plan feature)
- Unlimited segment conditions
- Nested AND/OR logic
- Custom SQL queries (coming soon)

**White-Label Email Sending** (Enterprise feature)
- Send from your domain
- Custom branding throughout
- Remove Aura branding

**Priority Support** (All plans)
- Direct Slack access to engineering
- <2 hour response times
- Weekly strategy calls

### Coming Soon (Beta First Access)

**Predictive Recommendations** (Feb 2026)
- AI-powered product suggestions
- 15-25% higher CTR vs. standard recommendations

**SMS Automation** (Mar 2026)
- Native SMS sending
- Integrated with email flows
- Compliant opt-in management

**Revenue Attribution** (Apr 2026)
- Multi-touch attribution models
- Channel ROI dashboards
- Budget optimization recommendations

---

## 📞 Need Help?

### Quick Questions
**Slack**: Post in #beta-users (founders monitor 24/7)

### Technical Issues
**Email**: beta@auracdp.com
**Response Time**: <2 hours (weekdays), <4 hours (weekends)

### Strategy & Setup Help
**Office Hours**: Tuesdays 2-4pm EST
**Book Time**: [calendly.com/aura-beta](https://calendly.com/aura-beta)

### Urgent Issues
**Founder Direct Line**: +1-XXX-XXX-XXXX (text only)
**For**: Site down, data loss, revenue impact

---

## 🚀 Let's Build the Future Together!

You're not just a beta user—you're a founding partner in building the best CDP for e-commerce.

**Your feedback shapes the product.**
**Your success drives our roadmap.**
**Your growth is our mission.**

Thank you for believing in Aura. Let's build something amazing together! 💜

---

**Questions?** Drop them in #beta-users Slack or email beta@auracdp.com

**Let's go!** 🎯
