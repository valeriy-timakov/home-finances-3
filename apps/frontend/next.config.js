/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/transactions',
        destination: 'http://localhost:3001/transactions',
      },
      // Додай інші проксі-шляхи за потреби
    ];
  },
};

module.exports = nextConfig;
