import React from "react";
import "./PricingPage.css";

const plans = [
  {
    name: "Growth",
    price: "$49/mo",
    description: "Core SEO, email & social tools with 5,000 monthly credits.",
    features: [
      "5,000 AI credits / month",
      "All core SEO tools",
      "Email automation builder",
      "Social scheduler",
      "Unlimited products",
      "Priority email support"
    ],
    cta: "Start Free Trial"
  },
  {
    name: "Pro",
    price: "$149/mo",
    popular: true,
    description: "Advanced analytics, ads, personalization & 25,000 monthly credits.",
    features: [
      "25,000 AI credits / month",
      "Everything in Growth",
      "Ads & analytics suite",
      "Personalization engine",
      "Advanced automations",
      "10 team members"
    ],
    cta: "Start Free Trial"
  },
  {
    name: "Enterprise",
    price: "$349/mo",
    description: "Unlimited credits, API access, dedicated support & custom SLAs.",
    features: [
      "Unlimited AI credits",
      "Everything in Pro",
      "Custom dashboards & exports",
      "API & SDK access",
      "Unlimited team members",
      "Dedicated account manager"
    ],
    cta: "Contact Sales"
  }
];

export default function PricingPage() {
  return (
    <div className="pricing-page">
      <h1>Pricing</h1>
      <p className="subtitle">No free plan. 7-day free trial on all paid plans. Usage-based AI credits. Cancel anytime. Need more credits? Buy top-up packs.</p>
      <div className="plans">
        {plans.map((plan) => (
          <div className={`plan${plan.popular ? ' popular' : ''}`} key={plan.name}>
            {plan.popular && <div className="popular-badge">Most Popular</div>}
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
