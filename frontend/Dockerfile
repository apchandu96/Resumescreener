# --- build stage (Node) ---
FROM node:20-alpine AS build
WORKDIR /app

# Optional: fixes some native deps on Alpine
RUN apk add --no-cache libc6-compat

# Install deps
COPY package*.json ./
RUN npm ci

# Build
COPY . .

RUN npm run build

# --- serve with nginx (runtime) ---
FROM nginx:alpine

# If you keep Nginx config inside the image:
# (These will be overridden if you mount your own configs in docker-compose)
COPY nginx/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /etc/nginx/conf.d && rm -f /etc/nginx/conf.d/*

# Static files produced by the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP + HTTPS (Nginx listens per nginx.conf)
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
