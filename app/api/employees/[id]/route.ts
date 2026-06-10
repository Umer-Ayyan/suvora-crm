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
    if (body.name?.trim())              data.name = body.name.trim();
    if (body.role)                      data.role = body.role;
    if (body.department !== undefined)  data.department = body.department || null;
    if (body.phone !== undefined)       data.phone = body.phone || null;
    if (body.email !== undefined)       data.email = body.email || null;
    if (body.salary !== undefined)      data.salary = Number(body.salary);
    if (body.designation !== undefined) data.designation = body.designation || null;
    if (body.joiningDate !== undefined) data.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null;
    if (body.cnic !== undefined)        data.cnic = body.cnic || null;
    if (body.address !== undefined)     data.address = body.address || null;
    if (body.city !== undefined)        data.city = body.city || null;
    if (body.emergencyContactName !== undefined)  data.emergencyContactName = body.emergencyContactName || null;
    if (body.emergencyContactPhone !== undefined) data.emergencyContactPhone = body.emergencyContactPhone || null;
    if (body.bankName !== undefined)    data.bankName = body.bankName || null;
    if (body.bankAccount !== undefined) data.bankAccount = body.bankAccount || null;
    if (body.bloodGroup !== undefined)  data.bloodGroup = body.bloodGroup || null;
    if (body.gender !== undefined)      data.gender = body.gender || null;
    if (body.status !== undefined)      data.status = body.status || "active";

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
