import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CalendarClient from "./calendar-client";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const employeeId = (session.user as any).employeeId;
  const user = await prisma.user.findUnique({ where: { employeeId } });
  if (!user) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: {
      followUpDate: { not: null },
      ...(role === "employee" ? { createdById: user.id } : {}),
    },
    select: { id: true, name: true, company: true, followUpDate: true, status: true, priority: true },
    orderBy: { followUpDate: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { not: null },
      ...(role === "employee" ? { assignedToId: user.id } : {}),
    },
    select: { id: true, title: true, dueDate: true, status: true, priority: true },
    orderBy: { dueDate: "asc" },
  });

  return <CalendarClient leads={leads} tasks={tasks} />;
}
