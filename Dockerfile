# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

# Set the maximum memory limit for the node process
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the SvelteKit app
RUN pnpm build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:22-alpine AS runner

# Install curl and wget for Coolify healthchecks, and enable pnpm for db scripts
RUN apk add --no-cache curl wget && \
    corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

# Copy built application
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./

# Copy node_modules (keep all deps for drizzle-kit)
COPY --from=builder --chown=sveltekit:nodejs /app/node_modules ./node_modules

# Copy Drizzle configuration and schema files
COPY --from=builder --chown=sveltekit:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=sveltekit:nodejs /app/tsconfig.json ./
COPY --from=builder --chown=sveltekit:nodejs /app/src/lib/server/db ./src/lib/server/db
COPY --from=builder --chown=sveltekit:nodejs /app/src/lib/types ./src/lib/types

# Switch to non-root user
USER sveltekit

# Expose the port (SvelteKit adapter-node defaults to 3000)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#     CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "build"]