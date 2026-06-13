import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined)        data.title = body.title;
    if (body.description !== undefined)  data.description = body.description;
    if (body.status !== undefined)       data.status = body.status;
    if (body.priority !== undefined)     data.priority = body.priority;
    if (body.dueDate !== undefined)      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null;
    if (body.leadId !== undefined)       data.leadId = body.leadId || null;
    if (body.clientId !== undefined)     data.clientId = body.clientId || null;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        lead:       { select: { id: true, name: true } },
        client:     { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(task);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    const role = (session?.user as any)?.role;
    if (!["admin", "manager"].includes(role)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
