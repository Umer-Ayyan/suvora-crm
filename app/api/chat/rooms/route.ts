import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/chat/rooms — list rooms for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";

  let rooms;
  if (isAdmin) {
    // Admin sees ALL rooms
    rooms = await prisma.chatRoom.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          where: { isHidden: false },
          include: { user: { select: { id: true, name: true, employeeId: true, role: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });
  } else {
    // Regular users see only their rooms (non-hidden membership)
    rooms = await prisma.chatRoom.findMany({
      where: { members: { some: { userId, isHidden: false } } },
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          where: { isHidden: false },
          include: { user: { select: { id: true, name: true, employeeId: true, role: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
    });
  }

  return NextResponse.json(rooms);
}

// POST /api/chat/rooms — create room
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { type, name, memberIds } = await req.json();

  if (!Array.isArray(memberIds) || memberIds.length === 0)
    return NextResponse.json({ error: "Members required" }, { status: 400 });

  // For direct: check if room already exists between these two users
  if (type === "direct" && memberIds.length === 1) {
    const otherId = memberIds[0];
    const existing = await prisma.chatRoom.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { userId, isHidden: false } } },
          { members: { some: { userId: otherId, isHidden: false } } },
        ],
      },
      include: {
        members: {
          where: { isHidden: false },
          include: { user: { select: { id: true, name: true, employeeId: true, role: true } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true, name: true } } } },
      },
    });
    if (existing) return NextResponse.json(existing);
  }

  const allMemberIds = [...new Set([userId, ...memberIds])];

  const room = await prisma.chatRoom.create({
    data: {
      type: type || "direct",
      name: type === "group" ? (name || "Group Chat") : null,
      createdById: userId,
      members: {
        create: allMemberIds.map((id) => ({ userId: id })),
      },
    },
    include: {
      members: {
        where: { isHidden: false },
        include: { user: { select: { id: true, name: true, employeeId: true, role: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(room);
}
