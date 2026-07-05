# QuestXLM Frontend Dockerfile
# Multi-stage build for production optimization

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Add package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ARG NEXT_PUBLIC_NETWORK=TESTNET
ARG NEXT_PUBLIC_ORACLE_URL

ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_NETWORK=$NEXT_PUBLIC_NETWORK
ENV NEXT_PUBLIC_ORACLE_URL=$NEXT_PUBLIC_ORACLE_URL

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["node", "server.js"]