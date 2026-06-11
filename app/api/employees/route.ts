import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!["admin", "manager"].includes((session?.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
      where: { role: { in: ["employee", "manager"] } },
      select: { id: true, name: true, employeeId: true, role: true, department: true, salary: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(employees);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name?.trim() || !body.password?.trim()) {
      return NextResponse.json({ error: "Name and password required" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const allEmployees = await prisma.user.findMany({ select: { employeeId: true } });
    const empNumbers = allEmployees
      .filter((e) => e.employeeId.startsWith("EMP"))
      .map((e) => Number(e.employeeId.replace("EMP", "")))
      .filter((n) => !isNaN(n));
    const highestNumber = empNumbers.length > 0 ? Math.max(...empNumbers) : 0;
    const nextEmployeeId = `EMP${String(highestNumber + 1).padStart(3, "0")}`;

    const employee = await prisma.user.create({
      data: {
        name: body.name.trim(),
        employeeId: nextEmployeeId,
        password: hashedPassword,
        role: body.role === "manager" ? "manager" : "employee",
        salary: Number(body.salary) || 0,
        department: body.department?.trim() || null,
        phone: body.phone?.trim() || null,
        customRoleId: body.customRoleId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "EMPLOYEE_CREATED",
        description: `New ${employee.role} added: ${employee.name} (${employee.employeeId})`,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
