// Simple plugin system (stub)
module.exports = {
  run: (payload) => {
    // Integrate with plugin hooks in production
    console.log('[Plugin] Run:', payload);
    return true;
  }
};
