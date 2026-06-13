import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/get-session-user-id";

// GET /api/auth/2fa/status -> { enabled: boolean }
export async function GET(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });
  return NextResponse.json({ enabled: !!user?.twoFactorEnabled });
}
