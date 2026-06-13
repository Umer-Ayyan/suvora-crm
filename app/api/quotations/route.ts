import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getMobileOrWebSession } from "@/lib/mobile-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "manager"].includes((session.user as any).role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const quotations = await prisma.quotation.findMany({
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, company: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotations);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getMobileOrWebSession(req, authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "manager"].includes((session.user as any).role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });

    const body = await req.json();
    const { clientName, clientEmail, clientCompany, clientId, validUntil, items, discountPct, taxPct, notes, terms } = body;

    if (!clientName?.trim()) return NextResponse.json({ error: "Client name required" }, { status: 400 });
    if (!items?.length)       return NextResponse.json({ error: "At least one item required" }, { status: 400 });

    // Generate quotation number
    const count = await prisma.quotation.count();
    const number = `QT-${String(count + 1).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = items.reduce((s: number, i: any) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
    const discount = subtotal * (Number(discountPct || 0) / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (Number(taxPct || 0) / 100);
    const total = afterDiscount + tax;

    const quotation = await prisma.quotation.create({
      data: {
        number,
        clientName:    clientName.trim(),
        clientEmail:   clientEmail?.trim()   || null,
        clientCompany: clientCompany?.trim() || null,
        clientId:      clientId              || null,
        validUntil:    validUntil ? new Date(validUntil) : null,
        discountPct:   Number(discountPct || 0),
        taxPct:        Number(taxPct      || 0),
        subtotal,
        total,
        notes:         notes?.trim()  || null,
        terms:         terms?.trim()  || null,
        createdById:   user?.id       || null,
        items: {
          create: items.map((item: any, i: number) => ({
            description: item.description.trim(),
            quantity:    Number(item.quantity),
            unitPrice:   Number(item.unitPrice),
            amount:      Number(item.quantity) * Number(item.unitPrice),
            order:       i,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    await prisma.activityLog.create({
      data: {
        action: "QUOTATION_CREATED",
        description: `${user?.name} created quotation ${number} for ${clientName}`,
        userId: user?.id,
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
