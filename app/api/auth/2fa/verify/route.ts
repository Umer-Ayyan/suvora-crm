import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { verifyTwoFactorCode } from "@/lib/twofactor";

// POST /api/auth/2fa/verify  { code }
// Confirms the pending secret and turns 2FA ON.
export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = await getSessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });
    if (!user?.twoFactorSecret) {
      return NextResponse.json({ error: "No pending 2FA setup. Start setup first." }, { status: 400 });
    }

    if (!verifyTwoFactorCode(code, user.twoFactorSecret)) {
      return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[2fa verify]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
