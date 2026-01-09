# Быстрое решение проблемы с деплоем на Netlify

## Проблема
SQLite не работает на Netlify (файловая система только для чтения).

## Быстрое решение

### 1. Создайте бесплатную базу данных PostgreSQL

**Вариант A: Neon (рекомендуется)**
1. Зайдите на https://neon.tech
2. Создайте аккаунт и проект
3. Скопируйте Connection String

**Вариант B: Supabase**
1. Зайдите на https://supabase.com
2. Создайте проект
3. Получите Connection String из Settings → Database

### 2. Обновите схему Prisma

Откройте `prisma/schema.prisma` и измените:
```prisma
datasource db {
  provider = "postgresql"  // Было: "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Настройте переменные окружения на Netlify

В настройках сайта Netlify → Environment variables добавьте:

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=ваш-случайный-секретный-ключ
NEXTAUTH_URL=https://ваш-сайт.netlify.app
```

### 4. Локально примените миграции

```bash
# Сгенерировать Prisma клиент
npx prisma generate

# Применить схему к PostgreSQL
npx prisma db push

# Заполнить тестовыми данными
npm run db:seed
```

### 5. Закоммитьте изменения и запушьте

```bash
git add .
git commit -m "Switch to PostgreSQL for Netlify deployment"
git push
```

Netlify автоматически запустит новую сборку.

## Что уже сделано

✅ Создан `netlify.toml` с правильной конфигурацией
✅ Добавлена генерация Prisma клиента в `postinstall` и `build` скрипты
✅ Исключена папка `scripts/` из проверки типов
✅ Исправлены все ошибки типизации

## Если все еще не работает

1. Проверьте логи сборки на Netlify
2. Убедитесь, что `DATABASE_URL` правильно настроен
3. Проверьте, что база данных доступна из интернета (не только localhost)
