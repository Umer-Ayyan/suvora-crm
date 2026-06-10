import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/announcements — admin sends announcement to all users
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as any).role !== "admin")
      return NextResponse.json({ error: "Admin only" }, { status: 403 });

    const body = await req.json();
    const title = body.title?.trim();
    const message = body.message?.trim();
    if (!title || !message)
      return NextResponse.json({ error: "Title and message required" }, { status: 400 });

    // Get all users (employees + managers)
    const users = await prisma.user.findMany({
      where: { role: { in: ["employee", "manager"] } },
      select: { id: true },
    });

    // Create a notification for every user
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        message,
        type: "announcement",
        read: false,
      })),
    });

    // Log activity
    const admin = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });
    if (admin) {
      await prisma.activityLog.create({
        data: {
          action: "ANNOUNCEMENT_SENT",
          description: `${admin.name} sent an announcement: "${title}"`,
          userId: admin.id,
        },
      });
    }

    return NextResponse.json({ ok: true, sentTo: users.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
