import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH — approve/reject (admin/manager) or cancel own pending leave (employee)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role   = (session.user as any).role;
  const { id } = await params;
  const { status, reviewNote } = await req.json();

  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Employee can only cancel their own pending request
  if (!["admin", "manager"].includes(role)) {
    if (leave.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (status !== "cancelled") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (leave.status !== "pending") return NextResponse.json({ error: "Can only cancel pending requests" }, { status: 400 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      reviewedById: ["approved", "rejected"].includes(status) ? userId : undefined,
      reviewNote: reviewNote?.trim() || null,
    },
    include: {
      user:       { select: { id: true, name: true, employeeId: true, designation: true } },
      reviewedBy: { select: { id: true, name: true } },
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
  await prisma.leaveRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
