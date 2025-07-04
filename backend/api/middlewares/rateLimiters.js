const rateLimit = require("express-rate-limit");

// Rate limiting middleware for different routes
const defaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 API requests per window
    message: 'Too many API requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// telemetry rate limit
const telemetryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 telemetry submissions per hour
    message: 'Too many speed test submissions from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    defaultLimiter,
    apiLimiter,
    telemetryLimiter,
}