require("dotenv").config();
const { createProxyMiddleware } = require("http-proxy-middleware");

// Proxy configuration for Librespeed backend routes (excluding telemetry)
const LIBRESPEED_HOST = process.env.LIBRESPEED_HOST;
const LIBRESPEED_PORT = process.env.LIBRESPEED_PORT;
const LIBRESPEED_URL = `http://${LIBRESPEED_HOST}:${LIBRESPEED_PORT}`;

// Configure proxy middleware for backend routes (e.g., /backend/garbage.php)
const libspeedProxy = createProxyMiddleware({
  target: LIBRESPEED_URL,
  changeOrigin: true,
  pathRewrite: {
    //'^/speedtest/backend': '/backend',
    "^/speedtest/backend": "",
  },
  onProxyRes: (proxyRes, req, res) => {
    // Set CORS headers for the response from the upstream service
    const origin = req.headers.origin;
    if (origin) {
      proxyRes.headers["Access-Control-Allow-Origin"] = origin;
    }
    proxyRes.headers["Access-Control-Allow-Credentials"] = "true";
  },
  onError: (err, req, res) => {
    console.error("Proxy Error:", err);
    res.status(502).json({
      error: "Bad Gateway",
      message: "Failed to proxy request to Librespeed service",
    });
  },
  logLevel: process.env.NODE_ENV === "development" ? "debug" : "error",
});

module.exports = libspeedProxy;
