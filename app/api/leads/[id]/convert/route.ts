import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

// POST /api/leads/[id]/convert  — convert a won lead into a client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["admin", "manager"].includes(role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (lead.status !== "won")
      return NextResponse.json({ error: "Only won leads can be converted" }, { status: 400 });
    if (lead.clientId)
      return NextResponse.json({ error: "Already converted" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });

    // Create client from lead data
    const client = await prisma.client.create({
      data: {
        name:        lead.name,
        company:     lead.company || lead.name,
        email:       lead.email   || null,
        phone:       lead.phone   || null,
        country:     lead.country || null,
        industry:    lead.industry || null,
        notes:       lead.notes   || null,
        status:      "active",
        totalRevenue: lead.dealValue || 0,
        createdById: user?.id || null,
      },
    });

    // Link lead to new client
    await prisma.lead.update({
      where: { id },
      data: { clientId: client.id },
    });

    await prisma.activityLog.create({
      data: {
        action: "LEAD_CONVERTED",
        description: `${user?.name || "User"} converted lead "${lead.name}" to client`,
        userId: user?.id,
      },
    });

    return NextResponse.json({ ok: true, clientId: client.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
