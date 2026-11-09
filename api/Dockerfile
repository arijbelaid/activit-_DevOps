# ==========================================
# Étape 1 : Builder (Installation et Build)
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# On installe TOUTES les dépendances (y compris Prisma CLI)
RUN npm ci
# On copie Prisma et on génère le client
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .

# ==========================================
# Étape 2 : Runner (Image finale légère)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app
# On ne réinstalle que les dépendances de production
COPY package*.json ./
RUN npm ci --omit=dev
# On récupère le client Prisma généré à l'étape 1
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# On copie le code source
COPY --from=builder /app .
EXPOSE 5000
USER node
CMD ["node", "index.js"]
