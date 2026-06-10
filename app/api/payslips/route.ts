import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const employeeId = (session.user as any).employeeId;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const where: any = {};

    if (role === "employee") {
      const user = await prisma.user.findUnique({ where: { employeeId } });
      if (!user) return NextResponse.json([], { status: 200 });
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, employeeId: true } },
        generatedBy: { select: { name: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(payslips);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
