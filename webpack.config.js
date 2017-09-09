const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js"
  },
  devtool: "#eval-source-map",
  plugins: [
    new HtmlWebpackPlugin({
      title: "Bullet Hell Defense",
      template: "./src/index.ejs"
    })
  ]
};
