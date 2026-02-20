﻿// Billing & Subscription Management UI
// Shopify App Billing integration for plan management

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { FaCheck, FaDownload, FaSpinner } from 'react-icons/fa';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      '5 AI tool runs per month',
      'Basic analytics',
      '100 products',
      'Email support',
      '24-hour data refresh'
    ],
    limits: {
      aiRuns: 5,
      products: 100,
      users: 1
    }
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    period: 'month',
    popular: true,
    features: [
      'Unlimited AI tool runs',
      'Advanced analytics',
      'Unlimited products',
      'Priority support',
      'Real-time data sync',
      'API access',
      'Custom automations'
    ],
    limits: {
      aiRuns: -1,
      products: -1,
      users: 5
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    period: 'month',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
      'Advanced security',
      'Unlimited team members'
    ],
    limits: {
      aiRuns: -1,
      products: -1,
      users: -1
    }
  }
];

const Billing = () => {
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    setLoading(true);
    try {
      const [subData, invoiceData, usageData] = await Promise.all([
        apiFetch('/billing/subscription'),
        apiFetch('/billing/invoices'),
        apiFetch('/billing/usage')
      ]);

      setSubscription(subData);
      setInvoices(invoiceData);
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function changePlan(planId) {
    if (!confirm(`Are you sure you want to ${subscription ? 'change to' : 'subscribe to'} the ${PLANS.find(p => p.id === planId)?.name} plan?`)) {
      return;
    }

    setChangingPlan(true);
    try {
      const result = await apiFetch('/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });

      if (result.requiresPayment) {
        // Redirect to Shopify approval page
        window.location.href = result.checkoutUrl;
      } else {
        setSubscription(result.subscription);
        setShowPlanModal(false);
        alert('Plan changed successfully!');
      }
    } catch (error) {
      alert('Failed to change plan: ' + error.message);
    } finally {
      setChangingPlan(false);
    }
  }

  async function cancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      await apiFetch('/billing/cancel', { method: 'POST' });
      alert('Subscription cancelled. You will retain access until the end of your billing period.');
      loadBillingData();
    } catch (error) {
      alert('Failed to cancel: ' + error.message);
    }
  }

  async function downloadInvoice(invoiceId) {
    try {
      const blob = await apiFetch(`/billing/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
    } catch (error) {
      alert('Failed to download invoice: ' + error.message);
    }
  }

  if (loading) {
    return (
      <div className="billing-page">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Ensure we always have a plan object with limits to avoid runtime errors
  const currentPlan = subscription ? (PLANS.find(p => p.id === subscription.plan_id) || PLANS[0]) : PLANS[0];
  const planLimits = currentPlan?.limits || { aiRuns: 0, products: 0, users: 0 };

  return (
    <div className="billing-page">
      <div className="billing-header">
        <h1>Billing & Subscription</h1>
        <p>Manage your plan, payment methods, and billing history</p>
      </div>

      {/* Current Plan Card */}
      <div className="current-plan-card">
        <div className="plan-header">
          <div>
            <h2>Current Plan: {currentPlan?.name || 'Free'}</h2>
            {subscription?.status === 'active' && (
              <span className="status-badge active">Active</span>
            )}
            {subscription?.status === 'canceled' && (
              <span className="status-badge canceled">Canceled</span>
            )}
            {subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date() && (
              <span className="status-badge trial">Trial</span>
            )}
          </div>
          <div className="plan-price">
            <span className="price">${currentPlan?.price || 0}</span>
            <span className="period">/{currentPlan?.period || 'month'}</span>
          </div>
        </div>

        {subscription && (
          <div className="plan-details">
            <div className="detail-row">
              <span>Billing Period:</span>
              <span>
                {new Date(subscription.current_period_start).toLocaleDateString()} - 
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
            <div className="detail-row">
              <span>Next Billing Date:</span>
              <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
            </div>
            {subscription.trial_ends_at && (
              <div className="detail-row">
                <span>Trial Ends:</span>
                <span>{new Date(subscription.trial_ends_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        <div className="plan-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowPlanModal(true)}
          >
            {subscription ? 'Change Plan' : 'Upgrade Now'}
          </button>
          {subscription && subscription.status === 'active' && (
            <button 
              className="btn-danger-outline"
              onClick={cancelSubscription}
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="usage-card">
          <h3>Current Usage</h3>
          <div className="usage-stats">
            <div className="usage-stat">
              <div className="stat-label">AI Tool Runs</div>
              <div className="stat-value">
                {usage.aiRuns} {planLimits.aiRuns !== -1 ? `/ ${planLimits.aiRuns}` : ''}
              </div>
              {planLimits.aiRuns !== -1 && planLimits.aiRuns > 0 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min((usage.aiRuns / planLimits.aiRuns) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="usage-stat">
              <div className="stat-label">Products</div>
              <div className="stat-value">
                {usage.products} {planLimits.products !== -1 ? `/ ${planLimits.products}` : ''}
              </div>
            </div>
            <div className="usage-stat">
              <div className="stat-label">Team Members</div>
              <div className="stat-value">
                {usage.users} {planLimits.users !== -1 ? `/ ${planLimits.users}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="invoices-card">
        <h3>Billing History</h3>
        {invoices.length > 0 ? (
          <div className="invoices-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{new Date(invoice.created).toLocaleDateString()}</td>
                    <td>{invoice.description}</td>
                    <td>${(invoice.amount / 100).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${invoice.status}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-icon"
                        onClick={() => downloadInvoice(invoice.id)}
                        title="Download PDF"
                      >
                        <FaDownload />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-invoices">No billing history yet</p>
        )}
      </div>

      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal-content plans-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose Your Plan</h2>
              <button className="close-btn" onClick={() => setShowPlanModal(false)}>×</button>
            </div>
            
            <div className="plans-grid">
              {PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  className={`plan-card ${plan.popular ? 'popular' : ''} ${currentPlan?.id === plan.id ? 'current' : ''}`}
                >
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
                  {currentPlan?.id === plan.id && <div className="current-badge">Current Plan</div>}
                  
                  <h3>{plan.name}</h3>
                  <div className="plan-price-large">
                    <span className="price">${plan.price}</span>
                    <span className="period">/{plan.period}</span>
                  </div>

                  <ul className="features-list">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <FaCheck className="check-icon" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`btn-plan ${currentPlan?.id === plan.id ? 'btn-current' : 'btn-primary'}`}
                    onClick={() => changePlan(plan.id)}
                    disabled={changingPlan || currentPlan?.id === plan.id}
                  >
                    {changingPlan ? 'Processing...' : currentPlan?.id === plan.id ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .billing-page {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          background: #1a1c25;
          min-height: 100vh;
        }

        .billing-header {
          margin-bottom: 32px;
        }

        .billing-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #f9fafb;
        }

        .billing-header p {
          color: #94a3b8;
          margin: 0;
        }

        .current-plan-card,
        .usage-card,
        .invoices-card {
          background: #1a1c25;
          border: 1px solid #222535;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          margin-bottom: 24px;
        }

        .usage-card h3,
        .invoices-card h3 {
          color: #f9fafb;
          margin-top: 0;
        }

        .no-invoices {
          color: #94a3b8;
          text-align: center;
          padding: 32px;
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #222535;
        }

        .plan-header h2 {
          margin: 0 0 8px 0;
          color: #f9fafb;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-left: 12px;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.canceled {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.trial {
          background: #d1ecf1;
          color: #0c5460;
        }

        .plan-price {
          text-align: right;
        }

        .plan-price .price {
          font-size: 36px;
          font-weight: 700;
          color: #6366f1;
        }

        .plan-price .period {
          color: #94a3b8;
          font-size: 16px;
        }

        .plan-details {
          margin: 16px 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #222535;
          color: #cbd5e1;
        }

        .plan-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary {
          background: #6366f1;
          color: #0d0d11;
          padding: 12px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #6ad5bc;
        }

        .btn-danger-outline {
          background: transparent;
          color: #dc3545;
          border: 2px solid #dc3545;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger-outline:hover {
          background: #dc3545;
          color: white;
        }

        .usage-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-top: 16px;
        }

        .usage-stat {
          padding: 16px;
          background: #1a1c25;
          border: 1px solid #222535;
          border-radius: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #f9fafb;
        }

        .progress-bar {
          height: 8px;
          background: #222535;
          border-radius: 4px;
          margin-top: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #6366f1;
          transition: width 0.3s;
        }

        .btn-secondary {
          background: #222535;
          color: #f9fafb;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #353848;
        }

        .invoices-table {
          overflow-x: auto;
          margin-top: 16px;
        }

        .invoices-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoices-table th {
          text-align: left;
          padding: 12px;
          background: #1a1c25;
          font-weight: 600;
          color: #94a3b8;
        }

        .invoices-table td {
          padding: 12px;
          border-bottom: 1px solid #222535;
          color: #cbd5e1;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          color: #6366f1;
          padding: 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #222535;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1a1c25;
          border: 1px solid #222535;
          padding: 32px;
          border-radius: 16px;
          max-width: 1000px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          color: #f9fafb;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #94a3b8;
          padding: 0;
          width: 40px;
          height: 40px;
        }

        .close-btn:hover {
          color: #f9fafb;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .plan-card {
          background: #1a1c25;
          border: 2px solid #222535;
          border-radius: 12px;
          padding: 24px;
          position: relative;
        }

        .plan-card h3 {
          color: #f9fafb;
        }

        .plan-card.popular {
          border-color: #6366f1;
          box-shadow: 0 4px 16px rgba(127,255,212,0.2);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          right: 24px;
          background: #6366f1;
          color: #0d0d11;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .current-badge {
          position: absolute;
          top: -12px;
          left: 24px;
          background: #28a745;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .plan-price-large {
          margin: 16px 0;
        }

        .plan-price-large .price {
          font-size: 48px;
          font-weight: 700;
          color: #6366f1;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 24px 0;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          color: #cbd5e1;
        }

        .check-icon {
          color: #28a745;
          flex-shrink: 0;
        }

        .btn-plan {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-current {
          background: #222535;
          color: #64748b;
          cursor: not-allowed;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
        }

        .spinner {
          animation: spin 1s linear infinite;
          font-size: 48px;
          color: #6366f1;
          margin-bottom: 16px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Billing;



