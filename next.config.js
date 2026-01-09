/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Игнорируем ошибки ESLint и TypeScript во время сборки (для Netlify)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Оставляем проверку типов, но скрипты исключены
  },
}

module.exports = nextConfig

