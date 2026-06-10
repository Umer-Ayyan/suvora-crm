import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { id } = await params;
  const body = await req.json();

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Employees can only update currentValue on custom goals
  if (role === "employee") {
    if (goal.type !== "custom")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const updated = await prisma.goal.update({
      where: { id },
      data: { currentValue: parseFloat(body.currentValue) },
    });
    return NextResponse.json(updated);
  }

  // Admin/manager can update anything
  const updated = await prisma.goal.update({
    where: { id },
    data: {
      title: body.title ?? goal.title,
      type: body.type ?? goal.type,
      targetValue: body.targetValue != null ? parseFloat(body.targetValue) : goal.targetValue,
      currentValue: body.currentValue != null ? parseFloat(body.currentValue) : goal.currentValue,
      period: body.period ?? goal.period,
      month: body.month != null ? parseInt(body.month) : goal.month,
      year: body.year != null ? parseInt(body.year) : goal.year,
      notes: body.notes ?? goal.notes,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
