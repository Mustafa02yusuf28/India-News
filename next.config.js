/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure next.js settings
  experimental: {
    // Configure server actions properly for Next.js 15.3.2
    serverActions: {
      allowedOrigins: ['localhost:3000', 'india-news-beta.vercel.app']
    }
  }
};

module.exports = nextConfig; 