# Aura CDP - Admin Revenue Dashboard Guide

**Internal Guide for Operating the Revenue Dashboard**

This guide covers the admin revenue dashboard at `/admin/revenue` — your mission control for monitoring all 13 revenue streams.

---

## 🎯 Dashboard Overview

### Access

**URL**: `https://app.auracdp.com/admin/revenue`

**Authentication**: Admin-only (requires `ADMIN` role)

**Browser Requirements**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Purpose

The admin dashboard provides real-time visibility into:
- Platform-wide revenue across all 13 streams
- Customer metrics (MRR, ARR, ARPU, NRR, churn)
- Revenue growth trends and projections
- Cohort retention analysis
- Stream-by-stream breakdown

---

## 📊 Dashboard Tabs

### Tab 1: Overview

**Purpose**: High-level revenue health at a glance

#### Summary Cards (Top Row)

**Monthly Recurring Revenue (MRR)**
- Definition: Total predictable monthly revenue
- Calculation: Sum of all active subscription MRR
- Good: Growing month-over-month (MoM)
- Warning: Flat or declining MoM
- Formula: `SUM(subscriptions.mrr WHERE status = 'active')`

**Annual Recurring Revenue (ARR)**
- Definition: MRR × 12
- Calculation: `MRR * 12`
- Benchmark: $100K ARR = first milestone, $1M = Series A ready
- Use: Investor reporting, company valuation

**Total Customers**
- Definition: All active paying customers
- Excludes: Cancelled, suspended, trial-only
- Calculation: `COUNT(customers WHERE subscription_status = 'active')`

**ARPU (Average Revenue Per User)**
- Definition: Revenue per customer per month
- Calculation: `MRR / Total Active Customers`
- Benchmark: $100-500 for SaaS, $50-200 for SMB
- Use: Unit economics, pricing validation

**Net Revenue Retention (NRR)**
- Definition: Revenue retention from existing customers (includes upgrades, downgrades, churn)
- Calculation: `(Starting MRR + Expansion - Churn) / Starting MRR`
- Benchmark: 
  - 100%+ = Excellent (revenue growing from existing customers)
  - 90-100% = Good
  - <90% = Action needed
- Use: Measure product stickiness and growth efficiency

**Cash Collected (30d)**
- Definition: Actual cash received (not revenue recognized)
- Includes: Stripe payments, partner payouts, marketplace commissions
- Use: Cash flow management, working capital planning

#### Revenue by Stream (Pie Chart)

**Streams Displayed:**
1. Subscription Revenue (Starter/Growth/Pro/Enterprise)
2. White-Label Revenue (partner commissions)
3. Marketplace Revenue (app developer commissions)
4. Fintech Revenue (Net-30, working capital, Aura Score)
5. Data Products (benchmarks, market intelligence)
6. Vertical Templates (Fashion, Beauty, etc.)
7. Multi-Tenant Enterprise (custom pricing)
8. Usage Overages (events, profiles exceeding quota)
9. Professional Services (implementation, consulting)

**Interpreting the Chart:**
- **Diversification**: Healthy = no single stream >40% of total
- **High-Margin Focus**: Prioritize software (80%+ margin) over services (30-50% margin)
- **Growth Indicators**: Watch for emerging streams (Marketplace, Fintech) growing share

#### MRR Growth Trend (Area Chart)

**What it shows**: MRR over time (last 30, 60, 90, or 365 days)

**Metrics displayed:**
- Total MRR (primary line)
- New MRR (from new customers)
- Expansion MRR (from upgrades)
- Contraction MRR (from downgrades)
- Churned MRR (from cancellations)

**Interpreting Trends:**
- **Healthy Growth**: New + Expansion > Contraction + Churned
- **Growth Stalling**: Flat total MRR despite new customers (high churn offsetting growth)
- **Negative Growth**: Total MRR declining (churn crisis, fix immediately)

**Formula:**
```
Net New MRR = New MRR + Expansion MRR - Contraction MRR - Churned MRR
MRR Growth Rate = Net New MRR / Starting MRR
```

**Benchmark Growth Rates:**
- 15%+ MoM = Hyper-growth (VC-backable)
- 10-15% MoM = Fast growth
- 5-10% MoM = Healthy growth
- <5% MoM = Needs optimization

---

### Tab 2: Streams

**Purpose**: Detailed breakdown of each revenue stream

#### Revenue by Stream (Bar Chart)

**Displays:**
- Each of 13 streams as bar
- Hover: Shows exact revenue, customer count, ARPU

**Use Cases:**
- Identify highest revenue streams (double down)
- Spot underperforming streams (investigate or cut)
- Track new stream launches (Marketplace, Fintech)

#### Detailed Stream Table

**Columns:**

**Stream Name**
- Clickable to drill down into stream details

**Revenue (30d)**
- Last 30 days revenue from this stream
- Sortable (default sort: highest first)

**Customers**
- Number of customers using this stream
- Note: One customer can use multiple streams

**ARPU**
- Average revenue per user for this stream
- Calculation: `Stream Revenue / Stream Customers`
- Use: Identify high-value vs. low-value streams

**% of Total**
- This stream's share of total revenue
- Use: Portfolio allocation, investor reporting

**Growth MoM**
- Month-over-month growth percentage
- Green: Positive growth
- Red: Negative growth (investigate)

**Margin**
- Gross margin for this stream (revenue - direct costs)
- Software: 80-90%
- Marketplace: 25% (our take rate)
- Fintech: 60-70% (capital costs)
- Services: 30-50% (labor costs)

#### Stream-Specific Insights

**Subscription Revenue**
- Breakdown by tier (Starter, Growth, Pro, Enterprise)
- Upgrade flow analysis
- Churn by tier

**White-Label Revenue**
- Partner count and revenue share breakdown
- Top partners by revenue
- Partner churn rate

**Marketplace Revenue**
- Active apps and install count
- Top apps by revenue
- Developer payouts pending

**Fintech Revenue**
- Net-30 originations and repayment rate
- Working capital loans outstanding
- Aura Score distribution

**Data Products**
- Benchmark subscriptions active
- Market intelligence usage
- Export volume trends

---

### Tab 3: Customers

**Purpose**: Customer-level metrics and cohort analysis

#### Customer Metrics (Top Cards)

**LTV (Lifetime Value)**
- Definition: Total revenue expected from average customer
- Calculation: `ARPU × Average Customer Lifetime (months)`
- Example: $200 ARPU × 24 months = $4,800 LTV
- Use: Determine max CAC, prioritize customer segments

**CAC (Customer Acquisition Cost)**
- Definition: Total marketing/sales spend per new customer
- Calculation: `Total Marketing Spend / New Customers`
- Benchmark: LTV:CAC ratio should be 3:1 or higher
- Use: Validate marketing efficiency

**LTV:CAC Ratio**
- Definition: How much value each customer brings vs. cost to acquire
- Calculation: `LTV / CAC`
- Benchmark:
  - <1: Losing money (unsustainable)
  - 1-3: Break-even to marginal (optimize)
  - 3+: Healthy (scale)
  - 5+: Exceptional (pour gas on fire)

**Payback Period**
- Definition: Months to recover CAC from customer revenue
- Calculation: `CAC / ARPU`
- Example: $300 CAC ÷ $150 ARPU = 2 months payback
- Benchmark:
  - <6 months: Excellent
  - 6-12 months: Good
  - 12-18 months: Acceptable (needs strong retention)
  - >18 months: Risky (improve ARPU or reduce CAC)

**Active DAU/MAU**
- DAU: Daily active users (logged in last 24h)
- MAU: Monthly active users (logged in last 30d)
- DAU/MAU Ratio: Product engagement metric
- Benchmark:
  - 40%+ = Highly engaged product
  - 20-40% = Weekly usage pattern
  - <20% = Low engagement (risk of churn)

#### Customer Segments by Size (Pie Chart)

**Segments:**
- **Whales** (>$1,000/mo): High-touch, white-glove support
- **Dolphins** ($500-1,000/mo): Mid-market, standard support
- **Minnows** ($100-500/mo): SMB, self-service
- **Free/Trial**: Not yet paying

**Use:**
- Resource allocation (where to focus CS team)
- Identify expansion opportunities (Minnows → Dolphins → Whales)
- Churn risk priorities (losing a Whale = major impact)

#### Cohort Retention Heatmap

**What it shows**: Customer retention by signup cohort

**Rows**: Cohort (month customers signed up)
**Columns**: Months since signup (0, 1, 2, 3, 6, 12)
**Cell Value**: % of cohort still active

**Color Coding:**
- Dark Green (80%+): Excellent retention
- Green (60-80%): Good retention
- Yellow (40-60%): Fair retention
- Orange (20-40%): Poor retention
- Red (<20%): Critical (investigate)

**Example Reading:**
```
Jan 2026 Cohort:
- М0: 100% (all new customers active)
- М1: 92% (8% churned in first month)
- М2: 85% (7% more churned)
- М3: 78% (7% more churned)
- М12: 45% (55% churned by year end)
```

**Use Cases:**
1. **Identify Weak Cohorts**: Why did Apr 2025 cohort churn faster?
2. **Product Changes**: Did M6 retention improve after new feature launch?
3. **Pricing Impact**: Compare retention before/after price change
4. **Seasonality**: Q4 cohorts (holiday) vs. Q1 cohorts

**Good Benchmarks:**
- M1: 85%+ retention
- M6: 70%+ retention
- M12: 60%+ retention

---

### Tab 4: Projections

**Purpose**: Revenue forecasting for next 12 months

#### 12-Month MRR Projection (Line Chart)

**What it shows:**
- Historical MRR (last 6 months) as solid line
- Projected MRR (next 12 months) as dashed line
- Confidence interval (shaded area)

**Forecasting Method:**
Uses time-series analysis considering:
1. Historical growth rate (weighted recent months higher)
2. Seasonal patterns (Q4 typically higher)
3. Churn trends
4. Pipeline commitments (signed contracts not yet live)
5. Planned price changes

**Interpreting Projections:**

**Conservative Scenario:**
- Assumes current churn rate continues
- No new customer acquisition improvements
- Market conditions stable
- Use for: Cash flow planning, hiring decisions

**Base Scenario (Displayed):**
- Assumes slight growth acceleration
- Current customer acquisition efficiency
- Historical seasonality
- Use for: Board reporting, target setting

**Optimistic Scenario:**
- Assumes product improvements reduce churn
- New features drive expansion revenue
- Marketing improvements increase sign-ups
- Use for: Stretch goals, fundraising pitch

#### Year-End Projections (Cards)

**Projected ARR (Dec 31)**
- Expected ARR by end of year
- Comparison vs. current ARR
- % growth to achieve target

**New Customers Needed**
- How many new customers to hit ARR target
- Based on average ARPU and churn rate
- Informs marketing budget allocation

**Required Net New MRR/Month**
- Monthly MRR needed to reach target
- Accounts for expected churn
- Use: Sales quotas, marketing goals

**Probability of Hitting Target**
- Statistical probability (based on historical variance)
- 80%+: Very likely
- 60-80%: Probable
- 40-60%: Possible (need acceleration)
- <40%: Unlikely (revise targets)

#### Key Assumptions (List)

**Growth Rate Assumptions:**
- New MRR: +$XX,XXX/month
- Expansion MRR: +$X,XXX/month (existing customers upgrading)
- Churn Rate: X.X%/month

**Customer Assumptions:**
- CAC: $XXX
- Payback period: X months
- Average LTV: $X,XXX

**Market Assumptions:**
- Total addressable market: XX,XXX Shopify stores
- Current penetration: X.X%
- Market growth rate: XX%/year

**Product Assumptions:**
- New features launching: List
- Expected retention impact: +X%
- Pricing changes: None planned / Increase X% on MMM DD

---

## 🔍 Common Dashboard Workflows

### Daily Check (5 min)

**Morning Routine:**
1. Open Overview tab
2. Check MRR (should be growing or flat, never declining)
3. Scan for any unusual drops in customer count
4. Check cash collected matches expectations
5. Review any Slack alerts from overnight

**Red Flags:**
- MRR dropped >1% overnight (investigate immediately)
- Customer count dropped >5 customers (check for bulk churn)
- Cash collected <80% of expected (payment processor issues?)

### Weekly Review (30 min)

**Monday Morning Ritual:**
1. **Overview Tab**:
   - Screenshot summary cards for team update
   - Calculate week-over-week growth
   - Note any trend changes

2. **Streams Tab**:
   - Identify fastest-growing stream (celebrate!)
   - Check for declining streams (investigate root cause)
   - Review margin by stream (optimize resource allocation)

3. **Customers Tab**:
   - Export cohort data to spreadsheet
   - Identify at-risk customers (low engagement)
   - Review LTV:CAC ratio (should trend upward)

4. **Projections Tab**:
   - Check if on track for quarterly goals
   - Update team on pace to target
   - Flag if acceleration needed

**Deliverable**: Share dashboard screenshot + commentary in #revenue-updates Slack channel

### Monthly Deep Dive (2 hours)

**First Tuesday of Month:**

1. **Export All Data** (for board deck):
   - Click "Export CSV" on each tab
   - Import into Google Sheets or Excel
   - Create custom charts for board presentation

2. **Cohort Analysis**:
   - Build pivot table: Cohort × Months Retained
   - Compare this month's M1 retention to last 6 months
   - Identify any changes (positive or negative)
   - Hypothesis: What caused the change?

3. **Stream Performance Review**:
   - Calculate MoM growth for each stream
   - Rank streams by: Revenue, Growth Rate, Margin
   - Decide: Which to grow (invest), maintain (harvest), or shut down

4. **Customer Economics**:
   - Update CAC calculation (total marketing spend / new customers)
   - Recalculate LTV (may change based on recent retention data)
   - Update payback period assumption
   - Verify LTV:CAC ratio >3:1

5. **Forecast Review**:
   - Compare actual vs. projected (last month)
   - Calculate forecast accuracy
   - Adjust model if consistently off (>10% error)
   - Update assumptions for next quarter

6. **Action Items**:
   - Create list of initiatives to improve metrics
   - Assign owners and deadlines
   - Track in project management tool

**Deliverable**: Monthly revenue review deck (10-15 slides)

---

## 🚨 Alerts & Thresholds

### Critical Alerts (Immediate Action)

**MRR Drop >5% in Single Day**
- Possible Causes: Bulk customer churn, payment processor outage, subscription export error
- Action: Check Stripe dashboard, query database for cancelled subscriptions, contact affected customers

**Churn Rate >10% in Single Month**
- Possible Causes: Product issue, competitor launch, price shock, poor customer experience
- Action: Segment churned customers, send surveys, conduct exit interviews, review recent product changes

**Payment Failure Rate >15%**
- Possible Causes: Card expiration wave, processor issues, fraud flags
- Action: Trigger dunning emails, retry failed payments, update payment methods

**Database Query Slow >5s**
- Possible Causes: Missing index, data growth, query inefficiency
- Action: Check slow query log, add indexes, optimize queries, scale database if needed

### Warning Alerts (Review Within 24h)

**MRR Growth <3% MoM**
- Action: Review acquisition funnel, check competitor activity, analyze churn reasons

**NRR <95%**
- Action: Improve retention (product improvements), increase expansion revenue (upsells)

**LTV:CAC Ratio <3:1**
- Action: Reduce CAC (optimize marketing) or increase LTV (improve retention/ARPU)

**Any Revenue Stream Declines 2 Months in Row**
- Action: Investigate root cause, decide to fix or shut down

### Informational Alerts (Review Weekly)

**New High-Value Customer Signed** (>$500/mo)
- Action: Assign dedicated CSM, send welcome gift, schedule onboarding call

**Customer Approaching Usage Limits**
- Action: Trigger proactive upgrade conversation (expansion revenue opportunity)

**Cohort Retention Improves >5% MoM**
- Action: Identify what changed (product feature, onboarding improvement), document, scale

---

## 📈 Advanced Analytics

### Custom Queries (SQL)

Access PostgreSQL database directly for custom analysis:

**Connect:**
```bash
psql $DATABASE_URL
```

**Useful Queries:**

**Top 20 Customers by Revenue:**
```sql
SELECT 
  c.company_name,
  c.email,
  s.tier,
  s.mrr,
  c.created_at::DATE as signup_date
FROM customers c
JOIN subscriptions s ON c.id = s.customer_id
WHERE s.status = 'active'
ORDER BY s.mrr DESC
LIMIT 20;
```

**MRR by Tier:**
```sql
SELECT 
  tier,
  COUNT(*) as customer_count,
  SUM(mrr) as total_mrr,
  AVG(mrr) as avg_mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY tier
ORDER BY total_mrr DESC;
```

**Churn Analysis by Cohort:**
```sql
SELECT 
  DATE_TRUNC('month', created_at) as cohort,
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE cancellation_date IS NULL) as still_active,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cancellation_date IS NULL) / COUNT(*), 2) as retention_rate
FROM customers
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY cohort DESC;
```

**Revenue by Acquisition Channel:**
```sql
SELECT 
  c.acquisition_channel,
  COUNT(*) as customers,
  SUM(s.mrr) as total_mrr,
  AVG(s.mrr) as avg_mrr,
  SUM(COALESCE(i.total_paid, 0)) as lifetime_revenue
FROM customers c
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'paid'
GROUP BY c.acquisition_channel
ORDER BY lifetime_revenue DESC;
```

### Export to BI Tools

**Connect Looker/Tableau/Metabase:**
1. Use read-only database replica (REPLICA_DATABASE_URL)
2. Create cust views for common queries
3. Set up scheduled refreshes

**Pre-built Views:**
- `active_subscriptions` (current subscriptions with customer details)
- `monthly_revenue_summary` (aggregated revenue by month/stream)
- `cohort_retention` (retention rates by signup cohort)
- `customer_ltv` (calculated LTV by customer)

---

## 🛠️ Troubleshooting

### Dashboard Not Loading

**Symptoms**: Blank page, infinite spinner, error message

**Debugging Steps:**
1. Check browser console for JavaScript errors (F12)
2. Verify API endpoint responding: `curl https://api.auracdp.com/api/admin/revenue/dashboard`
3. Check backend logs: `docker logs backend --tail 100`
4. Verify database connection: `docker exec postgres pg_isready`
5. Check Redis: `docker exec redis redis-cli ping`

**Common Fixes:**
- Clear browser cache and cookies
- Restart backend: `docker restart backend`
- Check environment variables: `docker exec backend env | grep DATABASE_URL`

### Incorrect Data Displayed

**Symptoms**: Numbers don't match Stripe/database queries

**Debugging Steps:**
1. **Check Data Freshness**:
   - Dashboard caches for 5 minutes
   - Force refresh: Add `?cache=false` to URL
   
2. **Verify Database Sync**:
   ```sql
   SELECT MAX(updated_at) FROM subscriptions;
   SELECT MAX(created_at) FROM revenue_events;
   ```
   Should be within last few minutes

3. **Check Stripe Webhook Delivery**:
   - Go to Stripe Dashboard → Webhooks
   - Check failed deliveries
   - Manually retry if needed

4. **Recalculate MRR**:
   ```sql
   SELECT calculate_mrr(CURRENT_DATE);
   ```

**Common Causes:**
- Stripe webhook not firing (check endpoint URL)
- Database connection pool exhausted (increase pool size)
- Background jobs not running (restart worker)

### Slow Performance

**Symptoms**: Dashboard takes >10s to load

**Debugging Steps:**
1. **Check Database Load**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```
   
2. **Review Slow Queries**:
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. **Check Redis Connection**:
   ```bash
   redis-cli INFO stats
   ```

**Optimizations:**
- Add missing database indexes
- Increase Redis memory allocation
- Enable query result caching
- Scale database (upgrade instance size)

---

## 📋 Admin Dashboard Checklist

### First-Time Setup
- [ ] Verify dashboard accessible at /admin/revenue
- [ ] Confirm all 4 tabs load (Overview, Streams, Customers, Projections)
- [ ] Check data accuracy vs. Stripe dashboard
- [ ] Set up Slack alerts for critical metrics
- [ ] Create bookmarks for daily/weekly workflows
- [ ] Share dashboard URL with leadership team
- [ ] Schedule weekly revenue review meeting

### Daily Operations
- [ ] Check MRR (should be stable or growing)
- [ ] Review customer count (watch for unusual drops)
- [ ] Verify cash collected matches expectations
- [ ] Scan for any critical alerts
- [ ] Respond to any payment failures
- [ ] Update team in #revenue-updates Slack

### Weekly Reviews
- [ ] Export dashboard data to spreadsheet
- [ ] Calculate week-over-week growth
- [ ] Identify top/bottom performing streams
- [ ] Review cohort retention trends
- [ ] Update forecast accuracy
- [ ] Share insights with team

### Monthly Deep Dives
- [ ] Create board deck with key metrics
- [ ] Analyze cohort retention patterns
- [ ] Review stream performance and margins
- [ ] Update customer economics (LTV, CAC, payback)
- [ ] Revise forecast and assumptions
- [ ] Set action items for next month

---

## 🔐 Security & Access Control

### Role-Based Access

**Admin**: Full access (you)
- View all revenue data
- Export CSV
- Run custom SQL queries
- Modify settings

**Finance**: Read-only access
- View all tabs
- Export data
- No modifications

**Engineering**: Database access only
- Query via SQL
- No dashboard UI access
- For debugging/reporting

**Customer Success**: Limited access
- View customer-level data only
- No aggregate revenue data
- For account management

### Audit Logging

All dashboard access logged:
```sql
SELECT * FROM audit_log
WHERE action = 'dashboard_view'
ORDER BY created_at DESC
LIMIT 100;
```

**Logged Events:**
- Dashboard page views
- Data exports
- Custom queries run
- Filter changes
- Date range selections

---

**Questions?** Contact the engineering team or email engineering@auracdp.com

**Dashboard Issues?** File ticket at: [github.com/aura/platform/issues](https://github.com/aura/platform/issues)
