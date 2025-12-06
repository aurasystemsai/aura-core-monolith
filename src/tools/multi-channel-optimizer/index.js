// src/tools/multi-channel-optimizer/index.js
// ------------------------------------------
// Basic channel budget recommendations
// ------------------------------------------

module.exports = {
  key: "multi-channel-optimizer",
  name: "Multi-Channel Optimizer",

  async run(input = {}, ctx = {}) {
    const channels = Array.isArray(input.channels) ? input.channels : [];

    const recommendations = channels.map((ch) => {
      const roas = Number(ch.roas || 0);
      let action = "hold";
      if (roas < 1) action = "decrease";
      else if (roas > 2) action = "increase";

      return {
        name: ch.name,
        spend: Number(ch.spend || 0),
        roas,
        action,
      };
    });

    return {
      ok: true,
      tool: "multi-channel-optimizer",
      recommendations,
    };
  },
};
