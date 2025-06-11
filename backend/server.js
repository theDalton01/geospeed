require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const { createError } = require('http-errors');

const app = express();
const port = process.env.PORT || 3000;

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*', // Replace with your frontend URL when ready
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter); // Apply rate limiting

// Database connection with retry logic
const initializeDatabase = async (retries = 5, delay = 5000) => {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
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

// Helper function to parse speed values
const parseSpeed = (speed) => {
    if (!speed) return 0;
    const value = parseFloat(speed);
    return isNaN(value) ? 0 : value;
};

// API Routes
app.get('/api/speed-tests', async (req, res, next) => {
    if (!pool) {
        return next(createError(503, 'Database not initialized'));
    }

    try {
        const { ip, limit = 100 } = req.query;
        
        // Validate limit parameter
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return next(createError(400, 'Invalid limit parameter'));
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
        next(createError(500, 'Failed to fetch speed tests', { cause: err }));
    }
});

app.get('/api/average-speed', async (req, res, next) => {
    if (!pool) {
        return next(createError(503, 'Database not initialized'));
    }

    try {
        const { ip } = req.query;
        
        // Validate IP parameter
        if (ip && (!ip.includes('.') && !ip.includes(':'))) {
            return next(createError(400, 'Invalid IP address format'));
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
        next(createError(500, 'Failed to calculate average speed', { cause: err }));
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

// Apply error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
