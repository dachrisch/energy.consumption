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

# Install production dependencies only
RUN npm install --omit=dev

ENV PORT=80
EXPOSE 80

# Health check using node and built-in http module
HEALTHCHECK --interval=5s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "require('http').get('http://localhost:80/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["npm", "run", "start:prod"]
