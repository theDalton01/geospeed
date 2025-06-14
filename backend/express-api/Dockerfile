# Build stage
FROM node:18-slim as builder

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first
COPY backend/express-api/package*.json ./

# Install dependencies - try npm ci first, fallback to npm install
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production; \
    else \
        npm install --only=production; \
    fi

# Copy source code
COPY backend/express-api ./

# Production stage
FROM node:18-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Set working directory
WORKDIR /app

# Copy only required files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Set user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port and start server
EXPOSE 3000
CMD ["node", "server.js"]
