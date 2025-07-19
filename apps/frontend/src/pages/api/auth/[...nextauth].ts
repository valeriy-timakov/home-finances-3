import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
        console.log('[authorize] called with', credentials);
        const identifier = credentials?.email; // could be username or email
        const password = credentials?.password;
        if (!identifier || !password) {
          console.log('[authorize] missing credentials');
          return null;
        }

        // Try to find by email
        const userByEmail = await prisma.user.findUnique({ where: { email: identifier } });
        // Try to find by username
        const userByUsername = await prisma.user.findUnique({ where: { username: identifier } });

        if (userByEmail && userByUsername && userByEmail.id !== userByUsername.id) {
          console.log('[authorize] Ambiguous identifier: found different users by email and username');
          throw new Error('Введене значення співпадає і з email, і з іменем різних користувачів. Уточніть, як саме ви хочете увійти.');
        }

        const user = userByEmail || userByUsername;
        if (!user) {
          console.log('[authorize] user not found:', identifier);
          return null;
        }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
          console.log('[authorize] invalid password for:', identifier);
          return null;
        }

        console.log('[authorize] success for:', identifier);
        return {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.username as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  }
};

export default NextAuth(authOptions);
