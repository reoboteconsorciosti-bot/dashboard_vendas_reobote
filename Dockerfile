FROM node:20-alpine AS base

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Ensure we are in development mode to install devDependencies (Prisma CLI)
ENV NODE_ENV=development

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Force install of ALL dependencies (including dev) to ensure prisma CLI exists
RUN npm install

COPY . .

# Generate Prisma Client explicitly
# This uses the locally installed prisma from devDependencies
RUN npx prisma generate

# Build Next.js
# Note: we don't set NODE_ENV=production here yet because some build tools might need dev deps, 
# although Next.js usually handles it. 
# But to be safe and standard, we can leave it or set it. 
# Next.js build script usually sets production.
RUN npm run build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD npx prisma@5.22.0 db push --accept-data-loss --skip-generate && node server.js
