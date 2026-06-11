import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
