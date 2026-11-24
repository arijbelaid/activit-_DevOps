# ============================================================
# API Express — Image Node.js (Multi-stage)
# ============================================================

# 1. Étape de build
FROM node:22-alpine3.18 AS builder
# ⬇️ AJOUT POUR PRISMA : fournit libssl.so.1.1 ⬇️
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# 2. Étape de production
FROM node:22-alpine3.18 AS runner
# ⬇️ AJOUT POUR PRISMA : fournit libssl.so.1.1 ⬇️
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/index.js ./

# Configuration de l'utilisateur non-root (Sécurité)
USER node

EXPOSE 5000
CMD ["node", "index.js"]
