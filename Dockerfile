FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --only=production

COPY server/src ./src
COPY server/tsconfig.json ./

RUN npm install typescript tsx --save-dev && npm run build && rm -rf node_modules && npm ci --only=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
