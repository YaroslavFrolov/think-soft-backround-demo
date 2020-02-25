const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 9000
  },
  performance: {
    hints: false,
  },
};
