import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { NextRequest, NextResponse } from "next/server";

// DELETE — admin can delete any room; others can leave (removes them from members)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = await getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = (session.user as any).role === "admin";
  const { id } = await params;

  if (isAdmin) {
    await prisma.chatRoom.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  }

  // Non-admin: just leave the room
  await prisma.chatRoomMember.deleteMany({ where: { roomId: id, userId } });
  return NextResponse.json({ left: true });
}
