# Multi-stage build for optimized image
FROM nginx:alpine

# Install necessary packages
RUN apk add --no-cache \
    curl \
    ca-certificates

# Copy game files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY game-logic.js /usr/share/nginx/html/
COPY ai-opponent.js /usr/share/nginx/html/
COPY 3d-renderer.js /usr/share/nginx/html/
COPY llm-integration.js /usr/share/nginx/html/
COPY main.js /usr/share/nginx/html/
COPY LICENSE /usr/share/nginx/html/
COPY README.md /usr/share/nginx/html/
COPY PROJECT_DOCUMENTATION.html /usr/share/nginx/html/

# Create nginx config for single page app
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Labels for documentation
LABEL maintainer="dorialn68"
LABEL version="1.0.0"
LABEL description="3D Checkers Pro - AI-Powered Checkers Game"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]