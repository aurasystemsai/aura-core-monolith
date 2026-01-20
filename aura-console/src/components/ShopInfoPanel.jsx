import React from "react";
import "./ShopInfoPanel.css";

export default function ShopInfoPanel({ shop }) {
  if (!shop) return null;
  return (
    <div className="shop-info-panel">
      <div className="shop-info-row">
        <img
          src="/logo-aura.png"
          alt="Shop Logo"
          className="shop-info-logo"
        />
        <div className="shop-info-details">
          <div className="shop-info-name">{shop.name}</div>
          <div className="shop-info-domain">{shop.domain}</div>
          <div className="shop-info-platform">Platform: {shop.platform}</div>
        </div>
        <div className={`shop-info-status shop-info-status-${shop.status?.toLowerCase() || "active"}`}>
          {shop.status || "Active"}
        </div>
      </div>
      <div className="shop-info-meta">
        <span className="shop-info-plan">{shop.plan || "Shopify"}</span>
        <span className="shop-info-created">Created: {shop.createdAt ? new Date(shop.createdAt).toLocaleString() : '-'}</span>
        <span className="shop-info-updated">Updated: {shop.updatedAt ? new Date(shop.updatedAt).toLocaleString() : '-'}</span>
        {shop.integrations?.map((intg) => (
          <span className="shop-info-integration" key={intg}>{intg}</span>
        ))}
      </div>
    </div>
  );
}
