# QuestXLM Oracle Dockerfile
# Production-ready containerization with security hardening

FROM node:18-alpine AS base

# Install security updates and necessary packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S oracle && \
    adduser -S oracle -u 1001 -G oracle

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Production stage
FROM base AS production

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY --chown=oracle:oracle . .

# Create necessary directories
RUN mkdir -p logs cache && \
    chown -R oracle:oracle /app

# Switch to non-root user
USER oracle

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]