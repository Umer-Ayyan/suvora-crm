import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/push";
import { NextRequest, NextResponse, after } from "next/server";

// PATCH — approve/reject (admin/manager) or cancel own pending leave (employee)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileOrWebSession(req, authOptions);
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

  // Notify the requester when a reviewer approves/rejects.
  if (["approved", "rejected"].includes(status) && ["admin", "manager"].includes(role)) {
    after(async () => {
      try {
        await notify(updated.userId, {
          title: `Leave ${status === "approved" ? "Approved" : "Rejected"}`,
          message: `Your ${updated.type} leave request has been ${status}.`,
          type: status === "approved" ? "success" : "warning",
          link: "/leaves",
          data: { type: "leave", leaveId: updated.id },
        });
      } catch (err) {
        console.error("[leave status push]", err);
      }
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileOrWebSession(req, authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.leaveRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
