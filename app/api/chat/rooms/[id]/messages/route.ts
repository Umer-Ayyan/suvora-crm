import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/chat-broadcaster";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
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
      hiddenBy: { none: { userId } }, // exclude messages hidden by current user
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      sender: { select: { id: true, name: true } },
      readBy: { select: { userId: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "admin";
  const { id } = await params;

  const { content } = await req.json();
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
    data: { content: content.trim(), roomId: id, senderId: userId },
    include: {
      sender: { select: { id: true, name: true } },
      readBy: { select: { userId: true } },
    },
  });

  // Get all (non-hidden) members to push global notifications
  const members = await prisma.chatRoomMember.findMany({
    where: { roomId: id },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  broadcast(id, message, memberIds);
  return NextResponse.json(message);
}
