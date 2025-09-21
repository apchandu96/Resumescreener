# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # must produce /app/dist

# --- runtime (nginx) ---
FROM nginx:alpine
# Do NOT copy nginx.conf here; compose mounts your config at runtime.
RUN mkdir -p /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
