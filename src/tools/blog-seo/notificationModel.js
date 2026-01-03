// Simple notification model (stub)
module.exports = {
  send: (to, message) => {
    // Integrate with email/SMS/push in production
    console.log(`[Notification] To: ${to} | Message: ${message}`);
    return true;
  }
};
