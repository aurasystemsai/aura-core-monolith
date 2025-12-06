// src/tools/inbox-assistant/index.js
// ----------------------------------
// Groups incoming emails by intent
// ----------------------------------

module.exports = {
  key: "inbox-assistant",
  name: "Inbox Assistant",

  async run(input = {}, ctx = {}) {
    const items = Array.isArray(input.items) ? input.items : [];

    const groups = {
      support: [],
      sales: [],
      newsletter: [],
      other: [],
    };

    items.forEach((item) => {
      const subject = String(item.subject || "").toLowerCase();
      if (subject.includes("order") || subject.includes("refund")) {
        groups.support.push(item);
      } else if (subject.includes("quote") || subject.includes("pricing")) {
        groups.sales.push(item);
      } else if (subject.includes("newsletter") || subject.includes("update")) {
        groups.newsletter.push(item);
      } else {
        groups.other.push(item);
      }
    });

    return {
      ok: true,
      tool: "inbox-assistant",
      counts: {
        support: groups.support.length,
        sales: groups.sales.length,
        newsletter: groups.newsletter.length,
        other: groups.other.length,
      },
      groups,
    };
  },
};
