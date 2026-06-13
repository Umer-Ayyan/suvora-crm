import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { sendExpoPush } from "@/lib/push";
import { NextRequest, NextResponse } from "next/server";

const MSG_INCLUDE = {
  sender: { select: { id: true, name: true } },
  readBy: { select: { userId: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      isDeleted: true,
      sender: { select: { id: true, name: true } },
    },
  },
} as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "admin";
  const { id } = await params;

  if (!isAdmin) {
    const member = await prisma.chatRoomMember.findUnique({ where: { roomId_userId: { roomId: id, userId } } });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId: id,
      hiddenBy: { none: { userId } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: MSG_INCLUDE,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "admin";
  const { id } = await params;

  const { content, replyToId } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  if (!isAdmin) {
    const member = await prisma.chatRoomMember.findUnique({ where: { roomId_userId: { roomId: id, userId } } });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else {
    await prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId: id, userId } },
      update: { isHidden: false },
      create: { roomId: id, userId, isHidden: false },
    });
  }

  const message = await prisma.chatMessage.create({
    data: {
      content: content.trim(),
      roomId: id,
      senderId: userId,
      ...(replyToId ? { replyToId } : {}),
    },
    include: MSG_INCLUDE,
  });

  // Push to other room members (client suppresses if that room is open).
  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id },
      select: { name: true, members: { select: { userId: true } } },
    });
    const recipientIds = (room?.members ?? [])
      .map((m) => m.userId)
      .filter((uid) => uid !== userId);
    if (recipientIds.length) {
      const senderName = message.sender?.name ?? "New message";
      await sendExpoPush(recipientIds, {
        title: room?.name || senderName,
        body: `${senderName}: ${message.content}`.slice(0, 140),
        data: { type: "chat", roomId: id, roomName: room?.name ?? "" },
      });
    }
  } catch (err) {
    console.error("[chat push]", err);
  }

  return NextResponse.json(message);
}
