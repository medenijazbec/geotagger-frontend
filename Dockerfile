# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci --production=false

# Copy source & build
COPY . .
# If you have environment-specific API URLs, set them here:
# ENV REACT_APP_API_BASE_URL=https://api.medenijazbec.pro
RUN npm run build

# 2) Production webserver
FROM nginx:stable-alpine
# Remove default conf
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Expose the container port (only for other containers / NPM)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
