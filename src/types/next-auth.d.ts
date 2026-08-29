import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/auth/config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      phone?: string;
      kyc?: string;
      trustScore?: number;
      phoneVerified: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    phone?: string;
    kyc?: string;
    trustScore?: number;
    phoneVerified?: boolean;
    roleCheckedAt?: number;
  }
}
