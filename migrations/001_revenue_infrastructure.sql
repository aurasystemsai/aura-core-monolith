-- Revenue Infrastructure Database Schema
-- Migration: 001_revenue_infrastructure
-- Created: 2026-02-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CUSTOMERS & SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE customers (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255),
  stripe_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'past_due', 'suspended', 'canceled')),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  monthly_price DECIMAL(10, 2) NOT NULL,
  next_billing_date TIMESTAMP,
  last_payment_date TIMESTAMP,
  payment_failures INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP,
  cancellation_reason TEXT,
  UNIQUE(customer_id)
);

CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);

-- =============================================================================
-- USAGE TRACKING
-- =============================================================================

CREATE TABLE usage_events (
  id BIGSERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_customer ON usage_events(customer_id);
CREATE INDEX idx_usage_timestamp ON usage_events(timestamp DESC);
CREATE INDEX idx_usage_event_type ON usage_events(event_type);
CREATE INDEX idx_usage_customer_timestamp ON usage_events(customer_id, timestamp DESC);

CREATE TABLE usage_summaries (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  total_quantity BIGINT NOT NULL,
  billed_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, period_start, period_end, event_type)
);

-- =============================================================================
-- INVOICES & PAYMENTS
-- =============================================================================

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  line_items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'voided')),
  stripe_invoice_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_period ON invoices(period_start, period_end);

-- =============================================================================
-- WHITE-LABEL PARTNERS
-- =============================================================================

CREATE TABLE partners (
  id VARCHAR(255) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  share_percent DECIMAL(5, 2) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),
  custom_domain VARCHAR(255),
  custom_css TEXT,
  custom_logo_url VARCHAR(500),
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE partner_clients (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(255) REFERENCES partners(id) ON DELETE CASCADE,
  client_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, client_id)
);

CREATE INDEX idx_partner_clients_partner ON partner_clients(partner_id);
CREATE INDEX idx_partner_clients_client ON partner_clients(client_id);

-- =============================================================================
-- MARKETPLACE
-- =============================================================================

CREATE TABLE marketplace_developers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  company VARCHAR(255),
  website VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  stripe_connect_account_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE marketplace_apps (
  id VARCHAR(255) PRIMARY KEY,
  developer_id VARCHAR(255) REFERENCES marketplace_developers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  category VARCHAR(100),
  pricing_model VARCHAR(50) CHECK (pricing_model IN ('free', 'paid', 'freemium')),
  monthly_price DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'suspended')),
  icon_url VARCHAR(500),
  screenshots JSONB,
  required_scopes TEXT[],
  webhook_url VARCHAR(500),
  oauth_redirect_url VARCHAR(500),
  installs INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_apps_developer ON marketplace_apps(developer_id);
CREATE INDEX idx_apps_status ON marketplace_apps(status);
CREATE INDEX idx_apps_category ON marketplace_apps(category);

CREATE TABLE app_installations (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  app_id VARCHAR(255) REFERENCES marketplace_apps(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'uninstalled')),
  installed_at TIMESTAMP DEFAULT NOW(),
  uninstalled_at TIMESTAMP,
  settings JSONB DEFAULT '{}'::jsonb,
  UNIQUE(customer_id, app_id)
);

CREATE INDEX idx_installations_customer ON app_installations(customer_id);
CREATE INDEX idx_installations_app ON app_installations(app_id);
CREATE INDEX idx_installations_status ON app_installations(status);

-- =============================================================================
-- OAUTH & WEBHOOKS
-- =============================================================================

CREATE TABLE oauth_authorizations (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  app_id VARCHAR(255) REFERENCES marketplace_apps(id) ON DELETE CASCADE,
  auth_code VARCHAR(255) UNIQUE,
  access_token VARCHAR(255) UNIQUE,
  refresh_token VARCHAR(255) UNIQUE,
  scopes TEXT[],
  auth_code_expires_at TIMESTAMP,
  access_token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_oauth_access_token ON oauth_authorizations(access_token) WHERE revoked_at IS NULL;
CREATE INDEX idx_oauth_refresh_token ON oauth_authorizations(refresh_token) WHERE revoked_at IS NULL;
CREATE INDEX idx_oauth_customer_app ON oauth_authorizations(customer_id, app_id);

CREATE TABLE webhook_subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  app_id VARCHAR(255) REFERENCES marketplace_apps(id) ON DELETE CASCADE,
  event_types TEXT[] NOT NULL,
  url VARCHAR(500) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  subscription_id VARCHAR(255) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  next_retry_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);

CREATE INDEX idx_deliveries_subscription ON webhook_deliveries(subscription_id);
CREATE INDEX idx_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending';

-- =============================================================================
-- FINTECH PRODUCTS
-- =============================================================================

CREATE TABLE fintech_applications (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('net_terms', 'working_capital', 'rbf')),
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'funded', 'repaid', 'defaulted')),
  aura_score INTEGER,
  interest_rate DECIMAL(5, 2),
  term_months INTEGER,
  monthly_payment DECIMAL(12, 2),
  outstanding_balance DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  funded_at TIMESTAMP,
  due_date TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_fintech_customer ON fintech_applications(customer_id);
CREATE INDEX idx_fintech_status ON fintech_applications(status);
CREATE INDEX idx_fintech_type ON fintech_applications(product_type);

CREATE TABLE fintech_payments (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(255) REFERENCES fintech_applications(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================================================
-- DATA PRODUCTS
-- =============================================================================

CREATE TABLE data_product_subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL,
  vertical VARCHAR(100),
  monthly_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled')),
  created_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP,
  UNIQUE(customer_id, product_id, vertical)
);

CREATE INDEX idx_data_products_customer ON data_product_subscriptions(customer_id);
CREATE INDEX idx_data_products_product ON data_product_subscriptions(product_id);

-- =============================================================================
-- VERTICAL TEMPLATES
-- =============================================================================

CREATE TABLE vertical_deployments (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  vertical_id VARCHAR(50) NOT NULL,
  customization JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  deployed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, vertical_id)
);

CREATE INDEX idx_verticals_customer ON vertical_deployments(customer_id);
CREATE INDEX idx_verticals_vertical ON vertical_deployments(vertical_id);

-- =============================================================================
-- MULTI-TENANT ENTERPRISE
-- =============================================================================

CREATE TABLE enterprise_tenants (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  database_name VARCHAR(255),
  storage_quota_gb INTEGER NOT NULL,
  api_calls_quota INTEGER NOT NULL,
  compute_hours_quota INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
  sso_enabled BOOLEAN DEFAULT FALSE,
  sso_provider VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenant_usage (
  id BIGSERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) REFERENCES enterprise_tenants(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('storage', 'api_call', 'compute_hour')),
  amount DECIMAL(12, 2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_timestamp ON tenant_usage(timestamp DESC);
CREATE INDEX idx_tenant_usage_type ON tenant_usage(resource_type);

-- =============================================================================
-- REVENUE SHARE & PAYOUTS
-- =============================================================================

CREATE TABLE revenue_events (
  id BIGSERIAL PRIMARY KEY,
  partner_id VARCHAR(255) NOT NULL, -- References partners(id) or marketplace_developers(id)
  partner_type VARCHAR(50) NOT NULL CHECK (partner_type IN ('white_label', 'marketplace', 'affiliate', 'reseller', 'revenue_share')),
  event_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission_percent DECIMAL(5, 2),
  commission_amount DECIMAL(10, 2),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  payout_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_events_partner ON revenue_events(partner_id);
CREATE INDEX idx_revenue_events_payout ON revenue_events(payout_id);
CREATE INDEX idx_revenue_events_timestamp ON revenue_events(created_at DESC);

CREATE TABLE payouts (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_earnings DECIMAL(10, 2) NOT NULL,
  payment_terms VARCHAR(50) DEFAULT 'NET30',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at TIMESTAMP,
  payment_method VARCHAR(100),
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payouts_partner ON payouts(partner_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_period ON payouts(period_start, period_end);

CREATE TABLE tax_forms_1099 (
  id SERIAL PRIMARY KEY,
  partner_id VARCHAR(255) NOT NULL,
  tax_year INTEGER NOT NULL,
  total_nonemployee_compensation DECIMAL(10, 2) NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, tax_year)
);

-- =============================================================================
-- ANALYTICS & REPORTING
-- =============================================================================

CREATE TABLE revenue_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL UNIQUE,
  mrr DECIMAL(12, 2) NOT NULL,
  arr DECIMAL(12, 2) NOT NULL,
  total_customers INTEGER NOT NULL,
  paying_customers INTEGER NOT NULL,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  expansion_mrr DECIMAL(10, 2) DEFAULT 0,
  churned_mrr DECIMAL(10, 2) DEFAULT 0,
  revenue_by_stream JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_snapshots_date ON revenue_snapshots(snapshot_date DESC);

-- =============================================================================
-- VIEWS FOR ANALYTICS
-- =============================================================================

CREATE VIEW active_subscriptions AS
SELECT 
  s.*,
  c.email,
  c.company_name,
  c.stripe_customer_id
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
WHERE s.status = 'active';

CREATE VIEW monthly_revenue_summary AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  SUM(total) AS revenue,
  COUNT(*) AS invoice_count,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM invoices
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

CREATE VIEW partner_revenue_summary AS
SELECT 
  p.id,
  p.company_name,
  p.tier,
  COUNT(DISTINCT pc.client_id) AS client_count,
  COALESCE(SUM(re.commission_amount), 0) AS total_commissions,
  p.monthly_price * COUNT(DISTINCT pc.client_id) AS estimated_mrr
FROM partners p
LEFT JOIN partner_clients pc ON p.id = pc.partner_id
LEFT JOIN revenue_events re ON p.id = re.partner_id AND re.payout_id IS NULL
WHERE p.status = 'active'
GROUP BY p.id, p.company_name, p.tier, p.monthly_price;

CREATE VIEW marketplace_revenue_summary AS
SELECT 
  a.id,
  a.name,
  d.name AS developer_name,
  COUNT(DISTINCT i.customer_id) AS install_count,
  a.monthly_price * COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.customer_id END) AS monthly_revenue,
  (a.monthly_price * COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.customer_id END)) * 0.75 AS developer_share,
  (a.monthly_price * COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.customer_id END)) * 0.25 AS platform_share
FROM marketplace_apps a
JOIN marketplace_developers d ON a.developer_id = d.id
LEFT JOIN app_installations i ON a.id = i.app_id
WHERE a.status = 'published' AND a.pricing_model = 'paid'
GROUP BY a.id, a.name, d.name, a.monthly_price;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Calculate MRR for a specific date
CREATE OR REPLACE FUNCTION calculate_mrr(target_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  total_mrr DECIMAL(12, 2);
BEGIN
  SELECT SUM(
    CASE 
      WHEN billing_cycle = 'annual' THEN monthly_price / 12
      ELSE monthly_price
    END
  ) INTO total_mrr
  FROM subscriptions
  WHERE status = 'active'
    AND created_at <= target_date
    AND (canceled_at IS NULL OR canceled_at > target_date);
  
  RETURN COALESCE(total_mrr, 0);
END;
$$ LANGUAGE plpgsql;

-- Calculate churn rate for a period
CREATE OR REPLACE FUNCTION calculate_churn_rate(
  start_date DATE,
  end_date DATE
) RETURNS DECIMAL(5, 2) AS $$
DECLARE
  starting_customers INTEGER;
  churned_customers INTEGER;
  churn_rate DECIMAL(5, 2);
BEGIN
  -- Customers at start
  SELECT COUNT(*) INTO starting_customers
  FROM subscriptions
  WHERE status = 'active'
    AND created_at <= start_date;
  
  -- Customers who churned in period
  SELECT COUNT(*) INTO churned_customers
  FROM subscriptions
  WHERE canceled_at BETWEEN start_date AND end_date;
  
  IF starting_customers > 0 THEN
    churn_rate := (churned_customers::DECIMAL / starting_customers) * 100;
  ELSE
    churn_rate := 0;
  END IF;
  
  RETURN churn_rate;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update customer updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Increment app install count
CREATE OR REPLACE FUNCTION increment_app_installs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_apps
  SET installs = installs + 1
  WHERE id = NEW.app_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_app_installs_trigger
AFTER INSERT ON app_installations
FOR EACH ROW
EXECUTE FUNCTION increment_app_installs();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default tier configurations (stored in metadata)
INSERT INTO customers (id, email, company_name, metadata)
VALUES ('system', 'system@auracdp.com', 'System', '{"system": true}')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Migration complete
SELECT 'Revenue infrastructure schema created successfully!' AS status;
