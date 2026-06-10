import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Attendance rules — Night shift PKT (UTC+5): 10:00 PM – 6:00 AM
// On time: check-in by 10:15 PM (22:15)
// Late:    check-in by 11:00 PM (23:00)  → −25%
// Half Day: after 11:00 PM              → −50%
const WORK_START_HOUR = 22;  // 10:00 PM
const GRACE_UNTIL_MIN = 15;  // 10:15 PM — on time
const LATE_UNTIL_HOUR = 23;  // 11:00 PM — late

function getAttendanceDatePKT(pkt: Date): Date {
  const h = pkt.getUTCHours();
  // If checking in between midnight and 6 AM PKT, this counts as the previous calendar day's shift
  if (h < 6) {
    return new Date(Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), pkt.getUTCDate() - 1));
  }
  return new Date(Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), pkt.getUTCDate()));
}

function getAttendanceStatus(checkInUTC: Date): { status: string; deductionPct: number } {
  const pkt = new Date(checkInUTC.getTime() + 5 * 60 * 60 * 1000);
  const h = pkt.getUTCHours();
  const m = pkt.getUTCMinutes();

  // Night shift: valid check-in window is 22:00–05:59 PKT
  // Normalise: treat 22:00–23:59 and 00:00–05:59 as a single timeline
  // Map to minutes from 22:00 (shift start)
  let minutesFromStart: number;
  if (h >= WORK_START_HOUR) {
    minutesFromStart = (h - WORK_START_HOUR) * 60 + m;
  } else {
    // 00:00–05:59 => past midnight, still same shift
    minutesFromStart = (24 - WORK_START_HOUR + h) * 60 + m;
  }

  const onTimeUntil = GRACE_UNTIL_MIN;            // 0–15 min from start = present
  const lateUntil   = (LATE_UNTIL_HOUR - WORK_START_HOUR) * 60; // 60 min from start = late boundary

  if (minutesFromStart <= onTimeUntil) return { status: "present", deductionPct: 0 };
  if (minutesFromStart <= lateUntil)   return { status: "late",    deductionPct: 25 };
  return { status: "half_day", deductionPct: 50 };
}

// GET — fetch attendance records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const employeeId = (session.user as any).employeeId;
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Build filter
    const where: any = {};

    if (role === "employee") {
      // Employees can only see their own
      const user = await prisma.user.findUnique({ where: { employeeId } });
      if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      where.date = { gte: start, lt: end };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, name: true, employeeId: true, salary: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(records);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — employee check-in
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const employeeId = (session.user as any).employeeId;
    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();

    // Determine the attendance date in PKT (after-midnight check-ins count as previous day)
    const pktNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const todayDate = getAttendanceDatePKT(pktNow);

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate } },
    });

    if (existing && existing.checkInTime) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
    }

    const { status, deductionPct } = getAttendanceStatus(now);

    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId: user.id, date: todayDate } },
      update: { checkInTime: now, status, deductionPct },
      create: { userId: user.id, date: todayDate, checkInTime: now, status, deductionPct },
    });

    return NextResponse.json(record);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
