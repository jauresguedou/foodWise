import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      isVerifiedStudent: boolean;
      countryCode: string;
    };
  }

  interface User {
    role: UserRole;
    isVerifiedStudent: boolean;
    countryCode: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    isVerifiedStudent: boolean;
    countryCode: string;
  }
}