FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=base /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]