import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { defaultPermissions } from "@/lib/auth";
import { rateLimit, rateLimitReset, clientIp } from "@/lib/rate-limit";
import { verifyTwoFactorCode } from "@/lib/twofactor";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set — refusing to start with an insecure default.");
}
const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

// POST /api/auth/mobile  — mobile login, returns JWT bearer token
export async function POST(req: NextRequest) {
  try {
    const { employeeId, password, otp } = await req.json();

    if (!employeeId || !password) {
      return NextResponse.json({ error: "employeeId and password required" }, { status: 400 });
    }

    // Throttle brute-force: 5 attempts / 15 min per IP + employeeId.
    const rlKey = `mobile-login:${clientIp(req)}:${employeeId}`;
    const rl = rateLimit(rlKey);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: { customRole: true },
    });

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // Second factor (TOTP) if enabled.
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const code = (otp ?? "").toString().trim();
      if (!code) {
        // Password correct — tell the app to collect the 6-digit code.
        return NextResponse.json({ twoFactorRequired: true });
      }
      if (!verifyTwoFactorCode(code, user.twoFactorSecret)) {
        return NextResponse.json({ error: "Invalid authentication code" }, { status: 401 });
      }
    }

    // Successful login — clear the throttle counter.
    rateLimitReset(rlKey);

    // Build permissions
    let permissions;
    if (user.role === "admin") {
      permissions = defaultPermissions("admin");
    } else if (user.customRole) {
      const custom = user.customRole.permissions as any;
      const base = defaultPermissions(user.role);
      if (user.role === "manager") {
        permissions = Object.fromEntries(
          Object.keys(base).map((k) => [k, (base as any)[k] || custom[k]])
        );
      } else {
        permissions = custom;
      }
    } else {
      permissions = defaultPermissions(user.role);
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department ?? null,
      customRoleName: user.customRole?.name ?? null,
      permissions,
      sv: user.sessionVersion ?? 0, // for revocation on password change / disable
    };

    // Sign JWT — 7 day expiry
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET);

    return NextResponse.json({ token, user: payload });
  } catch (err) {
    console.error("Mobile auth error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
