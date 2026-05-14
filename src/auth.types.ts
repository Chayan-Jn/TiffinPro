import NextAuth from "next-auth";
import type { DefaultSession, DefaultJWT } from "next-auth";

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

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    username: string;
    role: "provider" | "customer";
  }
}
