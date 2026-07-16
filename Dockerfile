FROM node:22-alpine

WORKDIR /app

# Copy and install all dependencies (including dev for build)
COPY server/package*.json ./
RUN npm ci

# Copy source and build
COPY server/src ./src
COPY server/tsconfig.json ./
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
