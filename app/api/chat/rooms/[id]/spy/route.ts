import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST — admin joins a room silently (isHidden = true)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as any).id;
  const { id } = await params;

  await prisma.chatRoomMember.upsert({
    where: { roomId_userId: { roomId: id, userId } },
    update: { isHidden: true },
    create: { roomId: id, userId, isHidden: true },
  });

  return NextResponse.json({ ok: true });
}
