const pool = require("../models/pool");
const { parseSpeed } = require("../utils/helper");

const averageSpeed = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    // Validate latitude and longitude parameters
    if (!latitude || !longitude) {
      return next(new Error("Latitude and Longitude are required."));
    }

    const query = `
            SELECT
                ispinfo,
                AVG(dl::numeric) as avg_download,
                AVG(ul::numeric) as avg_upload,
                COUNT(*) as entry_count
            FROM speedtest_users
            WHERE latitude = $1 AND longitude = $2
            GROUP BY ispinfo;
        `;

    const values = [latitude, longitude];
    const { rows } = await pool.query(query, values);

    const result = rows.map((row) => {
      if (row.entry_count < 20) {
        return {
          ispinfo: row.ispinfo,
          average_download: "Not Enough Data",
          average_upload: "Not Enough Data",
        };
      } else {
        return {
          ispinfo: row.ispinfo,
          average_download: parseSpeed(row.avg_download),
          average_upload: parseSpeed(row.avg_upload),
        };
      }
    });

    res.json(result);
  } catch (err) {
    next(new Error("Failed to calculate average speed"));
  }
};

module.exports = averageSpeed;