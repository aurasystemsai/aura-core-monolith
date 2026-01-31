"use strict";

module.exports = {
  meta: {
    id: "predictive-analytics-widgets",
    name: "Predictive Analytics Widgets",
    category: "Analytics / AI",
  },
  async run(input = {}, ctx = {}) {
    const {
      metrics,
      frequency,
      alertEmails,
      alertThreshold,
      sendTestAlert,
      scenarioDemandDelta = 0,
      scenarioBudgetDelta = 0,
      alertRouting = {},
      timeframe = "14d",
      granularity = "daily",
      cohort = "all",
      benchmarkPeerSet = "dtc_midmarket",
    } = input;

    const normalizeList = (value) => {
      if (!value) return [];
      const list = Array.isArray(value) ? value : String(value).split(/[,;\n]+/);
      return list
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLowerCase());
    };

    const requestedMetrics = normalizeList(metrics);
    const cadence = (frequency || "weekly").toLowerCase();
    const alertRecipients = normalizeList(alertEmails).filter((email) => /.+@.+\..+/.test(email));
    const thresholdPct = Number(alertThreshold) || 0;
    const demandDelta = Number(scenarioDemandDelta) || 0;
    const budgetDelta = Number(scenarioBudgetDelta) || 0;

    const now = new Date();
    const daysOut = 7;

    const baseProfiles = {
      churn: { current: 0.082, direction: "down", horizonDays: 30, liftVsLastWeek: -0.011 },
      ltv: { current: 186.5, direction: "up", horizonDays: 90, liftVsLastWeek: 0.037 },
      demand: { current: 1240, direction: "up", horizonDays: 14, liftVsLastWeek: 0.054 },
      revenue: { current: 48250, direction: "flat", horizonDays: 7, liftVsLastWeek: 0.009 },
    };

    const toSeries = (metricKey, startValue) => {
      const base = Number(startValue) || 0;
      return Array.from({ length: daysOut }, (_, idx) => {
        const date = new Date(now.getTime() + (idx + 1) * 24 * 60 * 60 * 1000);
        const drift = 1 + (idx - 3) * 0.006; // gentle slope
        let value = Number((base * drift).toFixed(2));

        // scenario adjustments
        if (metricKey === "demand" || metricKey === "revenue") {
          value = Number((value * (1 + demandDelta / 100)).toFixed(2));
        }
        if (metricKey === "cac" || metricKey === "roas") {
          value = Number((value * (1 + budgetDelta / 100)).toFixed(2));
        }
        return {
          date: date.toISOString().split("T")[0],
          metric: metricKey,
          predicted: value,
          lower: Number((value * 0.96).toFixed(2)),
          upper: Number((value * 1.04).toFixed(2)),
        };
      });
    };

    const toActuals = (metricKey, startValue) => {
      const base = Number(startValue) || 0;
      return Array.from({ length: daysOut }, (_, idx) => {
        const date = new Date(now.getTime() - (daysOut - idx) * 24 * 60 * 60 * 1000);
        const wobble = 1 + Math.sin(idx / 2.5) * 0.015;
        const value = Number((base * wobble).toFixed(2));
        return {
          date: date.toISOString().split("T")[0],
          metric: metricKey,
          actual: value,
        };
      });
    };

    const widgets = Object.entries(baseProfiles)
      .filter(([metric]) => requestedMetrics.length === 0 || requestedMetrics.includes(metric))
      .map(([metric, profile]) => ({
        metric,
        current: profile.current,
        horizonDays: profile.horizonDays,
        direction: profile.direction,
        liftVsLastWeek: profile.liftVsLastWeek,
        insight:
          metric === "churn"
            ? "Churn is trending down after recent winback flows. Keep SMS reactivation running."
            : metric === "ltv"
              ? "LTV is rising with higher AOV cohorts; consider loyalty nudges to compound."
              : metric === "demand"
                ? "Demand forecast is pacing ahead of supply; sync inventory buffers for next drop."
                : "Revenue is stable; monitor promo calendar before increasing spend.",
      }));

    const forecasts = {
      churn: toSeries("churn", baseProfiles.churn.current),
      ltv: toSeries("ltv", baseProfiles.ltv.current),
      demand: toSeries("demand", baseProfiles.demand.current),
      revenue: toSeries("revenue", baseProfiles.revenue.current),
    };

    const benchmarkSets = {
      dtc_midmarket: {
        churn: 0.095,
        ltv: 172,
        demand: 1175,
        revenue: 45100,
        note: "Mid-market DTC peers",
      },
      dtc_enterprise: {
        churn: 0.07,
        ltv: 240,
        demand: 2200,
        revenue: 92000,
        note: "Enterprise DTC peers",
      },
      retail_hybrid: {
        churn: 0.11,
        ltv: 150,
        demand: 980,
        revenue: 38800,
        note: "Retail/ecom hybrid peers",
      },
    };

    const peerSet = benchmarkSets[benchmarkPeerSet] || benchmarkSets.dtc_midmarket;

    const benchmarks = [
      {
        metric: "churn",
        you: baseProfiles.churn.current,
        benchmark: peerSet.churn,
        note: `Churn vs ${peerSet.note}.`,
      },
      {
        metric: "ltv",
        you: baseProfiles.ltv.current,
        benchmark: peerSet.ltv,
        note: `LTV vs ${peerSet.note}.`,
      },
      {
        metric: "demand",
        you: baseProfiles.demand.current,
        benchmark: peerSet.demand,
        note: `Demand vs ${peerSet.note}.`,
      },
      {
        metric: "revenue",
        you: baseProfiles.revenue.current,
        benchmark: peerSet.revenue,
        note: `Revenue vs ${peerSet.note}.`,
      },
    ];

    const actuals = {
      churn: toActuals("churn", baseProfiles.churn.current),
      ltv: toActuals("ltv", baseProfiles.ltv.current),
      demand: toActuals("demand", baseProfiles.demand.current),
      revenue: toActuals("revenue", baseProfiles.revenue.current),
    };

    const cohorts = {
      all: {
        label: "All customers",
        lift: 0,
        sampleSize: 12000,
      },
      new: {
        label: "New customers",
        lift: 0.06,
        sampleSize: 3200,
      },
      returning: {
        label: "Returning customers",
        lift: 0.03,
        sampleSize: 4200,
      },
      sms_engaged: {
        label: "SMS engaged",
        lift: 0.08,
        sampleSize: 1800,
      },
    };

    const cohortSelected = cohorts[cohort] || cohorts.all;

    const cohortBreakdown = [
      { name: "Top 20% LTV", lift: 0.12, conversion: 0.18, size: 1200 },
      { name: "New (first 30d)", lift: 0.03, conversion: 0.11, size: 3200 },
      { name: "SMS + email engaged", lift: 0.08, conversion: 0.22, size: 1800 },
      { name: "Dormant 90d+", lift: -0.05, conversion: 0.04, size: 900 },
    ];

    const cohortTrends = cohortBreakdown.map((c, idx) => {
      const base = c.conversion * 100;
      return {
        name: c.name,
        series: Array.from({ length: daysOut }, (_, i) => {
          const date = new Date(now.getTime() - (daysOut - i) * 24 * 60 * 60 * 1000);
          const wobble = 1 + Math.sin((i + idx) / 3.2) * 0.04;
          return {
            date: date.toISOString().split("T")[0],
            conversion: Number((base * wobble).toFixed(2)),
          };
        }),
      };
    });

    const anomalies = [
      {
        metric: "cac",
        severity: "medium",
        deltaPercent: -0.12,
        message: "CAC dropped 12% after creative swap on Meta; replicate the winning variant to Google.",
      },
      {
        metric: "ltv",
        severity: "low",
        deltaPercent: 0.04,
        message: "High-value cohort (SMS + email engaged) showing +4% LTV vs baseline.",
      },
      {
        metric: "revenue",
        severity: "high",
        deltaPercent: -0.18,
        message: "Revenue dipped 18% day-over-day; investigate promo calendar gaps and inventory constraints.",
      },
    ].filter((anom) => {
      if (!thresholdPct) return true;
      const magnitude = Math.abs(anom.deltaPercent || 0) * 100;
      return magnitude >= thresholdPct;
    });

    const alertPreview = {
      cadence,
      recipients: alertRecipients,
      subject: "Predictive analytics digest",
      bodyPreview:
        "Churn trending down, LTV up 3.7%, and demand pacing +5.4%. Inventory buffer recommended for next 2 weeks.",
      routing: {
        high: {
          email: alertRouting?.high?.email || alertRecipients,
          slack: alertRouting?.high?.slack || [],
          webhook: alertRouting?.high?.webhook || [],
        },
        medium: {
          email: alertRouting?.medium?.email || alertRecipients,
          slack: alertRouting?.medium?.slack || [],
          webhook: alertRouting?.medium?.webhook || [],
        },
        low: {
          email: alertRouting?.low?.email || alertRecipients,
          slack: alertRouting?.low?.slack || [],
          webhook: alertRouting?.low?.webhook || [],
        },
      },
      timeframe,
      granularity,
    };

    const deliveryPreview = {
      summary: "Delivery simulation only (no external sends).",
      attempts: [
        {
          channel: "email",
          destination: alertRecipients[0] || "ops@example.com",
          status: "simulated",
          severity: "high",
        },
      ],
    };

    const testAlert = sendTestAlert
      ? {
          sent: true,
          at: now.toISOString(),
          recipients: alertRecipients,
          preview: alertPreview,
          note: "Test alert simulated. Wire to email service to deliver.",
        }
      : null;

    return {
      ok: true,
      tool: "predictive-analytics-widgets",
      inputs: {
        metrics: requestedMetrics,
        frequency: cadence,
        alertEmails: alertRecipients,
        alertThreshold: thresholdPct,
        sendTestAlert: !!sendTestAlert,
        scenarioDemandDelta: demandDelta,
        scenarioBudgetDelta: budgetDelta,
        timeframe,
        granularity,
        alertRouting,
      },
      widgets,
      forecasts,
      actuals,
      anomalies,
      alertPreview,
      deliveryPreview,
      testAlert,
      recommendedActions: [
        "Keep churn prevention journeys active; retarget at-risk cohorts 7 days post-purchase.",
        "Increase budget on top-performing campaigns by 8-10% while CAC is below target.",
        "Sync demand forecast with ops; add 2-week buffer for SKUs flagged as high demand.",
      ],
      playbooks: [
        { title: "Launch winback journey", action: "Open workflow orchestrator", link: "/#tool-workflow-orchestrator" },
        { title: "Boost budget on top ads", action: "Go to multi-channel optimizer", link: "/#tool-multi-channel-optimizer" },
        { title: "Increase inventory buffer", action: "Sync with inventory supplier", link: "/#tool-inventory-supplier-sync" },
      ],
      cohort: cohortSelected,
      cohortBreakdown,
      cohortTrends,
      benchmarks,
      benchmarkPeerSet,
      scenarioSummary: {
        demandDelta,
        budgetDelta,
        note: "Scenario adjustments applied to demand and revenue forecasts (and CAC/ROAS if present).",
      },
      meta: {
        source: "AURA Core API",
        env: process.env.NODE_ENV || "dev",
        requestId: ctx.requestId || null,
        generatedAt: now.toISOString(),
      },
      message: "Predictive analytics widgets are ready. These values are deterministic sample outputs to validate the UI.",
    };
  },
};
