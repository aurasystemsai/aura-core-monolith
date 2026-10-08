import React from "react";
import ConnectAccount from "./ConnectAccount.jsx";

export default function AdsAnomalyGuard() {
  return <ConnectAccount api="/api/ads-anomaly-guard" title="Ads Anomaly Guard" />;
}
