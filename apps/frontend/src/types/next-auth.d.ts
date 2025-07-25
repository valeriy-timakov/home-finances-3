import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    sessionToken?: string;
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
  }
}