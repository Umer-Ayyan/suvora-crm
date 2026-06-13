import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "suvora-super-secret-key"
);

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  employeeId?: string;
  role: string;
  department?: string | null;
  customRoleName?: string | null;
  permissions?: Record<string, boolean>;
}

// Drop-in replacement for getServerSession that also accepts mobile Bearer tokens.
// Usage in routes: replace
//   const session = await getServerSession(authOptions);
// with:
//   const session = await getMobileOrWebSession(req, authOptions);
// Everything else (session.user.role, etc.) stays the same.
export async function getMobileOrWebSession(
  req: NextRequest | Request,
  options: any
): Promise<{ user: AuthUser } | null> {
  // 1. Try Bearer token (mobile app)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, SECRET);
      return { user: payload as unknown as AuthUser };
    } catch {
      return null;
    }
  }

  // 2. Fall back to NextAuth session (web)
  try {
    const session = await getServerSession(options);
    return session as { user: AuthUser } | null;
  } catch {
    return null;
  }
}

// Also export getAuthUser for convenience
export async function getAuthUser(req: NextRequest | Request): Promise<AuthUser | null> {
  const session = await getMobileOrWebSession(req, authOptions);
  return session?.user ?? null;
}
