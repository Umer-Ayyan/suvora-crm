import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clients = await prisma.client.findMany({
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { leads: true, tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (e) {
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
    const { name, company, email, phone, country, industry, website, notes } = body;
    if (!name?.trim() || !company?.trim()) return NextResponse.json({ error: "Name and company required" }, { status: 400 });

    const creator = await prisma.user.findUnique({ where: { employeeId: (session.user as any).employeeId } });

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        company: company.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        country: country?.trim() || null,
        industry: industry?.trim() || null,
        website: website?.trim() || null,
        notes: notes?.trim() || null,
        createdById: creator?.id || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "CLIENT_CREATED",
        description: `${creator?.name || "User"} added client: ${company.trim()}`,
        userId: creator?.id,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
