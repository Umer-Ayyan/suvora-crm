import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data: any = {};

    // Profile fields
    if (body.name?.trim())       data.name = body.name.trim();
    if (body.role)               data.role = body.role;
    if (body.department !== undefined) data.department = body.department || null;
    if (body.phone !== undefined)      data.phone = body.phone || null;
    if (body.salary !== undefined)     data.salary = Number(body.salary);

    // Password reset
    if (body.password?.trim()) {
      data.password = await bcrypt.hash(body.password.trim(), 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true, name: updated.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const employee = await prisma.user.findUnique({ where: { id } });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (employee.role === "admin") return NextResponse.json({ error: "Cannot delete admin" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
