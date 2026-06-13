import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { generateTwoFactorSecret, buildOtpAuthUrl, buildQrDataUrl } from "@/lib/twofactor";

// POST /api/auth/2fa/setup
// Generates a NEW pending secret (stored but twoFactorEnabled stays false until
// the user confirms a code via /verify). Returns the secret + QR data URL.
export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = await getSessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const secret = generateTwoFactorSecret();
    // Store as pending secret; enabled flag flipped only after /verify succeeds.
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    const label = user.email || user.employeeId || user.name;
    const otpAuthUrl = buildOtpAuthUrl(label, secret);
    const qr = await buildQrDataUrl(otpAuthUrl);

    return NextResponse.json({ secret, otpAuthUrl, qr });
  } catch (e) {
    console.error("[2fa setup]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
