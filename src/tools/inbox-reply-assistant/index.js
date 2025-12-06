// src/tools/inbox-reply-assistant/index.js
// ----------------------------------------
// Returns short reply templates for common email types
// ----------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "inbox-reply-assistant",
  name: "Inbox Reply Assistant",

  async run(input = {}, ctx = {}) {
    const type = safe(input.type || "generic");
    const name = safe(input.customer_name);

    const greeting = name ? `Hi ${name},` : "Hi there,";

    const map = {
      generic: `${greeting}\n\nThanks for reaching out. We’ve received your message and will get back to you shortly.\n\nBest regards,`,
      partnership: `${greeting}\n\nThanks for your partnership enquiry. We’re currently reviewing collaborations for this quarter and will reply if there’s a good fit.\n\nBest,`,
      influencer: `${greeting}\n\nThanks for your interest in working with us. Please send your audience demographics and recent campaign results so we can review.\n\nBest,`,
    };

    const key = map[type] ? type : "generic";

    return {
      ok: true,
      tool: "inbox-reply-assistant",
      type: key,
      template: map[key],
    };
  },
};
