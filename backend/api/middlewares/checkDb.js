const pool = require("../models/pool");

module.exports = async (req, res, next) => {
  try {
    await pool.query("SELECT NOW()");
    return next();
  } catch (err) {
    console.error("DB check failed:", err.message);
    return next(new Error("Database not reachable"));
  }
};
