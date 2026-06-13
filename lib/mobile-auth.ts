import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Short in-memory cache of each user's current sessionVersion so chat polling
// (every few seconds) doesn't hit the DB on every request. Warm serverless
// instances reuse this map; cold starts simply re-fetch.
const SV_TTL_MS = 60_000;
const svCache = new Map<string, { version: number; checkedAt: number }>();

async function isMobileTokenValid(userId: string, tokenSv: number): Promise<boolean> {
  const now = Date.now();
  const cached = svCache.get(userId);
  if (cached && now - cached.checkedAt < SV_TTL_MS) {
    return tokenSv >= cached.version;
  }
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { sessionVersion: true },
    });
    if (!dbUser) return false; // user deleted
    const version = dbUser.sessionVersion ?? 0;
    svCache.set(userId, { version, checkedAt: now });
    return tokenSv >= version;
  } catch {
    // DB error — fail open (don't lock everyone out on a transient blip).
    return true;
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set — refusing to start with an insecure default.");
}
const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

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
      const userId = payload.id as string | undefined;
      const tokenSv = (payload.sv as number | undefined) ?? 0;
      // Revocation check: password change / account disable bumps sessionVersion.
      if (userId && !(await isMobileTokenValid(userId, tokenSv))) {
        return null;
      }
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
