import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";

// Extend the built-in types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "provider" | "customer";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    role: "provider" | "customer";
  }
}

