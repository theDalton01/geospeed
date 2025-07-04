const pool = require("../models/pool");
const { parseSpeed } = require("../utils/helpers");

const averageSpeed = async (req, res, next) => {
  try {
    const { ip } = req.query;

    // Validate IP parameter
    if (ip && !ip.includes(".") && !ip.includes(":")) {
      return next(new Error("Invalid IP address format"));
    }

    const query = `
            SELECT
                AVG(dl::numeric) as avg_download,
                AVG(ul::numeric) as avg_upload,
                AVG(ping::numeric) as avg_ping
            FROM speedtest_users
            WHERE ${ip ? `ip = $1` : "true"}
        `;

    const values = ip ? [ip] : [];
    const { rows } = await pool.query(query, values);

    // Convert averages to numbers
    const averages = rows[0];
    res.json({
      avg_download: parseSpeed(averages.avg_download),
      avg_upload: parseSpeed(averages.avg_upload),
      avg_ping: parseSpeed(averages.avg_ping),
    });
  } catch (err) {
    next(new Error("Failed to calculate average speed"));
  }
};

module.exports = averageSpeed;