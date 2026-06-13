import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";


export async function POST(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
