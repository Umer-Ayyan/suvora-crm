import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });
    if (!user) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const status    = searchParams.get("status");
    const source    = searchParams.get("source");
    const priority  = searchParams.get("priority");
    const assignedTo = searchParams.get("assignedTo");

    const where: any = {};
    if (user.role === "employee") where.createdById = user.id;
    else if (assignedTo) where.createdById = assignedTo;
    if (status)   where.status   = status;
    if (source)   where.source   = source;
    if (priority) where.priority = priority;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, employeeId: true } },
        client:    { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Lead name required" }, { status: 400 });

    const lead = await prisma.lead.create({
      data: {
        name:         body.name.trim(),
        company:      body.company?.trim()  || null,
        email:        body.email?.trim()    || null,
        phone:        body.phone?.trim()    || null,
        country:      body.country?.trim()  || null,
        industry:     body.industry?.trim() || null,
        source:       body.source           || "other",
        budget:       body.budget?.trim()   || null,
        dealValue:    body.dealValue        ? Number(body.dealValue) : null,
        notes:        body.notes?.trim()    || null,
        followUpDate: body.followUpDate     ? new Date(body.followUpDate) : null,
        priority:     body.priority         || "medium",
        status:       "new",
        createdById:  user.id,
        clientId:     body.clientId         || null,
      },
      include: {
        createdBy: { select: { id: true, name: true, employeeId: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "LEAD_CREATED",
        description: `${user.name} created lead "${lead.name}"`,
        userId: user.id,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
