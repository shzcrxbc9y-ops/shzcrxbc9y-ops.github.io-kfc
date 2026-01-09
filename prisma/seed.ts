import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Начало заполнения базы данных...')

  // Создаем администратора
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kfc.com' },
    update: {},
    create: {
      email: 'admin@kfc.com',
      password: adminPassword,
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'ADMIN',
      position: 'Администратор',
      progress: {
        create: {},
      },
    },
  })
  console.log('Администратор создан:', admin.email)

  // Создаем тестового сотрудника
  const employeePassword = await bcrypt.hash('user123', 10)
  const employee = await prisma.user.upsert({
    where: { email: 'employee@kfc.com' },
    update: {},
    create: {
      email: 'employee@kfc.com',
      password: employeePassword,
      firstName: 'Иван',
      lastName: 'Иванов',
      role: 'EMPLOYEE',
      position: 'Сотрудник',
      progress: {
        create: {},
      },
    },
  })
  console.log('Сотрудник создан:', employee.email)

  // Создаем станции
  const station1 = await prisma.station.upsert({
    where: { id: 'station-1' },
    update: {},
    create: {
      id: 'station-1',
      name: 'Станция кухни',
      description: 'Обучение работе на кухне',
      order: 1,
    },
  })

  const station2 = await prisma.station.upsert({
    where: { id: 'station-2' },
    update: {},
    create: {
      id: 'station-2',
      name: 'Станция кассы',
      description: 'Обучение работе на кассе',
      order: 2,
    },
  })

  console.log('Станции созданы')

  // Создаем разделы
  const section1 = await prisma.section.upsert({
    where: { id: 'section-1' },
    update: {},
    create: {
      id: 'section-1',
      title: 'Основы работы на кухне',
      description: 'Изучение базовых принципов работы на кухне KFC',
      order: 1,
      stationId: station1.id,
    },
  })

  const section2 = await prisma.section.upsert({
    where: { id: 'section-2' },
    update: {},
    create: {
      id: 'section-2',
      title: 'Работа с кассой',
      description: 'Изучение работы с кассовым аппаратом',
      order: 1,
      stationId: station2.id,
    },
  })

  console.log('Разделы созданы')

  // Создаем материалы
  await prisma.material.upsert({
    where: { id: 'material-1' },
    update: {},
    create: {
      id: 'material-1',
      sectionId: section1.id,
      title: 'Введение в работу на кухне',
      content: '<p>Добро пожаловать на кухню KFC! В этом разделе вы изучите основы работы.</p><p>Основные правила:</p><ul><li>Соблюдайте гигиену</li><li>Следуйте рецептам</li><li>Соблюдайте время приготовления</li></ul>',
      type: 'text',
      order: 1,
    },
  })

  await prisma.material.upsert({
    where: { id: 'material-2' },
    update: {},
    create: {
      id: 'material-2',
      sectionId: section2.id,
      title: 'Работа с кассовым аппаратом',
      content: '<p>Кассовый аппарат - важный инструмент для работы. Изучите основные функции.</p>',
      type: 'text',
      order: 1,
    },
  })

  console.log('Материалы созданы')

  // Создаем тест
  const test1 = await prisma.test.upsert({
    where: { id: 'test-1' },
    update: {},
    create: {
      id: 'test-1',
      sectionId: section1.id,
      title: 'Тест по основам работы на кухне',
      description: 'Проверьте свои знания основ работы на кухне',
      passingScore: 70,
      timeLimit: 15,
      isCertification: false,
    },
  })

  const test2 = await prisma.test.upsert({
    where: { id: 'test-2' },
    update: {},
    create: {
      id: 'test-2',
      sectionId: section1.id,
      title: 'Сертификация по кухне',
      description: 'Итоговый тест для получения сертификации',
      passingScore: 80,
      timeLimit: 30,
      isCertification: true,
    },
  })

  console.log('Тесты созданы')

  // Создаем вопросы для первого теста
  const question1 = await prisma.question.create({
    data: {
      testId: test1.id,
      text: 'Какое правило гигиены является самым важным на кухне?',
      type: 'single',
      order: 1,
      options: {
        create: [
          { text: 'Мытье рук перед началом работы', isCorrect: true, order: 1 },
          { text: 'Использование перчаток', isCorrect: false, order: 2 },
          { text: 'Чистка оборудования', isCorrect: false, order: 3 },
          { text: 'Проветривание помещения', isCorrect: false, order: 4 },
        ],
      },
    },
  })

  const question2 = await prisma.question.create({
    data: {
      testId: test1.id,
      text: 'Что нужно соблюдать при приготовлении блюд? (выберите все правильные ответы)',
      type: 'multiple',
      order: 2,
      options: {
        create: [
          { text: 'Рецепты', isCorrect: true, order: 1 },
          { text: 'Время приготовления', isCorrect: true, order: 2 },
          { text: 'Температуру', isCorrect: true, order: 3 },
          { text: 'Собственные предпочтения', isCorrect: false, order: 4 },
        ],
      },
    },
  })

  console.log('Вопросы созданы')
  console.log('База данных успешно заполнена!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

