import type { RoleName } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: RoleName | string;
      clientId: string | null;
      mustChangePassword: boolean;
    };
  }

  interface User {
    role?: RoleName | string;
    clientId?: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: RoleName | string;
    clientId?: string | null;
    mustChangePassword?: boolean;
  }
}
