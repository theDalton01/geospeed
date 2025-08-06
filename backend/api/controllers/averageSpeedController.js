const pool = require("../models/pool");
const { parseSpeed } = require("../utils/helper");

// Beta test locations for FUTA
const BETA_LOCATIONS = [
  {
    name: "School of Engineering and Engineering Technology, FUTA (SEET)",
    shortName: "SEET",
    latitude: 7.30334,
    longitude: 5.13612
  },
  {
    name: "School of Agriculture and Agricultural Engineering, FUTA (SAAT)",
    shortName: "SAAT",
    latitude: 7.30176,
    longitude: 5.13923
  },
  {
    name: "School of Computing, FUTA (SOC)",
    shortName: "SOC",
    latitude: 7.30000, // Placeholder value
    longitude: 5.13500 // Placeholder value
  },
  {
    name: "Test Hostel Location",
    shortName: "HOSTEL",
    latitude: 7.2872622,
    longitude: 5.1417408
  }
];

// Major Nigerian ISPs to always include in results
const MAJOR_ISPS = [
  "MTN",
  "Airtel",
  "Glo",
  "9mobile"
];

const averageSpeed = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    // Validate latitude and longitude parameters
    if (!latitude || !longitude) {
      return next(new Error("Latitude and Longitude are required."));
    }

    const queryLat = parseFloat(latitude);
    const queryLng = parseFloat(longitude);

    // Check if the query location matches any of our beta locations
    const matchingLocation = BETA_LOCATIONS.find(location =>
      Math.abs(location.latitude - queryLat) < 0.001 &&
      Math.abs(location.longitude - queryLng) < 0.001
    );

    if (!matchingLocation) {
      return res.json([]);
    }

    // Use PostGIS to find all speed tests within 200 meters of the beta location
    const query = `
            SELECT
                ispinfo,
                AVG(dl::numeric) as avg_download,
                AVG(ul::numeric) as avg_upload,
                COUNT(*) as entry_count
            FROM speedtest_users
            WHERE location IS NOT NULL 
            AND ST_DWithin(
                location,
                ST_Point($2, $1)::geography,
                200
            )
            AND ispinfo IS NOT NULL
            GROUP BY ispinfo;
        `;

    const values = [queryLat, queryLng];
    const { rows } = await pool.query(query, values);

    // Create a map of ISP data from database results
    const ispDataMap = new Map();
    rows.forEach((row) => {
      // Extract ISP name from ispinfo (handle various formats)
      let ispName = row.ispinfo;

      // Try to extract ISP name from common formats
      if (typeof ispName === 'string') {
        // Handle formats like "IP - ISP NAME Communication Limited, Nigeria"
        const match = ispName.match(/\d+\.\d+\.\d+\.\d+\s*-\s*(.+?)(?:\s*Communication\s*Limited)?,\s*Nigeria/i);
        if (match && match[1]) {
          ispName = match[1].trim();
        }

        // Clean up common suffixes
        ispName = ispName
          .replace(/Communication\s*Limited/gi, '')
          .replace(/,\s*Nigeria/gi, '')
          .replace(/^\d+\.\d+\.\d+\.\d+\s*-\s*/, '')
          .trim();
      }

      // Map the cleaned name to a major ISP if possible
      const majorIsp = MAJOR_ISPS.find(isp =>
        ispName.toLowerCase().includes(isp.toLowerCase()) ||
        isp.toLowerCase().includes(ispName.toLowerCase())
      );

      const finalIspName = majorIsp || ispName;

      if (row.entry_count < 20) {
        ispDataMap.set(finalIspName, {
          ispinfo: finalIspName,
          average_download: "Not Enough Data",
          average_upload: "Not Enough Data",
        });
      } else {
        ispDataMap.set(finalIspName, {
          ispinfo: finalIspName,
          average_download: parseSpeed(row.avg_download),
          average_upload: parseSpeed(row.avg_upload),
        });
      }
    });

    // Ensure all major ISPs are included in the result
    const result = [];

    // Add major ISPs that have data or mark them as "Not Enough Data"
    MAJOR_ISPS.forEach(isp => {
      if (ispDataMap.has(isp)) {
        result.push(ispDataMap.get(isp));
      } else {
        result.push({
          ispinfo: isp,
          average_download: "Not Enough Data",
          average_upload: "Not Enough Data",
        });
      }
    });

    // Add any other ISPs found in the data that aren't in the major ISPs list
    ispDataMap.forEach((data, ispName) => {
      if (!MAJOR_ISPS.includes(ispName)) {
        result.push(data);
      }
    });

    res.json(result);
  } catch (err) {
    console.error("Average speed calculation error:", err);
    next(new Error("Failed to calculate average speed"));
  }
};

module.exports = averageSpeed;