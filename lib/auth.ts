import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        employeeId: {},
        password: {},
      },

      async authorize(credentials) {
        if (
          !credentials?.employeeId ||
          !credentials?.password
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            employeeId: credentials.employeeId,
          },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          employeeId: user.employeeId,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.employeeId =
          (user as any).employeeId;
      }

      return token;
    },

    async session({ session, token }) {
      (session.user as any).role =
        token.role as string;

      (session.user as any).employeeId =
        token.employeeId as string;

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};