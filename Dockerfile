# Build stage
FROM node:24-alpine AS build

# Accept version as build argument
ARG VITE_BUILD_VERSION=dev
ENV VITE_BUILD_VERSION=${VITE_BUILD_VERSION}

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy built assets
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/package*.json ./
COPY healthcheck.js ./healthcheck.js

# Install production dependencies only
RUN npm install --omit=dev

ENV PORT=80
EXPOSE 80

# Health check using dedicated Node.js script
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "run", "start:prod"]
