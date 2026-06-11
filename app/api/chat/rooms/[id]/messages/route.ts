import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET messages for a room
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";
  const { id } = await params;

  // Check access
  if (!isAdmin) {
    const member = await prisma.chatRoomMember.findUnique({ where: { roomId_userId: { roomId: id, userId } } });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor");
  const messages = await prisma.chatMessage.findMany({
    where: { roomId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json(messages);
}

// POST send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";
  const { id } = await params;

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  // Check access — admin can always send, others must be a member
  if (!isAdmin) {
    const member = await prisma.chatRoomMember.findUnique({ where: { roomId_userId: { roomId: id, userId } } });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else {
    // If admin is not a member yet, add them as visible when sending
    await prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId: id, userId } },
      update: { isHidden: false },
      create: { roomId: id, userId, isHidden: false },
    });
  }

  const message = await prisma.chatMessage.create({
    data: { content: content.trim(), roomId: id, senderId: userId },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json(message);
}
