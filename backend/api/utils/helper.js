// Helper function to get client IP
const getClientIp = (req) => {
    let ip = req.headers['client-ip'] ||
             req.headers['x-real-ip'] ||
             req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.ip ||
             req.connection.remoteAddress;
    return ip ? ip.replace(/^::ffff:/, '') : '0.0.0.0';
};

// Helper function to parse speed values
const parseSpeed = (speed) => {
    if (!speed) return 0;
    const value = parseFloat(speed);
    return isNaN(value) ? 0 : value;
};

module.exports = {
    getClientIp,
    parseSpeed,
}