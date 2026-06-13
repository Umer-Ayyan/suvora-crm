import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { verifyTwoFactorCode } from "@/lib/twofactor";

// POST /api/auth/2fa/disable  { code? , password? }
// Requires EITHER a valid current TOTP code OR the account password, so a
// walk-up attacker on an unlocked session can't trivially switch 2FA off.
export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = await getSessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true, password: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.twoFactorEnabled) return NextResponse.json({ ok: true });

    const codeOk = code && user.twoFactorSecret && verifyTwoFactorCode(code, user.twoFactorSecret);
    const passOk = password && (await bcrypt.compare(password, user.password));
    if (!codeOk && !passOk) {
      return NextResponse.json({ error: "Enter a valid code or your password to disable 2FA." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[2fa disable]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
