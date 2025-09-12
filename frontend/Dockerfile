# --- build on Debian (more compatible) ---
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve with nginx on Alpine (keep image tiny) ---
FROM nginx:alpine
COPY nginx.default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
