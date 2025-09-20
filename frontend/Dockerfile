# --- serve with nginx ---
FROM nginx:alpine

# Use our single nginx.conf (no default.conf)
COPY nginx/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /etc/nginx/conf.d && rm -f /etc/nginx/conf.d/*

# App static files
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP + HTTPS (nginx will listen on 80/443 per nginx.conf)
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
