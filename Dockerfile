# Multi-stage build для оптимизации размера образа

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

# Копируем package files для кеширования зависимостей
COPY web/package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники фронтенда
COPY web/ ./

# Билдим фронтенд
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/server

# Копируем package files для кеширования зависимостей
COPY server/package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники бэкенда
COPY server/ ./

# Билдим бэкенд (TypeScript -> JavaScript)
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine

WORKDIR /app

# Устанавливаем только production зависимости для бэкенда
COPY server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем собранный бэкенд из builder stage
COPY --from=backend-builder /app/server/dist ./dist

# Копируем собранный фронтенд из builder stage
COPY --from=frontend-builder /app/web/dist ./web/dist

# Копируем конфигурационный файл в папку dist (откуда его ищет приложение)
COPY server/src/docker.config.env ./dist/docker.config.env

# Создаем непривилегированного пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Экспонируем порт приложения
EXPOSE 4000

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV CONFIG_PATH=/app/config.env

# Запускаем приложение
CMD ["node", "dist/server.js"]
