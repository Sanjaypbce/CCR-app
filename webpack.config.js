const path = require("path");
const Dotenv = require("dotenv-webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");





var config = {
  module: {},
};
const Main = Object.assign({}, config, {
  mode: "development",
  devtool: "inline-source-map",
  resolve: {
    extensions: [".js"],
  },

  entry: [
    'regenerator-runtime/runtime',
    "./src/main/main.js"
    
  ],
  target: "electron-main",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "./bundle"),
    filename: "webpack.main.js",
  },
  plugins: [new Dotenv(), new MiniCssExtractPlugin()],
  externals:{"resizeImg" : 'resize-img'}

});
const Renderer = Object.assign({}, config, {
  mode: "development",
  devtool: "inline-source-map",
  resolve: {
    extensions: [".js"],
  },
  entry:["./src/renderer/app.js"],
  target: "electron-renderer",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
     
      {
        test: /bootstrap\.js$/,
        use: 'imports-loader?jQuery=jquery,$=jquery,this=>window',
      },

      {
        test: /\.(html)$/,
        include: [path.resolve(__dirname, "./bundle")],
        use: {
          loader: "html-loader",
        },
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: true,
            },
          },
        ],
        include: /\.module\.css$/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        exclude: /\.module\.css$/,
      },
    ],
  },
  plugins: [new Dotenv(),new MiniCssExtractPlugin()],
  // externals: {
  //   "push-receiver": 'require("push-receiver")',
  // },


  output: {
    path: path.resolve(__dirname, "./bundle/js"),
    filename: "webpack.renderer.js",
  },
});
module.exports = [Main, Renderer];