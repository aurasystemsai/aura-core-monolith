import React, { useState, useEffect } from 'react';
import './UpsellCrossSellEngine.css';

const UpsellCrossSellEngine = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for different features
  const [metrics, setMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [affinityRules, setAffinityRules] = useState([]);
  const [cartOptimizations, setCartOptimizations] = useState([]);
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [config, setConfig] = useState(null);
  
  // Form states
  const [recommendationForm, setRecommendationForm] = useState({
    customerId: '',
    strategy: 'hybrid',
    maxRecommendations: 10
  });
  
  const [affinityForm, setAffinityForm] = useState({
    minSupport: 0.01,
    minConfidence: 0.3,
    minLift: 1.0
  });
  
  const [cartForm, setCartForm] = useState({
    cartId: '',
    customerEmail: '',
    items: []
  });

  // Fetch initial data
  useEffect(() => {
    loadOverview();
    loadConfig();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const [metricsRes, rulesRes] = await Promise.all([
        fetch('/api/upsell-cross-sell/analytics/overview'),
        fetch('/api/upsell-cross-sell/affinity/rules?minLift=1.5')
      ]);
      
      const metricsData = await metricsRes.json();
      const rulesData = await rulesRes.json();
      
      if (metricsData.success) setMetrics(metricsData.data);
      if (rulesData.success) setAffinityRules(rulesData.data);
      
      setError(null);
    } catch (err) {
      setError(`Failed to load overview: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/upsell-cross-sell/config');
      const data = await res.json();
      if (data.success) setConfig(data.data);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/upsell-cross-sell/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recommendationForm)
      });
      
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.data.recommendations || []);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Failed to generate recommendations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAffinity = async () => {
    try {
      setLoading(true);
      // In production, fetch real order data
      const sampleOrders = [
        {
          id: 'order1',
          customerId: 'cust1',
          items: [
            { productId: 'prod1', quantity: 1, price: 29.99 },
            { productId: 'prod2', quantity: 1, price: 19.99 }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      
      const res = await fetch('/api/upsell-cross-sell/affinity/frequently-bought-together', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: sampleOrders,
          minSupport: affinityForm.minSupport,
          minConfidence: affinityForm.minConfidence
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setError(null);
        alert(`Generated ${data.data.totalRules} affinity rules`);
        loadOverview(); // Refresh rules
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Failed to analyze affinity: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const optimizeCart = async () => {
    try {
      setLoading(true);
      
      const cart = {
        id: cartForm.cartId || `cart_${Date.now()}`,
        customerId: cartForm.customerEmail,
        items: cartForm.items.length > 0 ? cartForm.items : [
          { productId: 'prod1', quantity: 1, price: 29.99 },
          { productId: 'prod2', quantity: 2, price: 19.99 }
        ]
      };
      
      const res = await fetch('/api/upsell-cross-sell/cart/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, context: { customerId: cartForm.customerEmail } })
      });
      
      const data = await res.json();
      if (data.success) {
        setCartOptimizations([data.data]);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Failed to optimize cart: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAbandonedCarts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/upsell-cross-sell/cart/abandoned?minValue=20');
      const data = await res.json();
      
      if (data.success) {
        setAbandonedCarts(data.data || []);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Failed to load abandoned carts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const recoverCart = async (cartId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/upsell-cross-sell/cart/recover/${cartId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: 'aggressive' })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Recovery strategy created with ${(data.data.estimatedRecoveryProbability * 100).toFixed(0)}% estimated success rate`);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(`Failed to recover cart: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const trainModels = async () => {
    try {
      setLoading(true);
      
      // Sample training data
      const purchases = [
        { customerId: 'cust1', productId: 'prod1', rating: 5 },
        { customerId: 'cust1', productId: 'prod2', rating: 4 },
        { customerId: 'cust2', productId: 'prod1', rating: 5 },
        { customerId: 'cust2', productId: 'prod3', rating: 3 }
      ];
      
      const products = [
        { id: 'prod1', category: 'electronics', brand: 'Apple', price: 999 },
        { id: 'prod2', category: 'electronics', brand: 'Samsung', price: 799 },
        { id: 'prod3', category: 'accessories', brand: 'Anker', price: 29 }
      ];
      
      const [collab, content] = await Promise.all([
        fetch('/api/upsell-cross-sell/ml/train-collaborative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchases })
        }),
        fetch('/api/upsell-cross-sell/ml/train-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products })
        })
      ]);
      
      const collabData = await collab.json();
      const contentData = await content.json();
      
      if (collabData.success && contentData.success) {
        alert('Models trained successfully!');
        setError(null);
      }
    } catch (err) {
      setError(`Failed to train models: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render functions for different tabs
  const renderOverview = () => (
    <div className="upsell-overview">
      <h2>Upsell & Cross-Sell Performance</h2>
      
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>{metrics.recommendations.totalImpressions.toLocaleString()}</h3>
            <p>Total Impressions</p>
          </div>
          <div className="metric-card">
            <h3>{metrics.recommendations.totalClicks.toLocaleString()}</h3>
            <p>Total Clicks</p>
          </div>
          <div className="metric-card">
            <h3>{metrics.recommendations.totalConversions.toLocaleString()}</h3>
            <p>Conversions</p>
          </div>
          <div className="metric-card">
            <h3>{(metrics.recommendations.ctr * 100).toFixed(2)}%</h3>
            <p>Click-Through Rate</p>
          </div>
          <div className="metric-card">
            <h3>{(metrics.recommendations.conversionRate * 100).toFixed(2)}%</h3>
            <p>Conversion Rate</p>
          </div>
          <div className="metric-card">
            <h3>${metrics.revenue.total.toFixed(2)}</h3>
            <p>Total Revenue</p>
          </div>
          <div className="metric-card">
            <h3>${metrics.revenue.avgPerConversion.toFixed(2)}</h3>
            <p>Avg Revenue/Conversion</p>
          </div>
        </div>
      )}
      
      <div className="affinity-rules-section">
        <h3>Top Affinity Rules (Lift &gt; 1.5)</h3>
        {affinityRules.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product A</th>
                <th>Product B</th>
                <th>Lift</th>
                <th>Confidence</th>
                <th>Support</th>
              </tr>
            </thead>
            <tbody>
              {affinityRules.slice(0, 10).map((rule, idx) => (
                <tr key={idx}>
                  <td>{rule.productA}</td>
                  <td>{rule.productB}</td>
                  <td className="lift">{rule.lift.toFixed(2)}</td>
                  <td>{(rule.confidence * 100).toFixed(1)}%</td>
                  <td>{(rule.support * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No affinity rules found. Run affinity analysis to generate rules.</p>
        )}
      </div>
      
      <button className="btn-primary" onClick={loadOverview}>
        Refresh Overview
      </button>
    </div>
  );

  const renderRecommendations = () => (
    <div className="recommendations-section">
      <h2>Generate Recommendations</h2>
      
      <div className="form-section">
        <div className="form-group">
          <label>Customer ID</label>
          <input
            type="text"
            value={recommendationForm.customerId}
            onChange={(e) => setRecommendationForm({...recommendationForm, customerId: e.target.value})}
            placeholder="Enter customer ID"
          />
        </div>
        
        <div className="form-group">
          <label>Strategy</label>
          <select
            value={recommendationForm.strategy}
            onChange={(e) => setRecommendationForm({...recommendationForm, strategy: e.target.value})}
          >
            <option value="hybrid">Hybrid (Recommended)</option>
            <option value="collaborative">Collaborative Filtering</option>
            <option value="content-based">Content-Based</option>
            <option value="trending">Trending Products</option>
            <option value="new-arrivals">New Arrivals</option>
            <option value="session-based">Session-Based</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Max Recommendations</label>
          <input
            type="number"
            value={recommendationForm.maxRecommendations}
            onChange={(e) => setRecommendationForm({...recommendationForm, maxRecommendations: parseInt(e.target.value)})}
            min="1"
            max="50"
          />
        </div>
        
        <button className="btn-primary" onClick={generateRecommendations} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Recommendations'}
        </button>
      </div>
      
      {recommendations.length > 0 && (
        <div className="recommendations-results">
          <h3>Recommendations ({recommendations.length})</h3>
          <div className="recommendations-grid">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-card">
                <h4>Product {rec.productId}</h4>
                <div className="rec-details">
                  <span className="score">Score: {rec.score.toFixed(3)}</span>
                  <span className="confidence">Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="reasoning">{rec.reasoning}</p>
                <span className="model-badge">{rec.model}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAffinityAnalysis = () => (
    <div className="affinity-section">
      <h2>Product Affinity Analysis</h2>
      
      <div className="form-section">
        <div className="form-group">
          <label>Minimum Support</label>
          <input
            type="number"
            step="0.01"
            value={affinityForm.minSupport}
            onChange={(e) => setAffinityForm({...affinityForm, minSupport: parseFloat(e.target.value)})}
            min="0.001"
            max="0.5"
          />
          <small>Minimum frequency of product pairs (0.01 = 1%)</small>
        </div>
        
        <div className="form-group">
          <label>Minimum Confidence</label>
          <input
            type="number"
            step="0.05"
            value={affinityForm.minConfidence}
            onChange={(e) => setAffinityForm({...affinityForm, minConfidence: parseFloat(e.target.value)})}
            min="0.1"
            max="1.0"
          />
          <small>Minimum rule confidence (0.3 = 30%)</small>
        </div>
        
        <div className="form-group">
          <label>Minimum Lift</label>
          <input
            type="number"
            step="0.1"
            value={affinityForm.minLift}
            onChange={(e) => setAffinityForm({...affinityForm, minLift: parseFloat(e.target.value)})}
            min="1.0"
            max="10.0"
          />
          <small>Minimum lift score (1.0 = no correlation)</small>
        </div>
        
        <button className="btn-primary" onClick={analyzeAffinity} disabled={loading}>
          {loading ? 'Analyzing...' : 'Run Affinity Analysis'}
        </button>
        
        <button className="btn-secondary" onClick={loadOverview}>
          View Current Rules
        </button>
      </div>
      
      <div className="affinity-info">
        <h3>What is Product Affinity?</h3>
        <p>
          Product affinity analysis uses machine learning to discover which products are frequently bought together.
          It implements the Apriori algorithm for market basket analysis and calculates association rules with three key metrics:
        </p>
        <ul>
          <li><strong>Support:</strong> How often products appear together (frequency)</li>
          <li><strong>Confidence:</strong> Probability that product B is bought when product A is purchased</li>
          <li><strong>Lift:</strong> How much more likely is B to be bought with A compared to random (lift &gt; 1 = positive correlation)</li>
        </ul>
      </div>
    </div>
  );

  const renderCartOptimization = () => (
    <div className="cart-optimization-section">
      <h2>Cart Optimization</h2>
      
      <div className="form-section">
        <div className="form-group">
          <label>Cart ID (optional)</label>
          <input
            type="text"
            value={cartForm.cartId}
            onChange={(e) => setCartForm({...cartForm, cartId: e.target.value})}
            placeholder="Auto-generated if empty"
          />
        </div>
        
        <div className="form-group">
          <label>Customer Email</label>
          <input
            type="email"
            value={cartForm.customerEmail}
            onChange={(e) => setCartForm({...cartForm, customerEmail: e.target.value})}
            placeholder="customer@example.com"
          />
        </div>
        
        <button className="btn-primary" onClick={optimizeCart} disabled={loading}>
          {loading ? 'Optimizing...' : 'Optimize Cart'}
        </button>
        
        <button className="btn-secondary" onClick={loadAbandonedCarts}>
          View Abandoned Carts
        </button>
      </div>
      
      {cartOptimizations.length > 0 && (
        <div className="optimization-results">
          {cartOptimizations.map((opt, idx) => (
            <div key={idx} className="optimization-card">
              <h3>Cart Optimization Results</h3>
              
              <div className="value-metrics">
                <div className="metric">
                  <span className="label">Current Value:</span>
                  <span className="value">${opt.upsells?.[0]?.currentPrice || 0}</span>
                </div>
                <div className="metric">
                  <span className="label">Predicted Final Value:</span>
                  <span className="value">${opt.predictedFinalValue?.predicted.toFixed(2) || 0}</span>
                </div>
                <div className="metric success">
                  <span className="label">Estimated Increase:</span>
                  <span className="value">+${opt.estimatedValueIncrease.toFixed(2)}</span>
                </div>
              </div>
              
              {opt.upsells && opt.upsells.length > 0 && (
                <div className="suggestions-section">
                  <h4>Upsell Suggestions ({opt.upsells.length})</h4>
                  <div className="suggestions-list">
                    {opt.upsells.map((upsell, i) => (
                      <div key={i} className="suggestion-item">
                        <div className="suggestion-header">
                          <span className="type-badge upsell">Upsell</span>
                          <span className="increase">+${upsell.valueIncrease?.toFixed(2) || 0}</span>
                        </div>
                        <p>{upsell.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {opt.crossSells && opt.crossSells.length > 0 && (
                <div className="suggestions-section">
                  <h4>Cross-Sell Suggestions ({opt.crossSells.length})</h4>
                  <div className="suggestions-list">
                    {opt.crossSells.map((cs, i) => (
                      <div key={i} className="suggestion-item">
                        <div className="suggestion-header">
                          <span className="type-badge cross-sell">Cross-Sell</span>
                          <span className="score">Score: {cs.score?.toFixed(2) || 0}</span>
                        </div>
                        <p>{cs.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {opt.freeShipping && (
                <div className="free-shipping-nudge">
                  {opt.freeShipping.qualified ? (
                    <div className="qualified">
                      ✓ {opt.freeShipping.message}
                    </div>
                  ) : (
                    <div className="not-qualified">
                      🚚 {opt.freeShipping.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {abandonedCarts.length > 0 && (
        <div className="abandoned-carts-section">
          <h3>Abandoned Carts ({abandonedCarts.length})</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cart ID</th>
                <th>Customer</th>
                <th>Value</th>
                <th>Hours Since</th>
                <th>Recovery %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {abandonedCarts.map((cart) => (
                <tr key={cart.id}>
                  <td>{cart.id}</td>
                  <td>{cart.customerId || 'Guest'}</td>
                  <td>${cart.currentValue?.toFixed(2) || 0}</td>
                  <td>{cart.hoursSinceAbandonment?.toFixed(1) || 0}</td>
                  <td>{(cart.estimatedRecoveryProbability * 100).toFixed(0)}%</td>
                  <td>
                    <button className="btn-small" onClick={() => recoverCart(cart.id)}>
                      Recover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderMLModels = () => (
    <div className="ml-models-section">
      <h2>Machine Learning Models</h2>
      
      <div className="models-grid">
        <div className="model-card">
          <h3>Collaborative Filtering</h3>
          <p>User-based and item-based recommendations using purchase history and ratings.</p>
          <ul>
            <li>Finds similar users/products</li>
            <li>Pearson correlation similarity</li>
            <li>Handles sparse data</li>
          </ul>
        </div>
        
        <div className="model-card">
          <h3>Content-Based Filtering</h3>
          <p>Recommendations based on product attributes and customer preferences.</p>
          <ul>
            <li>Product feature extraction</li>
            <li>Cosine similarity matching</li>
            <li>Preference profile building</li>
          </ul>
        </div>
        
        <div className="model-card">
          <h3>Hybrid Model</h3>
          <p>Combines collaborative and content-based approaches with trending products.</p>
          <ul>
            <li>Weighted ensemble (50/40/10)</li>
            <li>Better cold-start handling</li>
            <li>Higher accuracy</li>
          </ul>
        </div>
        
        <div className="model-card">
          <h3>Thompson Sampling</h3>
          <p>Multi-armed bandit for exploration/exploitation trade-off.</p>
          <ul>
            <li>Beta distribution sampling</li>
            <li>Adaptive learning</li>
            <li>Balances novelty & performance</li>
          </ul>
        </div>
      </div>
      
      <div className="training-section">
        <h3>Model Training</h3>
        <p>Train recommendation models with sample or real data.</p>
        <button className="btn-primary" onClick={trainModels} disabled={loading}>
          {loading ? 'Training...' : 'Train All Models'}
        </button>
      </div>
      
      {metrics && (
        <div className="model-performance">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>{metrics.recommendations.totalImpressions}</h4>
              <p>Impressions</p>
            </div>
            <div className="metric-card">
              <h4>{(metrics.recommendations.ctr * 100).toFixed(2)}%</h4>
              <p>CTR</p>
            </div>
            <div className="metric-card">
              <h4>{(metrics.recommendations.conversionRate * 100).toFixed(2)}%</h4>
              <p>Conversion Rate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <h2>Configuration</h2>
      
      {config && (
        <div className="config-panel">
          <div className="config-group">
            <label>Free Shipping Threshold</label>
            <input type="number" defaultValue={config.freeShippingThreshold} />
            <small>Minimum cart value for free shipping in USD</small>
          </div>
          
          <div className="config-group">
            <label>Default Max Recommendations</label>
            <input type="number" defaultValue={config.defaultMaxRecommendations} />
            <small>Number of recommendations to show by default</small>
          </div>
          
          <div className="config-group">
            <label>Abandonment Threshold (minutes)</label>
            <input type="number" defaultValue={config.abandonmentThreshold} />
            <small>Time before cart is considered abandoned</small>
          </div>
          
          <div className="config-group">
            <label>Min Affinity Support</label>
            <input type="number" step="0.01" defaultValue={config.minAffinitySupport} />
            <small>Minimum support for affinity rules</small>
          </div>
          
          <div className="config-group">
            <label>Min Affinity Confidence</label>
            <input type="number" step="0.05" defaultValue={config.minAffinityConfidence} />
            <small>Minimum confidence for affinity rules</small>
          </div>
          
          <button className="btn-primary">Save Configuration</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="upsell-cross-sell-engine">
      <div className="tool-header">
        <h1>🎯 Upsell & Cross-Sell Engine</h1>
        <p>AI-powered recommendation system to maximize AOV and revenue</p>
      </div>
      
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'recommendations' ? 'active' : ''}
          onClick={() => setActiveTab('recommendations')}
        >
          🤖 Recommendations
        </button>
        <button 
          className={activeTab === 'affinity' ? 'active' : ''}
          onClick={() => setActiveTab('affinity')}
        >
          🔗 Affinity Analysis
        </button>
        <button 
          className={activeTab === 'cart' ? 'active' : ''}
          onClick={() => setActiveTab('cart')}
        >
          🛒 Cart Optimization
        </button>
        <button 
          className={activeTab === 'ml' ? 'active' : ''}
          onClick={() => setActiveTab('ml')}
        >
          🧠 ML Models
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'recommendations' && renderRecommendations()}
        {activeTab === 'affinity' && renderAffinityAnalysis()}
        {activeTab === 'cart' && renderCartOptimization()}
        {activeTab === 'ml' && renderMLModels()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default UpsellCrossSellEngine;
