import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ leads: [], clients: [], employees: [], tasks: [] });

    const search = { contains: q, mode: "insensitive" as const };

    const [leads, clients, employees, tasks] = await Promise.all([
      prisma.lead.findMany({
        where: { OR: [{ name: search }, { company: search }, { email: search }, { phone: search }] },
        select: { id: true, name: true, company: true, status: true, priority: true },
        take: 8,
      }),

      prisma.client.findMany({
        where: { OR: [{ name: search }, { company: search }, { email: search }] },
        select: { id: true, name: true, company: true, status: true },
        take: 5,
      }),

      role !== "employee"
        ? prisma.user.findMany({
            where: { OR: [{ name: search }, { employeeId: search }] },
            select: { id: true, name: true, employeeId: true, role: true },
            take: 5,
          })
        : [],

      prisma.task.findMany({
        where: {
          OR: [{ title: search }, { description: search }],
          ...(role === "employee" ? { assignedTo: { employeeId: (session.user as any).employeeId } } : {}),
        },
        select: { id: true, title: true, status: true, priority: true },
        take: 5,
      }),
    ]);

    return NextResponse.json({ leads, clients, employees, tasks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
