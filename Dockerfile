# Build stage
FROM node:24-alpine AS build

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

CMD ["npm", "run", "start:prod"]
