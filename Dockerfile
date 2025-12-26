FROM node:20-alpine AS base

# CORREÇÃO CRÍTICA: Instala OpenSSL na imagem base
# Assim ele fica disponível tanto no Builder quanto no Runner
RUN apk add --no-cache openssl libc6-compat

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Ensure we are in development mode to install devDependencies (Prisma CLI)
ENV NODE_ENV=development

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Force install of ALL dependencies (including dev)
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
# O Prisma Client gerado será usado aqui durante a geração estática
RUN npm run build

FROM base AS runner
WORKDIR /app

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

# Copia o schema e migrations para garantir que o prisma db push funcione
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usamos a flag --skip-generate pois o client já foi gerado no builder e copiado via standalone
CMD npx prisma db push --accept-data-loss --skip-generate && node server.js
