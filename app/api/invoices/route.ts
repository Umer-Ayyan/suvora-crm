import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "manager"].includes((session.user as any).role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Auto-mark overdue
    await prisma.invoice.updateMany({
      where: { status: "unpaid", dueDate: { lt: new Date() } },
      data: { status: "overdue" },
    });

    const invoices = await prisma.invoice.findMany({
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, company: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "manager"].includes((session.user as any).role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { employeeId: (session.user as any).employeeId },
    });

    const body = await req.json();
    const { clientName, clientEmail, clientCompany, clientId, dueDate, items, discountPct, taxPct, notes, terms, quotationId, quotationNumber } = body;

    if (!clientName?.trim()) return NextResponse.json({ error: "Client name required" }, { status: 400 });
    if (!items?.length) return NextResponse.json({ error: "At least one item required" }, { status: 400 });

    const count = await prisma.invoice.count();
    const number = `INV-${String(count + 1).padStart(4, "0")}`;

    const subtotal = items.reduce((s: number, i: any) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
    const discount = subtotal * (Number(discountPct || 0) / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (Number(taxPct || 0) / 100);
    const total = afterDiscount + tax;

    const invoice = await prisma.invoice.create({
      data: {
        number,
        clientName:    clientName.trim(),
        clientEmail:   clientEmail?.trim()   || null,
        clientCompany: clientCompany?.trim() || null,
        clientId:      clientId              || null,
        dueDate:       dueDate ? new Date(dueDate) : null,
        discountPct:   Number(discountPct || 0),
        taxPct:        Number(taxPct || 0),
        subtotal, total,
        notes:         notes?.trim()   || null,
        terms:         terms?.trim()   || null,
        quotationId:   quotationId     || null,
        quotationNumber: quotationNumber || null,
        createdById:   user?.id        || null,
        items: {
          create: items.map((item: any, i: number) => ({
            description: item.description.trim(),
            quantity:    Number(item.quantity),
            unitPrice:   Number(item.unitPrice),
            amount:      Number(item.quantity) * Number(item.unitPrice),
            order: i,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    await prisma.activityLog.create({
      data: {
        action: "INVOICE_CREATED",
        description: `${user?.name} created invoice ${number} for ${clientName}`,
        userId: user?.id,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
