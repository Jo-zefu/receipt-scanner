FROM node:18-alpine

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

EXPOSE 3001

CMD ["node", "dist/index.js"]
