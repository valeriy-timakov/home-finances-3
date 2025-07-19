import type { NextConfig } from "next";

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
                source: '/transactions/:path*',
                destination: `${apiUrl}/transactions/:path*`,
            },
        ];
    },
};

export default nextConfig;
