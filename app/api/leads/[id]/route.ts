import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, employeeId: true } },
        client: { select: { id: true, company: true } },
        activities: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        leadNotes: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(lead);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (user.role !== "admin" && user.role !== "manager" && lead.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Build update data — only include defined fields
    const data: Record<string, any> = {};

    // Full edit fields (admin only)
    if (user.role === "admin") {
      if (body.name !== undefined) data.name = body.name;
      if (body.company !== undefined) data.company = body.company;
      if (body.email !== undefined) data.email = body.email;
      if (body.phone !== undefined) data.phone = body.phone;
      if (body.country !== undefined) data.country = body.country;
      if (body.industry !== undefined) data.industry = body.industry;
      if (body.budget !== undefined) data.budget = body.budget;
      if (body.dealValue !== undefined) data.dealValue = body.dealValue !== null ? Number(body.dealValue) : null;
      if (body.source !== undefined) data.source = body.source;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.createdById !== undefined) data.createdById = body.createdById;
    }

    // Status/priority/followUpDate — any authorized user can change
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.followUpDate !== undefined) {
      data.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updatedLead = await prisma.lead.update({ where: { id }, data });

    // Log significant changes
    const logs: Promise<any>[] = [];

    if (body.status && body.status !== lead.status) {
      logs.push(
        prisma.leadActivity.create({
          data: { note: `Status changed: ${lead.status} → ${body.status}`, leadId: id, userId: user.id },
        }),
        prisma.activityLog.create({
          data: { action: "STATUS_CHANGED", description: `${user.name} changed "${lead.name}" to ${body.status}`, userId: user.id },
        })
      );
    }

    if (body.priority && body.priority !== lead.priority) {
      logs.push(
        prisma.leadActivity.create({
          data: { note: `Priority changed: ${lead.priority} → ${body.priority}`, leadId: id, userId: user.id },
        })
      );
    }

    if (body.followUpDate !== undefined && String(lead.followUpDate || "") !== String(body.followUpDate || "")) {
      logs.push(
        prisma.leadActivity.create({
          data: { note: body.followUpDate ? `Follow-up scheduled for ${body.followUpDate}` : "Follow-up date removed", leadId: id, userId: user.id },
        })
      );
    }

    if (body.createdById !== undefined && body.createdById !== lead.createdById) {
      const newOwner = await prisma.user.findUnique({ where: { id: body.createdById } });
      logs.push(
        prisma.leadActivity.create({
          data: { note: `Lead reassigned to ${newOwner?.name || "Unknown"}`, leadId: id, userId: user.id },
        }),
        prisma.activityLog.create({
          data: { action: "LEAD_REASSIGNED", description: `${user.name} reassigned "${lead.name}" to ${newOwner?.name}`, userId: user.id },
        })
      );
    }

    if (body.name && body.name !== lead.name) {
      logs.push(
        prisma.activityLog.create({
          data: { action: "LEAD_UPDATED", description: `${user.name} updated lead details for "${body.name}"`, userId: user.id },
        })
      );
    }

    await Promise.all(logs);

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("PATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.lead.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: "LEAD_DELETED",
        description: `${(session?.user as any)?.name} deleted lead "${lead.name}"`,
        userId: (session?.user as any)?.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
