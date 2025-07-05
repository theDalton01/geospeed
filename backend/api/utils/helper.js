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

// Helper function to clean ISP name
const cleanIspName = (rawIspInfo) => {
    if (!rawIspInfo || !rawIspInfo.as_name) {
        return null;
    }
    const asName = rawIspInfo.as_name.toLowerCase();
    if (asName.includes('globacom')) {
        return 'GLO';
    } else if (asName.includes('mtn')) {
        return 'MTN';
    } else if (asName.includes('airtel')) {
        return 'Airtel';
    } else if (asName.includes('9mobile') || asName.includes('etisalat')) {
        return '9mobile';
    }
    return rawIspInfo.as_name; // Return original if no specific match
};

module.exports = {
    getClientIp,
    parseSpeed,
    cleanIspName,
}