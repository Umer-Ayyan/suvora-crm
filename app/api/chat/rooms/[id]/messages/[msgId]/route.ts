import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { NextRequest, NextResponse } from "next/server";

const EDIT_LIMIT_MS           = 15 * 60 * 1000;
const DELETE_FOR_ALL_LIMIT_MS = 24 * 60 * 60 * 1000;

type Params = { params: Promise<{ id: string; msgId: string }> };

// ── PATCH — edit message OR toggle reaction ───────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: roomId, msgId } = await params;
  const body = await req.json();

  // ── React: { reaction: "👍" } ──────────────────────────────────────────────
  if (body.reaction) {
    const emoji = body.reaction as string;
    const msg = await prisma.chatMessage.findUnique({ where: { id: msgId }, select: { reactions: true, roomId: true } });
    if (!msg || msg.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const reactions = (msg.reactions ?? {}) as Record<string, string[]>;
    const users = reactions[emoji] ?? [];
    if (users.includes(userId)) {
      // Toggle off
      const next = users.filter((u) => u !== userId);
      if (next.length === 0) delete reactions[emoji];
      else reactions[emoji] = next;
    } else {
      reactions[emoji] = [...users, userId];
    }

    const updated = await prisma.chatMessage.update({
      where: { id: msgId },
      data: { reactions },
      select: { id: true, reactions: true },
    });
    return NextResponse.json(updated);
  }

  // ── Edit content ────────────────────────────────────────────────────────────
  const { content } = body;
  if (!content?.trim()) return NextResponse.json({ error: "Empty content" }, { status: 400 });

  const msg = await prisma.chatMessage.findUnique({ where: { id: msgId } });
  if (!msg || msg.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.senderId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const age = Date.now() - new Date(msg.createdAt).getTime();
  if (age > EDIT_LIMIT_MS) return NextResponse.json({ error: "Edit window expired (15 min)" }, { status: 403 });

  const updated = await prisma.chatMessage.update({
    where: { id: msgId },
    data: { content: content.trim(), editedAt: new Date() },
    include: { sender: { select: { id: true, name: true } }, readBy: { select: { userId: true } } },
  });

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

  if (deleteType === "me") {
    await prisma.chatMessageHide.upsert({
      where: { messageId_userId: { messageId: msgId, userId } },
      update: {},
      create: { messageId: msgId, userId },
    });
    return NextResponse.json({ deletedForMe: true });
  }

  if (msg.senderId !== userId && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const age = Date.now() - new Date(msg.createdAt).getTime();
  if (age > DELETE_FOR_ALL_LIMIT_MS && !isAdmin) {
    return NextResponse.json({ error: "Delete window expired (24 hours)" }, { status: 403 });
  }

  await prisma.chatMessage.update({ where: { id: msgId }, data: { isDeleted: true, content: "" } });

  return NextResponse.json({ deletedForAll: true });
}
