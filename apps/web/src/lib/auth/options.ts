import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true }
        });

        if (!user?.passwordHash || user.status !== "ACTIVE") return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role.name,
          clientId: user.clientId,
          mustChangePassword: user.mustChangePassword
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user?.email) return true;

      try {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

        if (!dbUser) {
          const employeeRole = await prisma.role.findUnique({ where: { name: "EMPLOYEE" } });
          if (!employeeRole) return false;

          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? (profile as any)?.name ?? user.email,
              image: user.image ?? (profile as any)?.picture,
              status: "ACTIVE",
              mustChangePassword: false,
              roleId: employeeRole.id
            }
          });

          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token ?? null,
              access_token: account.access_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state: (account as any)?.session_state ?? null
            }
          });
        }

        return dbUser.status === "ACTIVE";
      } catch (error) {
        console.error("Google sign-in error:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { role: true }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role.name;
          token.clientId = dbUser.clientId;
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = String(token.role);
        session.user.clientId = token.clientId ? String(token.clientId) : null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    }
  }
};
