-- Shopify Integration Database Schema
-- Tables for storing Shopify OAuth tokens and shop data

CREATE TABLE IF NOT EXISTS shopify_stores (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'uninstalled', 'suspended')),
  installed_at TIMESTAMP DEFAULT NOW(),
  reinstalled_at TIMESTAMP,
  uninstalled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopify_stores_domain ON shopify_stores(shop_domain);
CREATE INDEX idx_shopify_stores_status ON shopify_stores(status);

CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  currency VARCHAR(10),
  timezone VARCHAR(100),
  country_code VARCHAR(10),
  plan_name VARCHAR(100),
  shop_owner VARCHAR(255),
  access_token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shops_domain ON shops(shop_domain);

-- Shopify sync logs
CREATE TABLE IF NOT EXISTS shopify_sync_logs (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  sync_type VARCHAR(100) NOT NULL, -- products, orders, customers, inventory
  status VARCHAR(50) DEFAULT 'running',
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sync_logs_shop ON shopify_sync_logs(shop_domain);
CREATE INDEX idx_sync_logs_type ON shopify_sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON shopify_sync_logs(status);

-- Webhook events
CREATE TABLE IF NOT EXISTS shopify_webhooks (
  id SERIAL PRIMARY KEY,
  shop_domain VARCHAR(255) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  webhook_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX idx_webhooks_shop ON shopify_webhooks(shop_domain);
CREATE INDEX idx_webhooks_topic ON shopify_webhooks(topic);
CREATE INDEX idx_webhooks_processed ON shopify_webhooks(processed);

COMMENT ON TABLE shopify_stores IS 'OAuth tokens and connection status for Shopify stores';
COMMENT ON TABLE shops IS 'Shopify shop details and metadata';
COMMENT ON TABLE shopify_sync_logs IS 'Data synchronization history with Shopify';
COMMENT ON TABLE shopify_webhooks IS 'Incoming Shopify webhook events';
