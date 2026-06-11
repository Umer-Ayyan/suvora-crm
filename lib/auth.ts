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

        // Determine permissions
        const permissions: Permissions = user.customRole
          ? (user.customRole.permissions as Permissions)
          : defaultPermissions(user.role);

        return {
          id: user.id,
          name: user.name,
          employeeId: user.employeeId,
          role: user.role,
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
        token.role         = (user as any).role;
        token.employeeId   = (user as any).employeeId;
        token.customRoleId = (user as any).customRoleId;
        token.customRoleName = (user as any).customRoleName;
        token.permissions  = (user as any).permissions;
      }
      return token;
    },

    async session({ session, token }) {
      (session.user as any).role         = token.role as string;
      (session.user as any).employeeId   = token.employeeId as string;
      (session.user as any).customRoleId = token.customRoleId;
      (session.user as any).customRoleName = token.customRoleName;
      (session.user as any).permissions  = token.permissions as Permissions;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};
