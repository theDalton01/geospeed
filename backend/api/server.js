require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.set('trust proxy', 1); // Trust the first proxy

// Middleware to normalize request paths and remove duplicate slashes
app.use((req, res, next) => {
  req.url = req.path.replace(/\/+/g, '/');
  next();
});
const port = process.env.PORT || 3000;

// initDb
const initializeDatabase = require("./models/initializeDb");

// routes
const libspeedRouter = require("./routes/proxyRouter");
const telemetryRouter = require("./routes/telemetryRouter");
const healthRouter = require("./routes/healthRouter");
const apiRouter = require("./routes/apiRouter");

// middlewares
const rateLimiters = require("./middlewares/rateLimiters");
const errorHandler = require("./middlewares/errorHandler");

// CORS configuration for frontend access
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Content-Encoding",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Encoding"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiters.defaultLimiter); // Apply default rate limiting to all routes

// Apply specific rate limiters to routes
app.use("/speedtest/results", rateLimiters.telemetryLimiter);
app.use("/api", rateLimiters.apiLimiter);

// Mount Librespeed proxy for backend routes only
app.use("/speedtest/backend", libspeedRouter);

// Telemetry route with enhanced debugging
app.use("/speedtest/results", telemetryRouter);

// // API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.use("/health", healthRouter);

// Apply error handling middleware
app.use(errorHandler);

// Start server and initialize database
let server;
(async () => {
  try {
    await initializeDatabase(); // Seed tables and test DB connection
    console.log("Database ready");

    // Now start server
    server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Database failed to initialize:", err.message);
    process.exit(1); // Exit if DB fails hard
  }
})();

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("Received shutdown signal, closing server...");
  if (server) {
    server.close(() => {
      console.log("Server closed");
      const pool = require("./models/pool");
      if (pool) {
        pool.end(() => {
          console.log("Database pool closed");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
