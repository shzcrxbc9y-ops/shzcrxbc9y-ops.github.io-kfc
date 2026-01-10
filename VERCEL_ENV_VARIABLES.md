# Настройка переменных окружения в Vercel

## Переменная 1: DATABASE_URL

### Заполните форму:

**Окружающая среда (Environment):**
- Выберите: ✅ **Production**
- Выберите: ✅ **Preview** 
- Выберите: ✅ **Development**

**Ветвь (Branch):**
- Оставьте пустым или выберите `main`

**Ключ (Key):**
```
DATABASE_URL
```

**Ценность (Value):**
```
postgresql://neondb_owner:npg_WBVkHCFE7L5R@ep-damp-wind-ahyxcu2l-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Примечание (Note):**
```
PostgreSQL connection string from Neon. Used for database connection in production. Includes connection pooling for serverless functions.
```

---

## Переменная 2: JWT_SECRET

### Создайте вторую переменную:

**Окружающая среда (Environment):**
- Выберите: ✅ **Production**
- Выберите: ✅ **Preview**
- Выберите: ✅ **Development**

**Ветвь (Branch):**
- Оставьте пустым или выберите `main`

**Ключ (Key):**
```
JWT_SECRET
```

**Ценность (Value):**
```
Сгенерируйте случайную строку минимум 32 символа
```

**Как сгенерировать JWT_SECRET:**

Выполните в терминале:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Или используйте онлайн генератор: https://randomkeygen.com/

**Пример сгенерированного значения:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Примечание (Note):**
```
Secret key for JWT token generation and verification. Used for user authentication. Must be at least 32 characters long.
```

---

## После добавления переменных:

1. ✅ Нажмите **Save** или **Add** для каждой переменной
2. ✅ Убедитесь, что обе переменные видны в списке
3. ✅ Обновите `prisma/schema.prisma` (измените на `provider = "postgresql"`)
4. ✅ Закоммитьте и запушьте изменения
5. ✅ Vercel автоматически пересоберет проект
