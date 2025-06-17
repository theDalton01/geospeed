require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;
const upload = multer();

// Proxy configuration for Librespeed backend routes (excluding telemetry)
const LIBRESPEED_HOST = process.env.LIBRESPEED_HOST;
const LIBRESPEED_PORT = process.env.LIBRESPEED_PORT;
const LIBRESPEED_URL = `http://${LIBRESPEED_HOST}:${LIBRESPEED_PORT}`;

// Configure proxy middleware for backend routes (e.g., /backend/garbage.php)
const libspeedProxy = createProxyMiddleware({
    target: LIBRESPEED_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/speedtest/backend': '/backend',
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(502).json({
            error: 'Bad Gateway',
            message: 'Failed to proxy request to Librespeed service'
        });
    },
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
});

// Rate limiting middleware for different routes
const defaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const telemetryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 telemetry submissions per hour
    message: 'Too many speed test submissions from this IP, please try again later.',
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

// CORS configuration for frontend access
const corsOptions = {
    origin: process.env.FRONTEND_URL || "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Content-Encoding',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Encoding'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(defaultLimiter); // Apply default rate limiting to all routes

// Apply specific rate limiters to routes
app.use('/speedtest/results/telemetry.php', telemetryLimiter);
app.use('/api', apiLimiter);

// Mount Librespeed proxy for backend routes only
app.use('/speedtest/backend', libspeedProxy);

// Database connection with retry logic
const initializeDatabase = async (retries = 5, delay = 5000) => {
    // Use DATABASE_URL if available, otherwise fall back to individual credentials
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    for (let i = 0; i < retries; i++) {
        try {
            // Test connection
            await pool.query('SELECT NOW()');
            console.log('Database connection successful');

            // Create tables
            await pool.query(`
                CREATE EXTENSION IF NOT EXISTS plpgsql;
                
                CREATE TABLE IF NOT EXISTS speedtest_users (
                    id SERIAL PRIMARY KEY,
                    "timestamp" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
                    ip TEXT NOT NULL,
                    ispinfo TEXT,
                    extra TEXT,
                    ua TEXT NOT NULL,
                    lang TEXT NOT NULL,
                    dl TEXT,
                    ul TEXT,
                    ping TEXT,
                    jitter TEXT,
                    log TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_speedtest_users_timestamp ON speedtest_users("timestamp");
                CREATE INDEX IF NOT EXISTS idx_speedtest_users_ip ON speedtest_users(ip);
            `);
            console.log('Database tables created/checked');
            return pool;
        } catch (err) {
            console.error(`Database initialization attempt ${i + 1}/${retries} failed:`, err.message);
            if (i === retries - 1) {
                console.error('All database initialization attempts failed');
                throw err;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Initialize database connection
let pool;
initializeDatabase()
    .then(p => {
        pool = p;
        console.log('Database initialization complete');
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
        // Don't exit the process, let the health check handle it
    });

// Helper function to parse speed values
const parseSpeed = (speed) => {
    if (!speed) return 0;
    const value = parseFloat(speed);
    return isNaN(value) ? 0 : value;
};

// Helper function to get client IP
const getClientIp = (req) => {
    let ip = req.headers['client-ip'] ||
             req.headers['x-real-ip'] ||
             req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.ip ||
             req.connection.remoteAddress;
    return ip ? ip.replace(/^::ffff:/, '') : '0.0.0.0';
};

// Telemetry route with enhanced debugging
app.post('/speedtest/results/telemetry.php', upload.none(), async (req, res, next) => {
    // Log request headers and raw body for debugging
    console.log('Telemetry request headers:', {
        contentType: req.headers['content-type'],
        userAgent: req.headers['user-agent']
    });
    console.log('Telemetry raw body:', req.body);

    // Ensure database is initialized
    if (!pool) {
        console.error('Telemetry error: Database pool not initialized');
        return next(new Error('Database not initialized')); // Use plain Error
    }

    try {
        // Safely extract payload with default empty object
        let { ispinfo = '', dl = '', ul = '', ping = '', jitter = '', log = '', extra = '', ip: clientIp = '' } = req.body || {};
        const ua = req.headers['user-agent'] || '';
        const lang = req.headers['accept-language'] || '';
        let ip = clientIp || getClientIp(req);

        // Log processed data
        console.log('Telemetry processed data:', { ip, ispinfo, extra, ua, lang, dl, ul, ping, jitter, log });

        // IP redaction logic
        const redactIpAddresses = false;
        if (redactIpAddresses) {
            ip = '0.0.0.0';
            const ipv4Regex = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;
            const ipv6Regex = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/g;
            const hostnameRegex = /"hostname":"([^\\"]|\\")*"/g;
            ispinfo = ispinfo
                .replace(ipv4Regex, '0.0.0.0')
                .replace(ipv6Regex, '0.0.0.0')
                .replace(hostnameRegex, '"hostname":"REDACTED"');
            log = log
                .replace(ipv4Regex, '0.0.0.0')
                .replace(ipv6Regex, '0.0.0.0')
                .replace(hostnameRegex, '"hostname":"REDACTED"');
        }

        // Insert data
        const query = `
            INSERT INTO speedtest_users (timestamp, ip, ispinfo, extra, ua, lang, dl, ul, ping, jitter, log)
            VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `;
        const values = [
            ip,
            ispinfo,
            extra,
            ua,
            lang,
            dl.toString(),
            ul.toString(),
            ping.toString(),
            jitter.toString(),
            log
        ];

        console.log('Executing query with values:', values);
        const result = await pool.query(query, values);
        const id = result.rows[0].id;

        // Set no-cache headers
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
            'Pragma': 'no-cache'
        });

        // Return id
        res.send(`id ${id}`);
    } catch (err) {
        console.error('Telemetry error details:', {
            message: err.message,
            stack: err.stack,
            requestBody: req.body
        });
        // Use plain Error instead of createError
        next(new Error('Failed to save telemetry data'));
    }
});

// API Routes
app.get('/api/speed-tests', async (req, res, next) => {
    if (!pool) {
        return next(new Error('Database not initialized'));
    }

    try {
        const { ip, limit = 100 } = req.query;
        
        // Validate limit parameter
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return next(new Error('Invalid limit parameter'));
        }

        const query = `
            SELECT 
                id, 
                "timestamp" as timestamp,
                ip,
                ispinfo,
                extra,
                ua,
                lang,
                dl::numeric as download,
                ul::numeric as upload,
                ping::numeric as ping,
                jitter::numeric as jitter
            FROM speedtest_users
            WHERE ${ip ? `ip = $1` : 'true'}
            ORDER BY "timestamp" DESC
            LIMIT $2
        `;
        
        const values = ip ? [ip, parsedLimit] : [parsedLimit];
        const { rows } = await pool.query(query, values);
        
        // Convert speed values to numbers
        const formattedResults = rows.map(row => ({
            ...row,
            download: parseSpeed(row.download),
            upload: parseSpeed(row.upload),
            ping: parseSpeed(row.ping),
            jitter: parseSpeed(row.jitter)
        }));
        
        res.json(formattedResults);
    } catch (err) {
        next(new Error('Failed to fetch speed tests'));
    }
});

app.get('/api/average-speed', async (req, res, next) => {
    if (!pool) {
        return next(new Error('Database not initialized'));
    }

    try {
        const { ip } = req.query;
        
        // Validate IP parameter
        if (ip && (!ip.includes('.') && !ip.includes(':'))) {
            return next(new Error('Invalid IP address format'));
        }

        const query = `
            SELECT 
                AVG(dl::numeric) as avg_download,
                AVG(ul::numeric) as avg_upload,
                AVG(ping::numeric) as avg_ping
            FROM speedtest_users
            WHERE ${ip ? `ip = $1` : 'true'}
        `;
        
        const values = ip ? [ip] : [];
        const { rows } = await pool.query(query, values);
        
        // Convert averages to numbers
        const averages = rows[0];
        res.json({
            avg_download: parseSpeed(averages.avg_download),
            avg_upload: parseSpeed(averages.avg_upload),
            avg_ping: parseSpeed(averages.avg_ping)
        });
    } catch (err) {
        next(new Error('Failed to calculate average speed'));
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        if (!pool) {
            throw new Error('Database not initialized');
        }
        await pool.query('SELECT 1');
        res.json({ 
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            database: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Custom error handler
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    
    // Handle database errors
    if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
            error: 'Duplicate entry',
            message: 'This entry already exists in the database'
        });
    }
    
    // Handle rate limit errors
    if (error.message === 'Too many requests from this IP, please try again later.') {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: error.message
        });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            message: error.message
        });
    }
    
    // Default error handling
    res.status(error.status || 500).json({
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
};

// Apply error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});