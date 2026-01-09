# Инструкция по установке и запуску

## Требования

- Node.js 18+ 
- npm или yarn

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` в корне проекта со следующим содержимым:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

3. Инициализируйте базу данных:
```bash
npm run db:generate
npm run db:push
```

4. Заполните базу данных тестовыми данными:
```bash
npm run db:seed
```

## Запуск

Запустите сервер разработки:
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Тестовые аккаунты

После выполнения `npm run db:seed` будут созданы следующие тестовые аккаунты:

**Администратор:**
- Email: `admin@kfc.com`
- Пароль: `admin123`

**Сотрудник:**
- Email: `employee@kfc.com`
- Пароль: `user123`

## Управление базой данных

Для просмотра и редактирования базы данных через графический интерфейс:
```bash
npm run db:studio
```

## Структура проекта

- `/app` - Next.js страницы и API routes
- `/components` - React компоненты
- `/lib` - Утилиты и вспомогательные функции
- `/prisma` - Схема базы данных Prisma
- `/types` - TypeScript типы

## Дополнительная информация

- Для создания новых материалов и тестов используйте Prisma Studio или создайте соответствующие API endpoints
- Все пароли хранятся в зашифрованном виде (bcrypt)
- JWT токены действительны 7 дней

