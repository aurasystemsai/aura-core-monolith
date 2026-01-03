// Simple webhook handler (stub)
module.exports = {
  handle: (payload) => {
    // Integrate with external systems in production
    console.log('[Webhook] Received:', payload);
    return true;
  }
};
