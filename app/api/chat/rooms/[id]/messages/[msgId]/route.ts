import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { broadcastEdit, broadcastDelete } from "@/lib/chat-broadcaster";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string; msgId: string }> };

// ── PATCH — edit message content ──────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: roomId, msgId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty content" }, { status: 400 });

  const msg = await prisma.chatMessage.findUnique({ where: { id: msgId } });
  if (!msg || msg.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.senderId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.chatMessage.update({
    where: { id: msgId },
    data: { content: content.trim(), editedAt: new Date() },
    include: { sender: { select: { id: true, name: true } }, readBy: { select: { userId: true } } },
  });

  // Get members for global broadcast
  const members = await prisma.chatRoomMember.findMany({ where: { roomId }, select: { userId: true } });
  broadcastEdit(roomId, msgId, updated.content, members.map((m) => m.userId));

  return NextResponse.json(updated);
}

// ── DELETE — delete message for everyone ─────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "admin";

  const { id: roomId, msgId } = await params;

  const msg = await prisma.chatMessage.findUnique({ where: { id: msgId } });
  if (!msg || msg.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.senderId !== userId && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.chatMessage.update({
    where: { id: msgId },
    data: { isDeleted: true, content: "" },
  });

  const members = await prisma.chatRoomMember.findMany({ where: { roomId }, select: { userId: true } });
  broadcastDelete(roomId, msgId, members.map((m) => m.userId));

  return NextResponse.json({ deleted: true });
}
