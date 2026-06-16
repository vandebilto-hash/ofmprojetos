import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma/client";

const adapter = PrismaAdapter(prisma);

const originalCreateUser = adapter.createUser?.bind(adapter);

const customAdapter = {
  ...adapter,
  async createUser(data: any) {
    const employeeRole = await prisma.role.findUnique({ where: { name: "EMPLOYEE" } });
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.emailVerified,
        status: "ACTIVE",
        mustChangePassword: false,
        roleId: employeeRole!.id
      }
    });
  }
};

export const authOptions: NextAuthOptions = {
  adapter: customAdapter as any,
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
    async signIn({ user, account }) {
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      return Boolean(dbUser && dbUser.status === "ACTIVE");
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
    },
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/dashboard`;
    }
  }
};
