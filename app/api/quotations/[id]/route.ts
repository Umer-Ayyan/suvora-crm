import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { orderBy: { order: "asc" } },
        client: { select: { id: true, company: true } },
        createdBy: { select: { name: true, employeeId: true } },
      },
    });
    if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(quotation);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!["admin", "manager"].includes((session?.user as any)?.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    // If only updating status
    if (body.status && Object.keys(body).length === 1) {
      const q = await prisma.quotation.update({ where: { id }, data: { status: body.status } });
      return NextResponse.json(q);
    }

    // Full update with items
    const { items, discountPct, taxPct, ...rest } = body;

    const subtotal = items?.reduce((s: number, i: any) => s + (Number(i.quantity) * Number(i.unitPrice)), 0) ?? 0;
    const discount = subtotal * (Number(discountPct || 0) / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (Number(taxPct || 0) / 100);
    const total = afterDiscount + tax;

    // Delete old items and recreate
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        ...rest,
        discountPct: Number(discountPct || 0),
        taxPct: Number(taxPct || 0),
        subtotal,
        total,
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

    return NextResponse.json(quotation);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await prisma.quotation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
