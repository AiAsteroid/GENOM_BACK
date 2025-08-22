# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .

# если используете TypeScript:
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
