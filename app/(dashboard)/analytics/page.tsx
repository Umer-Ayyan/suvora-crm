import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "admin") redirect("/");

  // ── Lead stats ────────────────────────────────────────────────────────────
  const allLeads = await prisma.lead.findMany({
    select: { status: true, priority: true, source: true, dealValue: true, createdAt: true, createdById: true },
  });

  const totalLeads      = allLeads.length;
  const wonLeads        = allLeads.filter((l) => l.status === "won");
  const lostLeads       = allLeads.filter((l) => l.status === "lost");
  const activeLeads     = allLeads.filter((l) => !["won","lost"].includes(l.status));
  const wonRevenue      = wonLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
  const pipelineValue   = allLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
  const conversionRate  = totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) : "0";
  const avgDeal         = wonLeads.length > 0 ? wonRevenue / wonLeads.length : 0;

  // Status breakdown
  const statusBreakdown = [
    { label: "New",         key: "new",         color: "#a5b4fc" },
    { label: "Contacted",   key: "contacted",   color: "#67e8f9" },
    { label: "Qualified",   key: "qualified",   color: "#c4b5fd" },
    { label: "Proposal",    key: "proposal",    color: "#fcd34d" },
    { label: "Negotiation", key: "negotiation", color: "#fdba74" },
    { label: "Won",         key: "won",         color: "#6ee7b7" },
    { label: "Lost",        key: "lost",        color: "#fca5a5" },
  ].map((s) => ({ ...s, count: allLeads.filter((l) => l.status === s.key).length }));

  // Source breakdown
  const sourceMap = allLeads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});
  const sourceBreakdown = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  // Priority breakdown
  const priorityMap = allLeads.reduce<Record<string, number>>((acc, l) => {
    const p = l.priority || "medium";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  // Monthly leads (last 6 months)
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = allLeads.filter((l) => new Date(l.createdAt) >= d && new Date(l.createdAt) < next).length;
    const won   = allLeads.filter((l) => l.status === "won" && new Date(l.createdAt) >= d && new Date(l.createdAt) < next).length;
    return { label: d.toLocaleDateString("en-PK", { month: "short" }), count, won };
  });
  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

  // ── Employee performance ──────────────────────────────────────────────────
  const employees = await prisma.user.findMany({
    where: { role: "employee" },
    include: { leads: { select: { status: true, dealValue: true } } },
    orderBy: { name: "asc" },
  });

  const employeeStats = employees
    .map((e) => ({
      id: e.id,
      name: e.name,
      employeeId: e.employeeId,
      total: e.leads.length,
      won: e.leads.filter((l) => l.status === "won").length,
      revenue: e.leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.dealValue || 0), 0),
      conversion: e.leads.length > 0 ? ((e.leads.filter((l) => l.status === "won").length / e.leads.length) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.won - a.won);

  // ── Client stats ──────────────────────────────────────────────────────────
  const clients = await prisma.client.findMany({
    include: { leads: { select: { status: true, dealValue: true } } },
    orderBy: { totalRevenue: "desc" },
    take: 10,
  });

  const totalClients  = await prisma.client.count();
  const activeClients = await prisma.client.count({ where: { status: "active" } });

  // ── Task stats ────────────────────────────────────────────────────────────
  const taskStats = await prisma.task.groupBy({ by: ["status"], _count: { id: true } });
  const taskMap   = Object.fromEntries(taskStats.map((t) => [t.status, t._count.id]));

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Sales performance, pipeline health & team metrics</p>
      </div>

      {/* ── Top KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Leads",    value: totalLeads,                           color: "#a78bfa", sub: `${activeLeads.length} active` },
          { label: "Won Deals",      value: wonLeads.length,                      color: "#6ee7b7", sub: `${lostLeads.length} lost` },
          { label: "Conversion Rate",value: `${conversionRate}%`,                 color: "#fcd34d", sub: "won / total leads" },
          { label: "Won Revenue",    value: `$${wonRevenue.toLocaleString()}`,     color: "#34d399", sub: `Pipeline: $${pipelineValue.toLocaleString()}` },
          { label: "Avg Deal Size",  value: `$${Math.round(avgDeal).toLocaleString()}`, color: "#93c5fd", sub: `${wonLeads.length} won deals` },
          { label: "Total Clients",  value: totalClients,                         color: "#67e8f9", sub: `${activeClients} active` },
          { label: "Tasks Done",     value: taskMap["completed"] || 0,            color: "#6ee7b7", sub: `${taskMap["pending"] || 0} pending` },
          { label: "Team Size",      value: employees.length,                     color: "#c4b5fd", sub: "active members" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ── Monthly trend ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-5">Lead Trend (Last 6 Months)</h2>
          <div className="flex items-end gap-3 h-40">
            {monthlyData.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? 8 : 0 }}>
                  <div className="w-full rounded-t-md flex-1" style={{ background: "rgba(124,58,237,0.5)" }} />
                  {m.won > 0 && (
                    <div className="w-full" style={{ height: `${(m.won / m.count) * 100}%`, background: "rgba(16,185,129,0.7)", borderRadius: "0 0 4px 4px" }} />
                  )}
                </div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</p>
                <p className="text-xs font-semibold text-white">{m.count}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(124,58,237,0.5)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Created</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(16,185,129,0.7)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Won</span>
            </div>
          </div>
        </div>

        {/* ── Status breakdown ──────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-5">Pipeline Breakdown</h2>
          <div className="space-y-3">
            {statusBreakdown.map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                  <span className="text-xs font-semibold text-white">{s.count} <span style={{ color: "rgba(255,255,255,0.4)" }}>({totalLeads > 0 ? ((s.count/totalLeads)*100).toFixed(0) : 0}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: totalLeads > 0 ? `${(s.count/totalLeads)*100}%` : "0%", background: s.color + "80" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ── Lead sources ──────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-5">Lead Sources</h2>
          <div className="space-y-3">
            {sourceBreakdown.map(([src, count]) => {
              const pct = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : "0";
              return (
                <div key={src} className="flex items-center gap-3">
                  <div className="w-24 text-xs capitalize" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {src.replace("_", " ")}
                  </div>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #4f46e5)" }} />
                  </div>
                  <span className="text-xs font-semibold text-white w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Priority distribution ─────────────────────────────────────── */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-5">Priority Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "high",   label: "High",   color: "#fca5a5", bg: "rgba(239,68,68,0.1)" },
              { key: "medium", label: "Medium", color: "#fcd34d", bg: "rgba(245,158,11,0.1)" },
              { key: "low",    label: "Low",    color: "#6ee7b7", bg: "rgba(16,185,129,0.1)" },
            ].map((p) => (
              <div key={p.key} className="rounded-xl p-4 text-center" style={{ background: p.bg }}>
                <p className="text-2xl font-bold" style={{ color: p.color }}>{priorityMap[p.key] || 0}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{p.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold text-white mb-3">Task Status</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "pending",     label: "Pending",     color: "#94a3b8" },
                { key: "in_progress", label: "In Progress", color: "#60a5fa" },
                { key: "completed",   label: "Completed",   color: "#6ee7b7" },
                { key: "cancelled",   label: "Cancelled",   color: "#f87171" },
              ].map((t) => (
                <div key={t.key} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-xs" style={{ color: t.color }}>{t.label}</span>
                  <span className="text-sm font-bold text-white">{taskMap[t.key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Employee leaderboard ──────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 className="text-base font-semibold text-white mb-5">Employee Performance Leaderboard</h2>
        {employeeStats.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.35)" }}>No team data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Rank", "Employee", "Total Leads", "Won", "Lost", "Conversion", "Revenue"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employeeStats.map((emp, i) => (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < employeeStats.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: i === 0 ? "#fcd34d" : i === 1 ? "#94a3b8" : i === 2 ? "#fdba74" : "rgba(255,255,255,0.3)" }}>
                      #{i + 1} {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/employees/${emp.id}`} className="flex items-center gap-2 hover:text-violet-400 transition-colors">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                          {emp.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{emp.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{emp.total}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#6ee7b7" }}>{emp.won}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#fca5a5" }}>{emp.total - emp.won - (emp.total > 0 ? 0 : 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(Number(emp.conversion),100)}%`, background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "#a78bfa" }}>{emp.conversion}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#34d399" }}>
                      ${emp.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Top clients ──────────────────────────────────────────────────── */}
      {clients.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-5">Top Clients by Revenue</h2>
          <div className="space-y-3">
            {clients.map((client) => {
              const clientRevenue = client.leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.dealValue || 0), 0);
              const maxRev = clients.reduce((m, c) => Math.max(m, c.leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.dealValue || 0), 0)), 1);
              return (
                <div key={client.id} className="flex items-center gap-4">
                  <Link href={`/clients/${client.id}`} className="w-32 text-sm font-medium text-white hover:text-violet-400 transition-colors truncate">
                    {client.company}
                  </Link>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${(clientRevenue / maxRev) * 100}%`, background: "linear-gradient(90deg, #06b6d4, #0891b2)" }} />
                  </div>
                  <span className="text-sm font-semibold w-24 text-right" style={{ color: "#67e8f9" }}>
                    ${clientRevenue.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
