/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable RTL support
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
  },
  
  // Disable strict mode for build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Environment variables
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
    SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3001',
  }
}

module.exports = nextConfig