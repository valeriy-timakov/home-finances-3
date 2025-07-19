import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import Redis from "ioredis";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!, {
  password: process.env.REDIS_PASSWORD,
});

const sessionMaxAge = 30 * 24 * 60 * 60; // 30 днів

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Повертаємося до JWT, але будемо використовувати його лише для передачі sessionToken
    maxAge: sessionMaxAge,
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const identifier = credentials?.email;
        const password = credentials?.password;
        if (!identifier || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { username: identifier }] },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
        };
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "signIn" && user) {
        const sessionToken = randomUUID();
        const expires = new Date(Date.now() + sessionMaxAge * 1000);

        const sessionData = {
          sessionToken,
          userId: user.id,
          expires,
        };

        await redis.setex(sessionToken, sessionMaxAge, JSON.stringify(sessionData));

        token.sessionToken = sessionToken;
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sessionToken) {
        session.user.id = token.id as string;
        session.user.name = token.username as string;
        (session as any).sessionToken = token.sessionToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return process.env.NEXT_PUBLIC_APP_URL || baseUrl;
    },
  },
  pages: {
    signIn: '/',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
