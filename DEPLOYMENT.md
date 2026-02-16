# 🚀 AURA Platform - Deployment Guide

**Target Launch:** February 22, 2026 (7 days)  
**Environment:** Production-ready infrastructure

---

## 📋 Pre-Deployment Checklist

### Day 1-2: Infrastructure Setup

#### 1. Choose Cloud Provider
**Recommended: AWS** (best pricing for our scale)

**Alternatives:**
- Google Cloud Platform (better AI/ML tools)
- Microsoft Azure (enterprise customers)
- DigitalOcean (simpler, cheaper for MVP)

#### 2. Provision Resources

**Required Services:**
```
✓ Compute: 3× App servers (4 vCPU, 16GB RAM)
✓ Database: PostgreSQL 14+ (db.t3.large, 100GB SSD)
✓ Cache: Redis 6+ (cache.t3.medium, 6GB)
✓ Storage: S3-compatible (1TB)
✓ CDN: CloudFlare or AWS CloudFront
✓ Load Balancer: Application Load Balancer
✓ Queue: Redis or AWS SQS
```

**Estimated Monthly Cost:**
- AWS: $800-1,200/month
- GCP: $750-1,100/month
- DigitalOcean: $500-800/month

---

## 🔧 Step-by-Step Deployment

### Option 1: One-Click Deploy (Fastest)

#### Heroku (5 minutes)
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create aura-platform-prod

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate

# Open app
heroku open
```

**Cost:** ~$250/month (good for beta)

---

### Option 2: AWS Deploy (Production-Ready)

#### Step 1: Setup AWS Account
```bash
# Install AWS CLI
brew install awscli  # Mac
# or
choco install awscli  # Windows

# Configure
aws configure
# Enter: Access Key ID, Secret Key, Region (us-east-1)
```

#### Step 2: Database Setup
```bash
# Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier aura-prod-db \
  --db-instance-class db.t3.large \
  --engine postgres \
  --engine-version 14.7 \
  --master-username aura_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-XXXXX \
  --backup-retention-period 7 \
  --multi-az

# Create Redis ElastiCache
aws elasticache create-cache-cluster \
  --cache-cluster-id aura-prod-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --num-cache-nodes 1
```

#### Step 3: Application Deployment
```bash
# Create Elastic Beanstalk application
eb init aura-platform --platform node.js-18 --region us-east-1

# Create environment
eb create aura-prod-env \
  --instance-type t3.large \
  --scale 3 \
  --envvars \
    NODE_ENV=production,\
    DATABASE_URL=$RDS_CONNECTION_STRING,\
    REDIS_URL=$ELASTICACHE_ENDPOINT

# Deploy
eb deploy

# Configure auto-scaling
eb config set environment.autoscaling.min=3 max=10
```

#### Step 4: CDN Setup (CloudFront)
```bash
# Create S3 bucket for assets
aws s3 mb s3://aura-platform-assets

# Upload static assets
aws s3 sync ./aura-console/dist s3://aura-platform-assets --acl public-read

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name aura-platform-assets.s3.amazonaws.com \
  --default-root-object index.html
```

---

### Option 3: Docker Deploy (Any Cloud)

#### Dockerfile (Already Created)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/aura
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: always
    deploy:
      replicas: 3

  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=aura
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_secure_password
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: always

volumes:
  postgres_data:
  redis_data:
```

#### Deploy to Any Cloud
```bash
# Build and push to registry
docker build -t aura-platform:latest .
docker tag aura-platform:latest registry.example.com/aura-platform:latest
docker push registry.example.com/aura-platform:latest

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml
```

---

## 🔐 Environment Variables

Create `.env.production` file:

```bash
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://app.aura-platform.com
API_URL=https://api.aura-platform.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/aura_production
DB_POOL_SIZE=20
DB_SSL=true

# Redis
REDIS_URL=redis://:password@host:6379
REDIS_TLS=true

# Session
SESSION_SECRET=your-super-secret-session-key-min-32-chars
COOKIE_DOMAIN=.aura-platform.com

# Stripe
STRIPE_SECRET_KEY=sk_live_XXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# Email (SendGrid)
SENDGRID_API_KEY=SG.XXXXX
FROM_EMAIL=noreply@aura-platform.com
SUPPORT_EMAIL=support@aura-platform.com

# AI Models
OPENAI_API_KEY=sk-XXXXX
ANTHROPIC_API_KEY=sk-ant-XXXXX
GOOGLE_AI_KEY=XXXXX

# Storage (S3)
AWS_ACCESS_KEY_ID=XXXXX
AWS_SECRET_ACCESS_KEY=XXXXX
AWS_REGION=us-east-1
S3_BUCKET=aura-platform-assets

# Monitoring
SENTRY_DSN=https://XXXXX@sentry.io/XXXXX
DATADOG_API_KEY=XXXXX
NEW_RELIC_LICENSE_KEY=XXXXX

# Feature Flags
ENABLE_BETA_FEATURES=false
MAINTENANCE_MODE=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGINS=https://app.aura-platform.com,https://www.aura-platform.com
HELMET_ENABLED=true
CSRF_ENABLED=true
```

---

## 🗄️ Database Migration

```bash
# Run all migrations
npm run db:migrate

# Or manually with psql
psql $DATABASE_URL < migrations/001_revenue_infrastructure.sql

# Verify tables created
psql $DATABASE_URL -c "\dt"

# Seed initial data (plans, meters, revenue streams)
npm run db:seed
```

---

## 🔍 Health Checks

### Create health check endpoint
**File:** `src/routes/health.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../core/db');
const redis = require('../core/redis');

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check database
  try {
    await db.query('SELECT 1');
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  // Check external APIs
  health.services.stripe = await checkStripe();
  health.services.openai = await checkOpenAI();

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', async (req, res) => {
  // Readiness check (can accept traffic?)
  try {
    await db.query('SELECT 1');
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

router.get('/live', (req, res) => {
  // Liveness check (is process alive?)
  res.status(200).json({ alive: true });
});

module.exports = router;
```

---

## 📊 Monitoring Setup

### Sentry (Error Tracking)
```javascript
// src/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### DataDog (APM)
```javascript
// At the very top of src/server.js
require('dd-trace').init({
  service: 'aura-platform',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  profiling: true,
  runtimeMetrics: true
});
```

### Prometheus Metrics
```javascript
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

---

## 🔒 SSL/TLS Setup

### Automatic (Let's Encrypt)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d aura-platform.com -d www.aura-platform.com

# Auto-renewal (cron)
sudo certbot renew --dry-run
```

### Manual (CloudFlare)
1. Add domain to CloudFlare
2. Enable "Full (Strict)" SSL
3. Create Origin Certificate
4. Install on server

---

## 🚀 Launch Sequence

### Day -7 to -1: Pre-Launch
```bash
# Day -7: Infrastructure
✓ Provision servers
✓ Configure databases
✓ Setup CDN

# Day -6: Deploy code
✓ Build production bundle
✓ Run database migrations
✓ Upload assets to CDN

# Day -5: Configure services
✓ Setup Stripe webhooks
✓ Configure email service
✓ Enable monitoring

# Day -4: Security
✓ Run security audit
✓ Enable rate limiting
✓ Configure firewall

# Day -3: Testing
✓ Load testing (artillery/k6)
✓ End-to-end testing
✓ SSL verification

# Day -2: Beta
✓ Invite 10 beta users
✓ Monitor for issues
✓ Fix critical bugs

# Day -1: Final checks
✓ Backup database
✓ Test rollback procedure
✓ Prepare launch materials
```

### Day 0: LAUNCH 🎉
```bash
# 00:00 - Product Hunt launch
✓ Submit to Product Hunt

# 06:00 - Email campaign
✓ Send to mailing list

# 09:00 - Social media
✓ Twitter, LinkedIn, Facebook

# 12:00 - Monitor
✓ Watch metrics dashboard
✓ Respond to support tickets

# 18:00 - Day 1 recap
✓ Analyze signups
✓ Fix urgent issues
```

---

## 📈 Scaling Plan

### Phase 1: 0-100 users
- Single app server
- Small database (db.t3.medium)
- Small Redis (cache.t3.micro)
- **Cost:** $300/month

### Phase 2: 100-1,000 users
- 3 app servers (load balanced)
- Medium database (db.t3.large)
- Medium Redis (cache.t3.medium)
- **Cost:** $800/month

### Phase 3: 1,000-10,000 users
- 5-10 app servers (auto-scaling)
- Large database (db.r5.xlarge)
- Redis cluster (3 nodes)
- CDN with edge caching
- **Cost:** $2,500/month

### Phase 4: 10,000+ users
- 10-50 app servers
- RDS Aurora (multi-AZ)
- ElastiCache cluster
- Multi-region deployment
- **Cost:** $10,000+/month

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Kill stuck queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';
```

### Redis Issues
```bash
# Test connection
redis-cli -u $REDIS_URL ping

# Check memory
redis-cli -u $REDIS_URL INFO memory

# Clear cache
redis-cli -u $REDIS_URL FLUSHALL
```

### High CPU/Memory
```bash
# Check processes
pm2 list
pm2 monit

# Restart apps
pm2 restart all

# Check logs
pm2 logs
```

---

## 📞 Support Contacts

**Infrastructure Issues:**
- AWS Support: https://console.aws.amazon.com/support
- CloudFlare: https://dash.cloudflare.com

**External Services:**
- Stripe: https://support.stripe.com
- SendGrid: https://support.sendgrid.com
- OpenAI: https://help.openai.com

**Emergency:**
- On-call engineer: +1-XXX-XXX-XXXX
- Slack: #platform-alerts

---

## ✅ Post-Launch Checklist

### Week 1
- [ ] Monitor error rates (target: <0.1%)
- [ ] Check API latency (target: <200ms p95)
- [ ] Review signup funnel conversion
- [ ] Collect user feedback
- [ ] Fix critical bugs

### Week 2-4
- [ ] Optimize slow endpoints
- [ ] Scale infrastructure as needed
- [ ] Implement top feature requests
- [ ] Conduct security audit
- [ ] Plan next sprint

---

**Ready to deploy?** Run: `npm run deploy:production`

**Questions?** Read: [docs/deployment.md](docs/deployment.md)

**SHIP IT! 🚀**
