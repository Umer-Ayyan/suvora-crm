import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

const DEDUCTION: Record<string, number> = {
  present:  0,
  late:     25,
  half_day: 50,
  absent:   100,
  leave:    0,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["admin", "manager"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, month, year, status } = await req.json();
    if (!userId || !month || !year || !status) {
      return NextResponse.json({ error: "userId, month, year and status are required" }, { status: 400 });
    }

    const deductionPct = DEDUCTION[status] ?? 0;

    // Build list of all Mon–Fri dates in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDates: Date[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const day = date.getDay();
      if (day !== 0) { // skip Sunday only
        // Store as UTC date (same as the rest of the system)
        workingDates.push(new Date(Date.UTC(year, month - 1, d)));
      }
    }

    // Fetch already-marked dates to skip them
    const existing = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt:  new Date(Date.UTC(year, month, 1)),
        },
      },
      select: { date: true },
    });

    const existingSet = new Set(existing.map((r) => r.date.toISOString()));
    const toCreate = workingDates.filter((d) => !existingSet.has(d.toISOString()));

    if (toCreate.length === 0) {
      return NextResponse.json({ count: 0, message: "All working days already marked" });
    }

    await prisma.attendance.createMany({
      data: toCreate.map((date) => ({
        userId,
        date,
        status,
        deductionPct,
      })),
    });

    return NextResponse.json({ count: toCreate.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
