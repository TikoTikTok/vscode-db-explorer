'use strict';
const path = require('path');

module.exports = {
  target: 'web',
  mode: 'none',
  entry: './src/webview/editor-bundle.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'editor-bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: 'ts-loader' }],
      },
    ],
  },
  devtool: 'nosources-source-map',
};
