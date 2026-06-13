import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "admin";

  const include = {
    members: {
      where: { isHidden: false },
      include: { user: { select: { id: true, name: true, employeeId: true, role: true, lastSeenAt: true } } },
    },
    messages: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
      include: { sender: { select: { id: true, name: true } } },
    },
  };

  const rooms = isAdmin
    ? await prisma.chatRoom.findMany({ orderBy: { createdAt: "desc" }, include })
    : await prisma.chatRoom.findMany({
        where: { members: { some: { userId, isHidden: false } } },
        orderBy: { createdAt: "desc" },
        include,
      });

  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, name, memberIds } = await req.json();

  if (!Array.isArray(memberIds) || memberIds.length === 0)
    return NextResponse.json({ error: "Members required" }, { status: 400 });

  const include = {
    members: {
      where: { isHidden: false },
      include: { user: { select: { id: true, name: true, employeeId: true, role: true, lastSeenAt: true } } },
    },
    messages: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
      include: { sender: { select: { id: true, name: true } } },
    },
  };

  // For direct: return existing room if already exists
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
      include,
    });
    if (existing) return NextResponse.json(existing);
  }

  const allMemberIds = [...new Set([userId, ...memberIds])];

  const room = await prisma.chatRoom.create({
    data: {
      type: type || "direct",
      name: type === "group" ? (name || "Group Chat") : null,
      createdById: userId,
      members: { create: allMemberIds.map((id) => ({ userId: id })) },
    },
    include,
  });

  return NextResponse.json(room);
}
