import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
  const targetUserId = searchParams.get("userId");

  // Employees can only see their own goals
  // Admins/managers can see anyone's goals
  const filterUserId =
    role === "employee" ? userId : (targetUserId || undefined);

  const goals = await prisma.goal.findMany({
    where: {
      ...(filterUserId ? { userId: filterUserId } : {}),
      year,
      ...(month !== null ? { month } : {}),
    },
    include: {
      user: { select: { id: true, name: true, employeeId: true, department: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const creatorId = (session.user as any).id;
  if (!["admin", "manager"].includes(role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId, title, type, targetValue, period, month, year, notes } = body;

  if (!userId || !title || !targetValue || !year)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      userId,
      title,
      type: type || "leads",
      targetValue: parseFloat(targetValue),
      period: period || "monthly",
      month: month ? parseInt(month) : null,
      year: parseInt(year),
      notes: notes || null,
      createdById: creatorId,
    },
    include: {
      user: { select: { id: true, name: true, employeeId: true } },
    },
  });

  // Auto-calculate current value for auto-trackable types
  await syncGoalProgress(goal.id);

  return NextResponse.json(goal);
}

// Helper: sync progress for a goal based on its type
async function syncGoalProgress(goalId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return;

  let current = 0;
  const startDate = goal.month
    ? new Date(goal.year, goal.month - 1, 1)
    : new Date(goal.year, 0, 1);
  const endDate = goal.month
    ? new Date(goal.year, goal.month, 1)
    : new Date(goal.year + 1, 0, 1);

  if (goal.type === "leads") {
    current = await prisma.lead.count({
      where: {
        createdById: goal.userId,
        createdAt: { gte: startDate, lt: endDate },
      },
    });
  } else if (goal.type === "revenue") {
    const result = await prisma.lead.aggregate({
      _sum: { dealValue: true },
      where: {
        createdById: goal.userId,
        status: "won",
        updatedAt: { gte: startDate, lt: endDate },
      },
    });
    current = result._sum.dealValue || 0;
  } else if (goal.type === "tasks") {
    current = await prisma.task.count({
      where: {
        createdById: goal.userId,
        status: "done",
        updatedAt: { gte: startDate, lt: endDate },
      },
    });
  }

  if (goal.type !== "custom") {
    await prisma.goal.update({ where: { id: goalId }, data: { currentValue: current } });
  }
}
