const pool = require("../models/pool");
const { getClientIp, cleanIspName } = require("../utils/helper");

const telemetryController = async (req, res, next) => {
  // Log request headers and raw body for debugging
  console.log("Telemetry request headers:", {
    contentType: req.headers["content-type"],
    userAgent: req.headers["user-agent"],
  });
  console.log("Telemetry raw body:", req.body);

  try {
    // Safely extract payload with default empty object
    const {
      ispinfo = "",
      dl = "",
      ul = "",
      ping = "",
      jitter = "",
      log = "",
      extra = "",
      ip: clientIp = "",
    } = req.body || {};
    const ua = req.headers["user-agent"] || "";
    const lang = req.headers["accept-language"] || "";
    let ip = clientIp || getClientIp(req);

    // Safely parse the extra field to extract latitude and longitude
    let latitude = null;
    let longitude = null;
    try {
      if (extra && extra.trim() !== '') {
        const extraData = JSON.parse(extra);
        if (extraData && typeof extraData === 'object') {
          // More robust parsing with validation
          const lat = parseFloat(extraData.latitude);
          const lng = parseFloat(extraData.longitude);

          // Validate that we have valid coordinates
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            latitude = lat;
            longitude = lng;
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse extra data:", e);
    }

    // Parse ispinfo and clean it
    let cleanedIspInfo = null;
    try {
      const parsedIspInfo = JSON.parse(ispinfo);
      if (parsedIspInfo && parsedIspInfo.rawIspInfo) {
        cleanedIspInfo = cleanIspName(parsedIspInfo.rawIspInfo);
      }
    } catch (e) {
      console.error("Failed to parse ispinfo:", e);
    }

    // Log processed data
    console.log("Telemetry processed data:", {
      ip,
      ispinfo: cleanedIspInfo,
      latitude,
      longitude,
      ua,
      lang,
      dl,
      ul,
      ping,
      jitter,
      log,
    });

    // IP redaction logic
    const redactIpAddresses = false;
    if (redactIpAddresses) {
      ip = "0.0.0.0";
      const ipv4Regex =
        /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;
      const ipv6Regex =
        /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/g;
      const hostnameRegex = /"hostname":"([^\\"]|\\")*"/g;
      ispinfo = ispinfo
        .replace(ipv4Regex, "0.0.0.0")
        .replace(ipv6Regex, "0.0.0.0")
        .replace(hostnameRegex, '"hostname":"REDACTED"');
      log = log
        .replace(ipv4Regex, "0.0.0.0")
        .replace(ipv6Regex, "0.0.0.0")
        .replace(hostnameRegex, '"hostname":"REDACTED"');
    }

    // Insert data with PostGIS location
    const query = `
            INSERT INTO speedtest_users (timestamp, ip, ispinfo, latitude, longitude, location, ua, lang, dl, ul, ping, jitter, log)
            VALUES (NOW(), $1, $2, $3, $4, 
                    CASE 
                        WHEN $3 IS NOT NULL AND $4 IS NOT NULL 
                        THEN ST_Point($4::decimal, $3::decimal)::geography 
                        ELSE NULL 
                    END, 
                    $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `;
    const values = [
      ip,
      cleanedIspInfo,
      latitude,
      longitude,
      ua,
      lang,
      dl.toString(),
      ul.toString(),
      ping.toString(),
      jitter.toString(),
      log,
    ];

    console.log("Executing query with values:", values);
    console.log("PostGIS location will be created:", latitude !== null && longitude !== null ? `ST_Point(${longitude}, ${latitude})` : "NULL");
    const result = await pool.query(query, values);
    const id = result.rows[0].id;

    // Verify the location was stored correctly
    if (latitude !== null && longitude !== null) {
      const verifyQuery = "SELECT ST_AsText(location) as location_text FROM speedtest_users WHERE id = $1";
      const verifyResult = await pool.query(verifyQuery, [id]);
      console.log("Stored PostGIS location:", verifyResult.rows[0]?.location_text);
    }

    // Set no-cache headers
    res.set({
      "Cache-Control":
        "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
      Pragma: "no-cache",
    });

    // Return id
    res.send(`id ${id}`);
  } catch (err) {
    console.error("Telemetry error details:", {
      message: err.message,
      stack: err.stack,
      requestBody: req.body,
    });
    // Use plain Error instead of createError
    next(new Error("Failed to save telemetry data"));
  }
};

module.exports = telemetryController;
