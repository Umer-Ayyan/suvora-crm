import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteEmployee from "@/components/employees/delete-employee";
import ResetPassword from "@/components/employees/reset-password";
import EditEmployeeForm from "@/components/employees/edit-employee-form";

async function getEmployee(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 20 },
      tasksAssigned: { orderBy: { createdAt: "desc" }, take: 10, include: { lead: { select: { name: true } } } },
      attendances: { orderBy: { date: "desc" }, take: 30 },
    },
  });
}

const statusColors: Record<string, { color: string; bg: string }> = {
  new:         { color: "#a5b4fc", bg: "rgba(99,102,241,0.15)" },
  contacted:   { color: "#67e8f9", bg: "rgba(6,182,212,0.15)" },
  qualified:   { color: "#c4b5fd", bg: "rgba(167,139,250,0.15)" },
  proposal:    { color: "#fcd34d", bg: "rgba(245,158,11,0.15)" },
  negotiation: { color: "#fdba74", bg: "rgba(251,146,60,0.15)" },
  won:         { color: "#6ee7b7", bg: "rgba(16,185,129,0.15)" },
  lost:        { color: "#fca5a5", bg: "rgba(239,68,68,0.15)" },
};

const taskStatusColors: Record<string, { color: string; bg: string }> = {
  pending:     { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  in_progress: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  completed:   { color: "#6ee7b7", bg: "rgba(16,185,129,0.12)" },
  cancelled:   { color: "#f87171", bg: "rgba(239,68,68,0.12)" },
};

const attendanceColors: Record<string, string> = {
  present: "#6ee7b7",
  late:    "#fcd34d",
  half_day: "#93c5fd",
  absent:  "#f87171",
  leave:   "#c4b5fd",
};

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "admin") redirect("/");

  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const totalLeads   = employee.leads.length;
  const wonLeads     = employee.leads.filter((l) => l.status === "won").length;
  const lostLeads    = employee.leads.filter((l) => l.status === "lost").length;
  const activeLeads  = employee.leads.filter((l) => !["won","lost"].includes(l.status)).length;
  const wonRevenue   = employee.leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.dealValue || 0), 0);
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  const totalTasks     = employee.tasksAssigned.length;
  const completedTasks = employee.tasksAssigned.filter((t) => t.status === "completed").length;

  const presentDays = employee.attendances.filter((a) => a.status === "present").length;
  const lateDays    = employee.attendances.filter((a) => a.status === "late").length;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-slide-up">
      {/* Back */}
      <div className="mb-6">
        <Link href="/employees" className="inline-flex items-center gap-2 text-sm font-medium hover:text-white transition-all" style={{ color: "rgba(255,255,255,0.5)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Team
        </Link>
      </div>

      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}>
              {employee.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{employee.name}</h1>
                {wonLeads >= 5 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(234,179,8,0.15)", color: "#fcd34d", border: "1px solid rgba(234,179,8,0.3)" }}>
                    🏆 Top Performer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>{employee.employeeId}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                  style={
                    employee.role === "manager"
                      ? { background: "rgba(6,182,212,0.12)", color: "#67e8f9" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }
                  }>
                  {employee.role}
                </span>
                {employee.department && (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{employee.department}</span>
                )}
                {employee.phone && (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{employee.phone}</span>
                )}
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Joined {new Date(employee.createdAt).toLocaleDateString("en-PK", { year:"numeric", month:"short" })}
                </span>
              </div>
              {employee.salary > 0 && (
                <p className="text-sm mt-1 font-semibold" style={{ color: "#6ee7b7" }}>Rs. {employee.salary.toLocaleString()} / month</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <EditEmployeeForm employee={{
              id: employee.id,
              name: employee.name,
              role: employee.role,
              department: employee.department,
              phone: employee.phone,
              salary: employee.salary,
            }} />
            <ResetPassword id={employee.id} />
            <DeleteEmployee id={employee.id} employeeId={employee.employeeId} />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Leads", value: totalLeads, color: "#a78bfa" },
          { label: "Won Deals",   value: wonLeads,   color: "#6ee7b7" },
          { label: "Conversion",  value: `${conversionRate}%`, color: "#fcd34d" },
          { label: "Revenue",     value: `$${wonRevenue.toLocaleString()}`, color: "#34d399" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Lead breakdown */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-4">Lead Breakdown</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Active", value: activeLeads, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
              { label: "Won",    value: wonLeads,    color: "#6ee7b7", bg: "rgba(16,185,129,0.1)" },
              { label: "Lost",   value: lostLeads,   color: "#fca5a5", bg: "rgba(239,68,68,0.1)" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl p-3 text-center" style={{ background: b.bg }}>
                <p className="text-2xl font-bold" style={{ color: b.color }}>{b.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{b.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>Conversion rate</span>
              <span style={{ color: "#a78bfa" }}>{conversionRate}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(Number(conversionRate), 100)}%`, background: "linear-gradient(90deg, #7c3aed, #4f46e5)" }} />
            </div>
          </div>
        </div>

        {/* Tasks + attendance */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-4">Tasks & Attendance</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(96,165,250,0.08)" }}>
              <p className="text-2xl font-bold text-blue-400">{totalTasks}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Total Tasks</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(16,185,129,0.08)" }}>
              <p className="text-2xl font-bold text-emerald-400">{completedTasks}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Completed</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(110,231,183,0.08)" }}>
              <p className="text-2xl font-bold" style={{ color: "#6ee7b7" }}>{presentDays}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Present Days</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(252,211,77,0.08)" }}>
              <p className="text-2xl font-bold text-yellow-300">{lateDays}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Late Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned leads list */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          Assigned Leads
          <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
            {employee.leads.length}
          </span>
        </h2>

        {employee.leads.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>No leads assigned yet</p>
        ) : (
          <div className="space-y-1.5">
            {employee.leads.map((lead) => {
              const sc = statusColors[lead.status] || statusColors.new;
              return (
                <Link key={lead.id} href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                      {lead.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{lead.name}</p>
                      {lead.company && <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lead.company}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.dealValue != null && (
                      <span className="text-xs" style={{ color: "#6ee7b7" }}>${lead.dealValue.toLocaleString()}</span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" style={{ background: sc.bg, color: sc.color }}>
                      {lead.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Assigned tasks */}
      {employee.tasksAssigned.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            Assigned Tasks
            <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
              {employee.tasksAssigned.length}
            </span>
          </h2>
          <div className="space-y-1.5">
            {employee.tasksAssigned.map((task) => {
              const tc = taskStatusColors[task.status] || taskStatusColors.pending;
              return (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    {task.lead && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Lead: {task.lead.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {task.dueDate && (
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {new Date(task.dueDate).toLocaleDateString("en-PK", { month:"short", day:"numeric" })}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                      style={{ background: tc.bg, color: tc.color }}>
                      {task.status.replace("_"," ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
