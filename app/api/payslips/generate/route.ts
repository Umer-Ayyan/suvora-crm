import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getWorkingDaysInMonth(year: number, month: number): number {
  // month is 1-based
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0) count++; // skip Sunday only
  }
  return count;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const generatorEmployeeId = (session?.user as any)?.employeeId;

    if (!["admin", "manager"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, month, year } = body;

    if (!userId || !month || !year) {
      return NextResponse.json({ error: "userId, month and year required" }, { status: 400 });
    }

    const employee = await prisma.user.findUnique({ where: { id: userId } });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const generator = await prisma.user.findUnique({ where: { employeeId: generatorEmployeeId } });

    // Fetch all attendance records for this employee in this month
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const attendances = await prisma.attendance.findMany({
      where: { userId, date: { gte: start, lt: end } },
    });

    const workingDays = getWorkingDaysInMonth(year, month);
    const dailySalary = employee.salary / workingDays;

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let totalDeduction = 0;

    // Count each status
    for (const a of attendances) {
      if (a.status === "present") presentDays++;
      else if (a.status === "late") { lateDays++; totalDeduction += dailySalary * 0.25; }
      else if (a.status === "half_day") { halfDays++; totalDeduction += dailySalary * 0.50; }
      else if (a.status === "absent") { totalDeduction += dailySalary * 1.0; }
    }

    // Days with no record = absent
    const markedDays = attendances.length;
    const unmarkedAbsent = Math.max(0, workingDays - markedDays);
    const absentDays = attendances.filter((a) => a.status === "absent").length + unmarkedAbsent;
    totalDeduction += unmarkedAbsent * dailySalary;

    const netSalary = Math.max(0, employee.salary - totalDeduction);

    const payslip = await prisma.payslip.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: {
        baseSalary: employee.salary,
        workingDays,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        totalDeduction: Math.round(totalDeduction * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100,
        generatedById: generator?.id,
        generatedAt: new Date(),
      },
      create: {
        userId,
        month,
        year,
        baseSalary: employee.salary,
        workingDays,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        totalDeduction: Math.round(totalDeduction * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100,
        generatedById: generator?.id,
      },
    });

    return NextResponse.json(payslip);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
