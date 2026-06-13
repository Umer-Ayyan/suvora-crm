import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["admin", "manager"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, date, notes } = await req.json();
    if (!userId || !date) {
      return NextResponse.json({ error: "userId and date are required" }, { status: 400 });
    }

    const dateObj = new Date(date);

    const record = await prisma.attendance.upsert({
      where: { userId_date: { userId, date: dateObj } },
      update: { status: "leave", deductionPct: 0, notes: notes || null },
      create: { userId, date: dateObj, status: "leave", deductionPct: 0, notes: notes || null },
    });

    return NextResponse.json(record);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
