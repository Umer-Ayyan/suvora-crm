import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const employeeId = (session.user as any).employeeId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");
    const leadId = searchParams.get("leadId");
    const clientId = searchParams.get("clientId");

    const where: any = {};
    if (role === "employee") {
      const user = await prisma.user.findUnique({ where: { employeeId } });
      if (!user) return NextResponse.json([], { status: 200 });
      where.assignedToId = user.id;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        createdBy:  { select: { id: true, name: true } },
        lead:       { select: { id: true, name: true, company: true } },
        client:     { select: { id: true, name: true, company: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (role === "employee") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, description, status, priority, dueDate, assignedToId, leadId, clientId } = body;
    if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const creator = await prisma.user.findUnique({ where: { employeeId: (session.user as any).employeeId } });

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || "pending",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        createdById: creator?.id || null,
        leadId: leadId || null,
        clientId: clientId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        lead:       { select: { id: true, name: true } },
        client:     { select: { id: true, name: true } },
      },
    });

    if (assignedToId) {
      await prisma.notification.create({
        data: {
          title: "New Task Assigned",
          message: `You have been assigned: "${title.trim()}"`,
          type: "info",
          link: "/tasks",
          userId: assignedToId,
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: "TASK_CREATED",
        description: `${creator?.name || "Admin"} created task: "${title.trim()}"`,
        userId: creator?.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
