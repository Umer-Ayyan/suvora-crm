import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { defaultPermissions } from "@/lib/auth";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "suvora-super-secret-key"
);

// POST /api/auth/mobile  — mobile login, returns JWT bearer token
export async function POST(req: NextRequest) {
  try {
    const { employeeId, password } = await req.json();

    if (!employeeId || !password) {
      return NextResponse.json({ error: "employeeId and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: { customRole: true },
    });

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

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
    };

    // Sign JWT — 30 day expiry
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(SECRET);

    return NextResponse.json({ token, user: payload });
  } catch (err) {
    console.error("Mobile auth error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
