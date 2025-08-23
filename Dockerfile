# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Ставим зависимости включая dev
COPY package*.json ./
RUN npm ci

# Копируем исходники и собираем
COPY . .
RUN npm run build

# --- production stage ---
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Ставим только продакшн-зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# Копируем скомпилированный код из билд-стейджа
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/index.js"]
