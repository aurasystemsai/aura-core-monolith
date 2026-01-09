import React from "react";
import "./PricingPage.css";

const plans = [
  {
    name: "Pro",
    price: "$49/mo",
    description: "All core features, premium support, and 10,000 monthly credits included.",
    features: [
      "Unlimited A/B tests",
      "AI-powered analytics",
      "Shopify embedded integration",
      "10,000 monthly usage credits",
      "Premium support",
      "All future tools included"
    ],
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For high-volume brands and agencies. Custom integrations, SLAs, and unlimited credits.",
    features: [
      "Everything in Pro",
      "Unlimited usage credits",
      "Custom integrations",
      "Dedicated account manager",
      "SLA & priority support"
    ],
    cta: "Contact Sales"
  }
];

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <h1>Pricing</h1>
      <p className="subtitle">Premium features. No free plan. 7-day free trial. Usage-based credits. Cancel anytime.</p>
      <div className="plans">
        {plans.map((plan) => (
          <div className="plan" key={plan.name}>
            <h2>{plan.name}</h2>
            <div className="price">{plan.price}</div>
            <div className="desc">{plan.description}</div>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="cta">{plan.cta}</button>
          </div>
        ))}
      </div>
      <div className="trial-note">7-day free trial. No credit card required. Cancel anytime.</div>
    </div>
  );
}
