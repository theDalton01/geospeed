import { merge } from "webpack-merge";
import common from "./webpack.common.js";

export default merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    watchFiles: ["./src/template.html"],
    open: true,
    hot: true,
    port: 8888,
  },
});
