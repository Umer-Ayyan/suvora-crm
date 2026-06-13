import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { broadcastRead } from "@/lib/chat-broadcaster";
import { NextRequest, NextResponse } from "next/server";

// Mark all messages in this room as read by the current user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: roomId } = await params;

  // Get all messages NOT sent by me that I haven't read yet
  const unread = await prisma.chatMessage.findMany({
    where: {
      roomId,
      senderId: { not: userId },
      readBy: { none: { userId } },
    },
    select: { id: true },
  });

  if (unread.length > 0) {
    await prisma.chatMessageRead.createMany({
      data: unread.map((m) => ({ messageId: m.id, userId })),
      skipDuplicates: true,
    });

    // Notify room members so senders update their tick status
    broadcastRead(roomId, userId);
  }

  return NextResponse.json({ ok: true, count: unread.length });
}
