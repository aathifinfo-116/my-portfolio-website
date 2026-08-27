# --- Stage 1: Build NestJS App ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: Production Execution ---
FROM node:20-alpine AS runner
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory dynamically so static uploads work
RUN mkdir -p /app/uploads

EXPOSE 4000

CMD ["node", "dist/main.js"]