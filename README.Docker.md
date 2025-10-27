# Docker Setup для Flux Project

## Структура

Проект использует multi-stage Docker build для оптимизации:
- **Stage 1**: Сборка фронтенда (Vue.js)
- **Stage 2**: Сборка бэкенда (Node.js/TypeScript)
- **Stage 3**: Production образ с минимальными зависимостями

## Зависимости

- **PostgreSQL 16**: Реляционная база данных
- **MongoDB 7**: NoSQL база данных
- **Redis 7**: Кеш и хранилище сессий

## Быстрый старт

### Production режим

```bash
# Собрать и запустить все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановить сервисы
docker-compose down

# Остановить и удалить volumes (данные)
docker-compose down -v
```

### Development режим

Для разработки используйте `docker-compose.dev.yml` - он запускает только зависимости (БД), а приложение запускается локально:

```bash
# Запустить только БД для разработки
docker-compose -f docker-compose.dev.yml up -d

# В другом терминале запустите бэкенд локально
cd server
npm run dev

# В третьем терминале запустите фронтенд локально
cd web
npm run dev
```

## Команды

### Сборка образа

```bash
# Собрать образ приложения
docker-compose build

# Пересобрать образ без кеша
docker-compose build --no-cache
```

### Управление контейнерами

```bash
# Запустить сервисы
docker-compose up -d

# Остановить сервисы
docker-compose stop

# Перезапустить конкретный сервис
docker-compose restart app

# Удалить контейнеры
docker-compose down
```

### Логи и отладка

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f mongodb
docker-compose logs -f redis

# Войти в контейнер
docker-compose exec app sh
docker-compose exec postgres psql -U flux_user -d flux_db
docker-compose exec mongodb mongosh -u flux_user -p flux_password
docker-compose exec redis redis-cli -a flux_password
```

### Управление данными

```bash
# Посмотреть volumes
docker volume ls

# Удалить все данные (volumes)
docker-compose down -v

# Создать бэкап PostgreSQL
docker-compose exec postgres pg_dump -U flux_user flux_db > backup.sql

# Восстановить бэкап PostgreSQL
docker-compose exec -T postgres psql -U flux_user -d flux_db < backup.sql

# Создать бэкап MongoDB
docker-compose exec mongodb mongodump --username=flux_user --password=flux_password --authenticationDatabase=admin --db=flux_db --out=/tmp/backup
docker cp flux-mongodb:/tmp/backup ./mongodb-backup

# Восстановить бэкап MongoDB
docker cp ./mongodb-backup flux-mongodb:/tmp/backup
docker-compose exec mongodb mongorestore --username=flux_user --password=flux_password --authenticationDatabase=admin --db=flux_db /tmp/backup/flux_db

# удалить кэш билдов
docker builder prune --all --force
```

## Переменные окружения

Основные переменные окружения настроены в `docker-compose.yml`. Для кастомизации создайте файл `.env`:

```env
# PostgreSQL
POSTGRES_DB=flux_db
POSTGRES_USER=flux_user
POSTGRES_PASSWORD=your_secure_password

# MongoDB
MONGODB_DB=flux_db
MONGODB_USER=flux_user
MONGODB_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_secure_password

# Application
NODE_ENV=production
PORT=3000
```

## Порты

- **3000**: Приложение (API + Frontend)
- **5432**: PostgreSQL
- **27017**: MongoDB
- **6379**: Redis

## Healthchecks

Все сервисы имеют настроенные healthcheck:
- PostgreSQL: проверка готовности БД
- MongoDB: ping команда
- Redis: проверка доступности
- App: HTTP запрос на `/health` endpoint

## Продакшн рекомендации

1. **Пароли**: Измените пароли по умолчанию в production
2. **Volumes**: Настройте резервное копирование volumes
3. **Мониторинг**: Добавьте Prometheus/Grafana для мониторинга
4. **Reverse Proxy**: Используйте Nginx/Traefik перед приложением
5. **SSL/TLS**: Настройте HTTPS сертификаты
6. **Resources**: Установите лимиты CPU/Memory для контейнеров
7. **Secrets**: Используйте Docker Secrets или внешнее хранилище секретов

## Troubleshooting

### Приложение не может подключиться к БД

```bash
# Проверьте статус контейнеров
docker-compose ps

# Проверьте логи
docker-compose logs postgres
docker-compose logs mongodb
docker-compose logs redis
```

### Проблемы с правами доступа

```bash
# Пересоздать volumes
docker-compose down -v
docker-compose up -d
```

### Медленная сборка

```bash
# Очистить Docker кеш
docker system prune -a

# Пересобрать с нуля
docker-compose build --no-cache
```

## Дополнительная информация

- Образ использует Alpine Linux для минимального размера
- Multi-stage build уменьшает размер финального образа
- Приложение запускается от непривилегированного пользователя для безопасности
- Используются именованные volumes для персистентности данных
