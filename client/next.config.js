/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable RTL support
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
  },
  
  // API proxy for development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ]
  },
  
  // Environment variables
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001',
    SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3001',
  }
}

module.exports = nextConfig