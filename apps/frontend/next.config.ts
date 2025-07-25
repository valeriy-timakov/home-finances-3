import type { NextConfig } from "next";
import withNextIntl from 'next-intl/plugin';
import { locales, defaultLocale } from './src/i18n';

// console.log("=== process.env variables in next.config.ts ===");
// for (const [key, value] of Object.entries(process.env)) {
//   console.log(`${key} = ${value}`);
// }
// console.log("=== END process.env -dump- ===");

const apiUrl = process.env.API_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    console.log(`rewrites to ${apiUrl}`);
    return [
      {
        // Перенаправляємо всі запити, крім auth та нашого ж proxy, на наш обробник
        source: '/api/:path((?!auth|proxy).*)',
        destination: '/api/proxy/:path*',
      },
    ];
  },
};

// @ts-expect-error – plugin type defs allow only 1 arg but runtime supports 2
const withIntl = withNextIntl('./src/i18n.ts', {
  localePrefix: 'always',      // синхронізуємо з middleware
  locales,
  defaultLocale
});

export default withIntl(nextConfig);
