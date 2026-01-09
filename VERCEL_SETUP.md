# Инструкция по настройке Vercel

## Проблема
Vercel не поддерживает SQLite для продакшена. Нужна PostgreSQL база данных.

## Решение

### 1. Создайте PostgreSQL базу данных

**Вариант A: Neon (рекомендуется, бесплатно)**
1. Перейдите на https://neon.tech
2. Создайте бесплатный аккаунт
3. Создайте новый проект
4. **Найдите DATABASE_URL:**
   - На главной странице проекта найдите раздел **"Подключитесь к своей базе данных"**
   - Нажмите на **"Строка соединения"** или иконку копирования рядом
   - **ВАЖНО: Для Vercel используйте "Pooled connection" (пулинг соединений)**
   - Если видите выбор между "Session mode" и "Transaction mode" или "Pooled" - выберите **"Pooled"** или **"Transaction mode"**
   - Строка будет выглядеть как: `postgresql://user:password@ep-xxx-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`
   - Обратите внимание на **`-pooler`** в адресе - это означает, что используется пулинг
   
   **Почему пулинг важен для Vercel:**
   - Vercel использует serverless функции
   - Пулинг помогает эффективно управлять соединениями
   - Предотвращает превышение лимита соединений
   
   **Если не видите опцию пулинга:**
   - Используйте обычную строку соединения
   - Или в настройках проекта найдите "Connection pooling" и включите его

**Вариант B: Supabase (бесплатно)**
1. Перейдите на https://supabase.com
2. Создайте бесплатный проект
3. Перейдите в Settings → Database
4. Скопируйте Connection String (URI)

### 2. Обновите Prisma схему для PostgreSQL

**ВАЖНО:** Перед деплоем на Vercel нужно изменить провайдер базы данных.

В файле `prisma/schema.prisma` измените строку 9:
```prisma
datasource db {
  provider = "postgresql"  // было "sqlite"
  url      = env("DATABASE_URL")
}
```

Или скопируйте готовую схему:
```bash
# Windows PowerShell
Copy-Item prisma\schema.postgresql.prisma prisma\schema.prisma

# Linux/Mac
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

### 3. Настройте переменные окружения в Vercel

1. Перейдите в ваш проект на Vercel
2. Откройте **Settings** → **Environment Variables**
3. Добавьте следующие переменные для **Production**, **Preview** и **Development**:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа-случайная-строка
```

**Где взять JWT_SECRET?**
- Используйте любой генератор случайных строк
- Или выполните: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Примените миграции базы данных

После настройки DATABASE_URL локально, выполните:

```bash
# Сгенерируйте Prisma Client
npx prisma generate

# Примените схему к базе данных
npx prisma db push

# Заполните базу начальными данными
npx prisma db seed
```

### 5. Закоммитьте и запушьте изменения

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for Vercel deployment"
git push origin main
```

### 6. Пересоберите проект на Vercel

После пуша в GitHub, Vercel автоматически пересоберет проект.

## Важные замечания

- **Не используйте SQLite на Vercel** - файловая система доступна только для чтения
- **Используйте PostgreSQL** для продакшена
- **JWT_SECRET** должен быть длинным случайным строкой (минимум 32 символа)
- После изменения `prisma/schema.prisma` обязательно закоммитьте и запушьте изменения в GitHub
- Для локальной разработки можно вернуть SQLite, изменив `provider = "sqlite"` обратно

## Проверка

После деплоя проверьте:
1. Откройте ваш сайт на Vercel
2. Попробуйте зарегистрироваться
3. Проверьте `/api/health` endpoint для проверки подключения к БД

## Откат к SQLite для локальной разработки

Если хотите вернуться к SQLite для локальной разработки:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

И используйте в `.env.local`:
```
DATABASE_URL="file:./prisma/dev.db"
```
