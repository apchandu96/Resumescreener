# --- install deps ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# If your entry isn’t server.js, change it (e.g., index.js)
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
