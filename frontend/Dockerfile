# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# 默认走同源的 /api，由下面的 nginx 反代到后端；和 README 里写的默认值一致
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
