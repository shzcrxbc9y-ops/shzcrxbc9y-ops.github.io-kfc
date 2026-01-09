# Инструкция по деплою на Netlify

## ⚠️ Важно: SQLite не работает на Netlify

Текущая конфигурация использует SQLite, который **не работает** на Netlify, так как файловая система доступна только для чтения.

## Решение: Использовать облачную базу данных

### Вариант 1: Neon (PostgreSQL) - Рекомендуется

1. **Создайте аккаунт на [Neon](https://neon.tech/)**
   - Зарегистрируйтесь на https://neon.tech
   - Создайте новый проект
   - Скопируйте строку подключения (Connection String)

2. **Обновите схему Prisma для PostgreSQL:**
   
   Откройте `prisma/schema.prisma` и измените:
   ```prisma
   datasource db {
     provider = "postgresql"  // Измените с "sqlite" на "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Настройте переменные окружения на Netlify:**
   - Зайдите в настройки вашего сайта на Netlify
   - Перейдите в "Site settings" → "Environment variables"
   - Добавьте:
     - `DATABASE_URL` = ваша строка подключения от Neon (например: `postgresql://user:password@host/database?sslmode=require`)
     - `JWT_SECRET` = случайная строка для JWT токенов
     - `NEXTAUTH_URL` = URL вашего сайта на Netlify (например: `https://your-site.netlify.app`)

4. **Примените миграции:**
   ```bash
   npx prisma db push
   ```

5. **Заполните базу данных:**
   ```bash
   npm run db:seed
   ```

### Вариант 2: Supabase (PostgreSQL)

1. Создайте проект на [Supabase](https://supabase.com/)
2. Получите строку подключения из настроек проекта
3. Следуйте шагам 2-5 из варианта 1

### Вариант 3: PlanetScale (MySQL)

1. Создайте аккаунт на [PlanetScale](https://planetscale.com/)
2. Измените провайдер в `schema.prisma` на `mysql`
3. Следуйте аналогичным шагам

## Настройка Netlify

1. **Подключите репозиторий:**
   - Зайдите на [Netlify](https://app.netlify.com/)
   - Нажмите "Add new site" → "Import an existing project"
   - Подключите ваш Git репозиторий

2. **Настройки сборки:**
   - Build command: `npm run build` (уже настроено в `netlify.toml`)
   - Publish directory: `.next` (уже настроено в `netlify.toml`)

3. **Переменные окружения:**
   Убедитесь, что добавлены все необходимые переменные:
   - `DATABASE_URL` - строка подключения к базе данных
   - `JWT_SECRET` - секретный ключ для JWT
   - `NEXTAUTH_URL` - URL вашего сайта

4. **Деплой:**
   - Нажмите "Deploy site"
   - Дождитесь завершения сборки

## Проверка после деплоя

1. Откройте ваш сайт на Netlify
2. Попробуйте зарегистрироваться или войти
3. Проверьте, что данные сохраняются в базе данных

## Локальная разработка с PostgreSQL

Если вы переключились на PostgreSQL, обновите `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kfc_training?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

## Миграции базы данных

После изменения схемы Prisma:

```bash
# Сгенерировать Prisma клиент
npx prisma generate

# Применить изменения к БД
npx prisma db push

# Или создать миграцию
npx prisma migrate dev --name your_migration_name
```

## Полезные ссылки

- [Neon Documentation](https://neon.tech/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Netlify Next.js Guide](https://docs.netlify.com/integrations/frameworks/nextjs/)
