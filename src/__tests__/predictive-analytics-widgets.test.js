const tool = require("../tools/predictive-analytics-widgets");

describe("predictive-analytics-widgets tool", () => {
  test("returns in-house simulated delivery preview", async () => {
    const res = await tool.run(
      {
        metrics: ["churn", "demand"],
        alertEmails: ["ops@example.com"],
        alertThreshold: 5,
      },
      { requestId: "test-req" }
    );

    expect(res.ok).toBe(true);
    expect(res.tool).toBe("predictive-analytics-widgets");
    expect(res.deliveryPreview.summary.toLowerCase()).toContain("simulation");
    expect(res.deliveryPreview.attempts[0]).toMatchObject({ status: "simulated", channel: "email" });
    expect(res.alertPreview.routing.high.slack).toEqual([]);
    expect(res.alertPreview.routing.high.webhook).toEqual([]);
  });

  test("simulates test alerts without external delivery", async () => {
    const res = await tool.run({ sendTestAlert: true, alertEmails: "alerts@example.com" }, {});

    expect(res.ok).toBe(true);
    expect(res.testAlert?.sent).toBe(true);
    expect(res.testAlert?.note?.toLowerCase()).toContain("simulated");
    expect(res.deliveryPreview.summary.toLowerCase()).toContain("no external");
  });
});
