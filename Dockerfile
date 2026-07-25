# Multi-stage Dockerfile for Evently Full-Stack Web Application

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Production Server
FROM node:22-alpine AS runner
WORKDIR /app/server
COPY server/package.json server/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod
COPY server/ ./
COPY --from=frontend-builder /app/dist ./public

EXPOSE 5001
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
