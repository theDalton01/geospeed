FROM ghcr.io/librespeed/speedtest:latest

# Set all environment variables in one layer
ENV MODE=backend \
    BACKENDPORT=8081 \
    TELEMETRY_LEVEL=basic \
    DB_TYPE=postgres \
    DB_TABLE=speedtest_users \
    TELEMETRY_INTERVAL=60 \
    TELEMETRY_RETENTION=30 \
    TELEMETRY_MAX_ROWS=1000000 \
    TELEMETRY_CLEANUP_INTERVAL=24

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Expose backend port
EXPOSE 8081
