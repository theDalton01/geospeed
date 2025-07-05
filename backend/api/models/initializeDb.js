const { Client } = require("pg");
require("dotenv").config();

// Database connection with retry logic
const initializeDatabase = async (retries = 5, delay = 5000) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  
  // seeding
  console.log("seeding...");
  await client.connect();

  for (let i = 0; i < retries; i++) {
    try {
      // Test connection
      await client.query("SELECT NOW()");
      console.log("Database connection successful");

      // Create tables
      await client.query(`
                CREATE EXTENSION IF NOT EXISTS plpgsql;
                
                CREATE TABLE IF NOT EXISTS speedtest_users (
                    id SERIAL PRIMARY KEY,
                    "timestamp" TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
                    ip TEXT NOT NULL,
                    ispinfo TEXT,
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
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
      console.log("Database tables created/checked");
      return "seeded successfully";
    } catch (err) {
      console.error(
        `Database initialization attempt ${i + 1}/${retries} failed:`,
        err.message
      );
      if (i === retries - 1) {
        console.error("All database initialization attempts failed");
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      await client.end();
    }
  }
};

module.exports = initializeDatabase;
