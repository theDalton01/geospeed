const pool = require("../models/pool");
const { getClientIp } = require("../utils/helper");

const telemetryController = async (req, res, next) => {
  // Log request headers and raw body for debugging
  console.log("Telemetry request headers:", {
    contentType: req.headers["content-type"],
    userAgent: req.headers["user-agent"],
  });
  console.log("Telemetry raw body:", req.body);

  try {
    // Safely extract payload with default empty object
    let {
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

    // Log processed data
    console.log("Telemetry processed data:", {
      ip,
      ispinfo,
      extra,
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
      log,
    ];

    console.log("Executing query with values:", values);
    const result = await pool.query(query, values);
    const id = result.rows[0].id;

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
