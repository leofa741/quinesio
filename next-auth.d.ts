// types/next-auth.d.ts

import "next-auth";
import "next-auth/jwt";

type UserRole =
  | "admin"
  | "profesionales"
  | "administrativos"
  | "pacientes";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;

      name?: string | null;
      lastName?: string | null;

      phone?: string | null;

      address?: string | null;
      city?: string | null;
      zipCode?: string | null;

      image?: string | null;

      role: UserRole;

      token?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;

    name?: string | null;
    lastName?: string | null;

    phone?: string | null;

    address?: string | null;
    city?: string | null;
    zipCode?: string | null;

    image?: string | null;

    role: UserRole;

    google?: boolean;

    token?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;

    email?: string;

    name?: string | null;

    lastName?: string | null;

    phone?: string | null;

    address?: string | null;
    city?: string | null;
    zipCode?: string | null;

    picture?: string | null;

    role?: UserRole;

    token?: string | null;
  }
}