import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role   = (session.user as any).role;

  // Admin/manager see all; employee sees own
  const where = ["admin", "manager"].includes(role) ? {} : { userId };

  const leaves = await prisma.leaveRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user:       { select: { id: true, name: true, employeeId: true, designation: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(leaves);
}

export async function POST(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { type, startDate, endDate, reason } = await req.json();

  if (!type || !startDate || !endDate)
    return NextResponse.json({ error: "Type, start and end date required" }, { status: 400 });

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (end < start)
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });

  // Calculate working days (Mon-Fri)
  let days = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days++;
    d.setDate(d.getDate() + 1);
  }

  const leave = await prisma.leaveRequest.create({
    data: { userId, type, startDate: start, endDate: end, days, reason: reason?.trim() || null },
    include: {
      user:       { select: { id: true, name: true, employeeId: true, designation: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(leave, { status: 201 });
}
