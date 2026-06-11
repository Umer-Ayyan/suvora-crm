import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export type Permissions = {
  leads:       boolean;
  clients:     boolean;
  invoices:    boolean;
  quotations:  boolean;
  tasks:       boolean;
  employees:   boolean;
  attendance:  boolean;
  goals:       boolean;
  reports:     boolean;
};

// Default permissions per system role (when no custom role assigned)
export function defaultPermissions(role: string): Permissions {
  if (role === "admin") {
    return { leads: true, clients: true, invoices: true, quotations: true, tasks: true, employees: true, attendance: true, goals: true, reports: true };
  }
  if (role === "manager") {
    return { leads: true, clients: true, invoices: true, quotations: true, tasks: true, employees: true, attendance: true, goals: true, reports: true };
  }
  // employee
  return { leads: true, clients: false, invoices: false, quotations: false, tasks: true, employees: false, attendance: true, goals: true, reports: false };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        employeeId: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.employeeId || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { employeeId: credentials.employeeId },
          include: { customRole: true },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Determine permissions:
        // - admin: always all access
        // - manager + custom role: MERGE (union) — manager keeps all powers, custom role can only ADD not remove
        // - employee + custom role: custom role defines exactly what they can see
        // - no custom role: default for system role
        let permissions: Permissions;
        if (user.role === "admin") {
          permissions = defaultPermissions("admin");
        } else if (user.customRole) {
          const custom = user.customRole.permissions as Permissions;
          const base   = defaultPermissions(user.role);
          if (user.role === "manager") {
            // Manager keeps everything they already have; custom role can only add more
            permissions = Object.fromEntries(
              Object.keys(base).map((k) => [k, base[k as keyof Permissions] || custom[k as keyof Permissions]])
            ) as Permissions;
          } else {
            // Employee: custom role fully controls what they see
            permissions = custom;
          }
        } else {
          permissions = defaultPermissions(user.role);
        }

        return {
          id: user.id,
          name: user.name,
          employeeId: user.employeeId,
          role: user.role,
          department: user.department ?? null,
          customRoleId: user.customRoleId ?? null,
          customRoleName: user.customRole?.name ?? null,
          permissions,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id             = (user as any).id;
        token.role           = (user as any).role;
        token.employeeId     = (user as any).employeeId;
        token.department     = (user as any).department;
        token.customRoleId   = (user as any).customRoleId;
        token.customRoleName = (user as any).customRoleName;
        token.permissions    = (user as any).permissions;
        // Store sessionVersion at login time
        const dbUser = await prisma.user.findUnique({ where: { id: (user as any).id }, select: { sessionVersion: true } });
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
      } else if (token.id) {
        // On every subsequent request, verify sessionVersion hasn't changed
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { sessionVersion: true } });
        if (!dbUser || (dbUser.sessionVersion ?? 0) !== (token.sessionVersion ?? 0)) {
          // Session invalidated — return empty token to force sign-out
          return {};
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (!token.id) return { ...session, user: undefined as any }; // force sign-out
      // token.sub is automatically set by NextAuth to user.id — use as fallback
      (session.user as any).id           = (token.id ?? token.sub) as string;
      (session.user as any).role         = token.role as string;
      (session.user as any).employeeId   = token.employeeId as string;
      (session.user as any).department   = token.department;
      (session.user as any).customRoleId = token.customRoleId;
      (session.user as any).customRoleName = token.customRoleName;
      (session.user as any).permissions  = token.permissions as Permissions;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};
