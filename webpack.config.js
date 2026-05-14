const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

const envConfig = dotenv.config({path: path.resolve(__dirname, '.env')}).parsed ?? {};
const envKeys = Object.keys(envConfig).reduce((accumulator, key) => {
  accumulator[`process.env.${key}`] = JSON.stringify(envConfig[key]);
  return accumulator;
}, {});

module.exports = {
  entry: path.resolve(__dirname, 'index.web.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|jpe?g|gif|webp|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'web/index.html'),
    }),
    new webpack.DefinePlugin(envKeys),
  ],
  devServer: {
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, 'web'),
    },
  },
};
