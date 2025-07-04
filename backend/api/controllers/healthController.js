const pool = require("../models/pool");

const healthController = async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      database: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = healthController;