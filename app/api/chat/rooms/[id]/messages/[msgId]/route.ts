import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { broadcastEdit, broadcastDelete } from "@/lib/chat-broadcaster";
import { NextRequest, NextResponse } from "next/server";

// ── Time limits ───────────────────────────────────────────────────────────────
const EDIT_LIMIT_MS = 15 * 60 * 1000;          // 15 minutes
const DELETE_FOR_ALL_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

type Params = { params: Promise<{ id: string; msgId: string }> };

// ── PATCH — edit message ──────────────────────────────────────────────────────
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

  const age = Date.now() - new Date(msg.createdAt).getTime();
  if (age > EDIT_LIMIT_MS) {
    return NextResponse.json({ error: "Edit window expired (15 min)" }, { status: 403 });
  }

  const updated = await prisma.chatMessage.update({
    where: { id: msgId },
    data: { content: content.trim(), editedAt: new Date() },
    include: { sender: { select: { id: true, name: true } }, readBy: { select: { userId: true } } },
  });

  const members = await prisma.chatRoomMember.findMany({ where: { roomId }, select: { userId: true } });
  broadcastEdit(roomId, msgId, updated.content, members.map((m) => m.userId));

  return NextResponse.json(updated);
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "admin";

  const { id: roomId, msgId } = await params;
  const body = await req.json().catch(() => ({}));
  const deleteType: "everyone" | "me" = body.deleteType ?? "me";

  const msg = await prisma.chatMessage.findUnique({ where: { id: msgId } });
  if (!msg || msg.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Delete for me (always allowed) ──
  if (deleteType === "me") {
    await prisma.chatMessageHide.upsert({
      where: { messageId_userId: { messageId: msgId, userId } },
      update: {},
      create: { messageId: msgId, userId },
    });
    return NextResponse.json({ deletedForMe: true });
  }

  // ── Delete for everyone (only sender/admin + time limit) ──
  if (msg.senderId !== userId && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const age = Date.now() - new Date(msg.createdAt).getTime();
  if (age > DELETE_FOR_ALL_LIMIT_MS && !isAdmin) {
    return NextResponse.json({ error: "Delete window expired (24 hours)" }, { status: 403 });
  }

  await prisma.chatMessage.update({
    where: { id: msgId },
    data: { isDeleted: true, content: "" },
  });

  const members = await prisma.chatRoomMember.findMany({ where: { roomId }, select: { userId: true } });
  broadcastDelete(roomId, msgId, members.map((m) => m.userId));

  return NextResponse.json({ deletedForAll: true });
}
