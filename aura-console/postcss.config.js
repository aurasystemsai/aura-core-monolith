module.exports = {
  plugins: [
    require('postcss-preset-env')({
      stage: 3,
      features: {
        'custom-properties': false // disables CSS variable minification
      }
    })
  ]
};
