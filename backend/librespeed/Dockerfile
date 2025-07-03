FROM php:8-apache

# Install php-extension-installer and required extensions
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN install-php-extensions iconv gd pdo pdo_mysql pdo_pgsql pgsql

# Clean up to reduce image size
RUN rm -f /usr/src/php.tar.xz /usr/src/php.tar.xz.asc \
    && apt autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
RUN mkdir -p /speedtest
WORKDIR /speedtest

# Copy necessary files
COPY backend/ /speedtest/backend/
COPY results/ /speedtest/results/
COPY *.js /speedtest/
COPY favicon.ico /speedtest/
COPY docker/servers.json /speedtest/
COPY docker/*.php /speedtest/
COPY docker/entrypoint.sh /

# Ensure entrypoint is executable
RUN chmod +x /entrypoint.sh

# Set environment variables for backend mode with telemetry enabled
ENV TITLE=LibreSpeed
ENV MODE=backend
ENV TELEMETRY=true
ENV ENABLE_ID_OBFUSCATION=false
ENV REDACT_IP_ADDRESSES=false
ENV WEBPORT=8081
ENV TELEMETRY_LEVEL=basic
ENV DB_TYPE=postgresql
ENV DB_TABLE=speedtest_users
ENV TELEMETRY_INTERVAL=60
ENV TELEMETRY_RETENTION=30
ENV TELEMETRY_MAX_ROWS=1000000
ENV TELEMETRY_CLEANUP_INTERVAL=24
# Sensitive variables to be set in Railway dashboard
ENV PASSWORD=
ENV EMAIL=
ENV IPINFO_APIKEY=
ENV DB_HOSTNAME=
ENV DB_USER=
ENV DB_PASSWORD=
ENV DB_NAME=

# Handle graceful shutdown
STOPSIGNAL SIGWINCH

# Expose the configured port
EXPOSE ${WEBPORT}

# Add simple health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD nc -z localhost ${WEBPORT} || exit 1

# Run the entrypoint script
CMD ["bash", "/entrypoint.sh"]