# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files first for caching
# NOTE: The context is the root of the monorepo, so we copy from frontend/
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy source code
COPY frontend/ .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY ops/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
