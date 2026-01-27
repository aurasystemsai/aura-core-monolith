module.exports = {
  key: "rank-visibility-tracker",

  async run(input = {}, ctx = {}) {
    const env = (ctx.env && ctx.env.NODE_ENV) || "development";
    const keywords = Array.isArray(input.keywords) ? input.keywords : [];
    const tracked = keywords.map((k, idx) => {
      const current = Number(k.currentRank ?? k.rank ?? 100);
      const previous = Number(k.previousRank ?? 100);
      const delta = previous - current;
      return {
        id: k.id || `kw-${idx + 1}`,
        keyword: k.keyword || k.term || "",
        current,
        previous,
        delta,
        movement: delta > 0 ? "improved" : delta < 0 ? "declined" : "flat",
        intent: k.intent || "generic",
      };
    });

    const avgRank = tracked.length
      ? tracked.reduce((acc, k) => acc + k.current, 0) / tracked.length
      : 100;
    const avgDelta = tracked.length
      ? tracked.reduce((acc, k) => acc + k.delta, 0) / tracked.length
      : 0;

    return {
      ok: true,
      tool: "rank-visibility-tracker",
      message: "Rank & visibility metrics calculated.",
      environment: env,
      input,
      output: {
        keywords: tracked,
        stats: {
          averageRank: Number(avgRank.toFixed(2)),
          averageDelta: Number(avgDelta.toFixed(2)),
          improved: tracked.filter((k) => k.movement === "improved").length,
          declined: tracked.filter((k) => k.movement === "declined").length,
        },
      },
    };
  },
};
