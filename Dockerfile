# Dockerfile

# Use official Node.js image
FROM node:slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Production image
FROM node:slim

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000
RUN apt -y update
RUN apt -y install curl

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["curl", "-sf", "-o", "/dev/null", "http://localhost:3000/api/health"]

CMD ["npm", "start"]
