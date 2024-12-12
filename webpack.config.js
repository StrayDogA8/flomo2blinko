const path = require('path');

module.exports = {
  entry: './src/popup.js',
  output: {
    filename: 'popup.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  experiments: {
    topLevelAwait: true
  },
  devtool: false,
  optimization: {
    minimize: false
  }
}; 