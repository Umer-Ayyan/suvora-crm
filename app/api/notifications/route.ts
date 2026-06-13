import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });
    if (!user) return NextResponse.json([], { status: 200 });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json(notifications);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });
    if (!user) return NextResponse.json({ ok: true });

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
