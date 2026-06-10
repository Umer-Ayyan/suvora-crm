import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TaskBoard from "@/components/tasks/task-board";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const employeeId = (session.user as any).employeeId;
  const isAdmin = ["admin", "manager"].includes(role);

  const currentUser = await prisma.user.findUnique({ where: { employeeId } });

  const [tasks, employees, leads, clients] = await Promise.all([
    prisma.task.findMany({
      where: isAdmin ? {} : { assignedToId: currentUser?.id },
      include: {
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        createdBy:  { select: { id: true, name: true } },
        lead:       { select: { id: true, name: true, company: true } },
        client:     { select: { id: true, name: true, company: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),

    isAdmin
      ? prisma.user.findMany({
          where: { role: { in: ["employee", "manager"] } },
          select: { id: true, name: true, employeeId: true },
          orderBy: { name: "asc" },
        })
      : [],

    isAdmin
      ? prisma.lead.findMany({
          select: { id: true, name: true, company: true },
          orderBy: { name: "asc" },
          take: 100,
        })
      : [],

    isAdmin
      ? prisma.client.findMany({
          select: { id: true, name: true, company: true },
          orderBy: { name: "asc" },
        })
      : [],
  ]);

  const pending     = tasks.filter((t) => t.status === "pending").length;
  const inProgress  = tasks.filter((t) => t.status === "in_progress").length;
  const completed   = tasks.filter((t) => t.status === "completed").length;
  const overdue     = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {isAdmin ? "Manage and assign tasks across the team" : "Your assigned tasks"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: "Pending",     value: pending,    color: "#94a3b8" },
          { label: "In Progress", value: inProgress, color: "#60a5fa" },
          { label: "Completed",   value: completed,  color: "#6ee7b7" },
          { label: "Overdue",     value: overdue,    color: "#f87171" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <TaskBoard
        initialTasks={tasks}
        employees={employees}
        isAdmin={isAdmin}
        leads={leads}
        clients={clients}
      />
    </div>
  );
}
