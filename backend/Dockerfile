# Build stage
FROM node:18-slim as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with exact versions and only production
RUN npm ci --only=production

# Copy source code
COPY . .

# Production stage
FROM node:18-slim

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
