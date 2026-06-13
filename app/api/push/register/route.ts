import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

// Resolve the real DB user id from the session (mobile JWT carries id, web too).
async function resolveUserId(session: any): Promise<string | null> {
  const u = session?.user;
  if (!u) return null;
  if (u.id) {
    const exists = await prisma.user.findUnique({ where: { id: u.id }, select: { id: true } });
    if (exists) return exists.id;
  }
  if (u.employeeId) {
    const byEmp = await prisma.user.findUnique({
      where: { employeeId: u.employeeId },
      select: { id: true },
    });
    if (byEmp) return byEmp.id;
  }
  return null;
}

// POST /api/push/register  { token, platform }
export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await resolveUserId(session);
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const token = body.token?.trim();
    const platform = body.platform?.trim() || null;
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    // Upsert by unique token; move token to this user if it was on another.
    await prisma.pushToken.upsert({
      where: { token },
      create: { token, userId, platform },
      update: { userId, platform },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/push/register  { token }  — called on logout
export async function DELETE(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = body.token?.trim();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    await prisma.pushToken.deleteMany({ where: { token } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
