// Lightweight Jest transformer to avoid external resolution issues on Windows.
// For plain JS tests we simply return source unchanged.
module.exports = {
  process(src) {
    return src;
  },
};
