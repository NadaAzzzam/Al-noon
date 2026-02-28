# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Build the application
COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM node:22-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S angular -u 1001 -G nodejs

# Copy built artifacts from build stage
COPY --from=build --chown=angular:nodejs /app/dist/al-noon-store ./dist

USER angular

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "dist/server/server.mjs"]
