/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable experimental turbopack in production
  // but allow it in development
  experimental: {
    turbo: process.env.NODE_ENV === 'development'
  },
  // Add any other configuration options here
};

module.exports = nextConfig; 