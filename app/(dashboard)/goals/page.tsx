import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SetGoalModal from "@/components/goals/set-goal-modal";
import GoalCard from "@/components/goals/goal-card";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TYPE_CFG: Record<string, { label: string; color: string; icon: string }> = {
  leads:   { label: "Leads",        color: "#a78bfa", icon: "👥" },
  revenue: { label: "Revenue",      color: "#6ee7b7", icon: "💰" },
  tasks:   { label: "Tasks Done",   color: "#60a5fa", icon: "✅" },
  custom:  { label: "Custom",       color: "#fcd34d", icon: "🎯" },
};

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const sessionUserId = (session.user as any).id;

  // Auto-sync auto-trackable goals for current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Get goals
  const where =
    role === "employee"
      ? { userId: sessionUserId }
      : {};

  const goals = await prisma.goal.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, employeeId: true, department: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  // Auto-sync current period goals
  const autoGoals = goals.filter(
    (g) => g.type !== "custom" && g.year === currentYear && g.month === currentMonth
  );
  for (const g of autoGoals) {
    const startDate = new Date(g.year, (g.month ?? 1) - 1, 1);
    const endDate   = new Date(g.year, g.month ?? 1, 1);
    let current = 0;
    if (g.type === "leads") {
      current = await prisma.lead.count({ where: { createdById: g.userId, createdAt: { gte: startDate, lt: endDate } } });
    } else if (g.type === "revenue") {
      const r = await prisma.lead.aggregate({ _sum: { dealValue: true }, where: { createdById: g.userId, status: "won", updatedAt: { gte: startDate, lt: endDate } } });
      current = r._sum.dealValue || 0;
    } else if (g.type === "tasks") {
      current = await prisma.task.count({ where: { createdById: g.userId, status: "done", updatedAt: { gte: startDate, lt: endDate } } });
    }
    if (current !== g.currentValue) {
      await prisma.goal.update({ where: { id: g.id }, data: { currentValue: current } });
      g.currentValue = current;
    }
  }

  // Employees for dropdown (admin/manager only)
  const employees = role === "employee" ? [] : await prisma.user.findMany({
    where: { role: "employee" },
    select: { id: true, name: true, employeeId: true, department: true },
    orderBy: { name: "asc" },
  });

  // Stats
  const total = goals.length;
  const achieved = goals.filter((g) => g.currentValue >= g.targetValue).length;
  const inProgress = goals.filter((g) => g.currentValue > 0 && g.currentValue < g.targetValue).length;
  const notStarted = goals.filter((g) => g.currentValue === 0).length;

  // Group by employee for admin/manager view
  const grouped: Record<string, typeof goals> = {};
  if (role !== "employee") {
    for (const g of goals) {
      const key = g.user.id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(g);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Goals & Targets</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {role === "employee" ? "Your performance goals" : "Set and track employee goals"}
          </p>
        </div>
        {role !== "employee" && <SetGoalModal employees={employees} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Goals",  value: total,      color: "#a78bfa" },
          { label: "Achieved",     value: achieved,   color: "#6ee7b7" },
          { label: "In Progress",  value: inProgress, color: "#60a5fa" },
          { label: "Not Started",  value: notStarted, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-white font-semibold mb-1">No goals set yet</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {role === "employee" ? "Your manager hasn't set any goals for you yet." : "Set goals for your employees to track their performance."}
          </p>
        </div>
      ) : role === "employee" ? (
        // Employee: flat list of own goals
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} role={role} typeCfg={TYPE_CFG} months={MONTHS} />
          ))}
        </div>
      ) : (
        // Admin/Manager: grouped by employee
        <div className="space-y-8">
          {Object.entries(grouped).map(([, empGoals]) => {
            const emp = empGoals[0].user;
            const empAchieved = empGoals.filter((g) => g.currentValue >= g.targetValue).length;
            return (
              <div key={emp.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                    {emp.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{emp.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {emp.employeeId}{emp.department ? ` · ${emp.department}` : ""}
                      {" · "}<span style={{ color: "#6ee7b7" }}>{empAchieved}/{empGoals.length} achieved</span>
                    </p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {empGoals.map((g) => (
                    <GoalCard key={g.id} goal={g} role={role} typeCfg={TYPE_CFG} months={MONTHS} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
