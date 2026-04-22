'use strict';
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode',
    // sql.js uses module.exports inside webpack's scope which breaks in ESM context;
    // ship it as a separate file and require it at runtime instead of bundling it
    'sql.js': 'commonjs ./sql-wasm.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: 'ts-loader' }]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'node_modules/sql.js/dist/sql-wasm.wasm', to: 'sql-wasm.wasm' },
        { from: 'node_modules/sql.js/dist/sql-wasm.js',   to: 'sql-wasm.js'   }
      ]
    })
  ],
  devtool: 'nosources-source-map',
  infrastructureLogging: { level: 'log' }
};
