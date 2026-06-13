import { prisma } from "@/lib/prisma";
import { sendExpoPush } from "@/lib/push";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/cron/duty-reminder
// Triggered by Vercel Cron at 16:30 UTC = 21:30 (9:30 PM) PKT.
// Sends a duty-start reminder to every active employee/manager.
export async function GET(req: NextRequest) {
  // Protect: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ["employee", "manager", "admin"] } },
      select: { id: true },
    });

    await sendExpoPush(
      users.map((u) => u.id),
      {
        title: "Duty Reminder",
        body: "Your duty is about to start. Please be ready and mark your attendance.",
        data: { type: "duty-reminder", link: "/attendance" },
      }
    );

    return NextResponse.json({ ok: true, sentTo: users.length });
  } catch (e) {
    console.error("[cron duty-reminder]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
