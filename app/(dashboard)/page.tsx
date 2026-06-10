import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

async function getAdminStats() {
  const totalLeads = await prisma.lead.count();
  const proposalSent = await prisma.lead.count({ where: { status: "proposal" } });
  const closedDeals = await prisma.lead.count({ where: { status: "won" } });

  const leadsWithValue = await prisma.lead.findMany({ select: { dealValue: true } });
  const totalPipelineValue = leadsWithValue.reduce((sum: any, lead: any) => sum + (lead.dealValue || 0), 0);

  const wonLeads = await prisma.lead.findMany({ where: { status: "won" }, select: { dealValue: true } });
  const wonRevenue = wonLeads.reduce((sum: any, lead: any) => sum + (lead.dealValue || 0), 0);

  const deals = leadsWithValue.filter((lead: any) => lead.dealValue !== null);
  const averageDealSize = deals.length > 0 ? deals.reduce((sum: any, lead: any) => sum + (lead.dealValue || 0), 0) / deals.length : 0;

  const employeeStats = await prisma.user.findMany({ where: { role: "employee" }, include: { leads: true } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysFollowUps = await prisma.lead.findMany({
    where: { followUpDate: { gte: today, lt: tomorrow } },
    orderBy: { followUpDate: "asc" },
    include: { createdBy: true },
    take: 10,
  });

  const overdueLeads = await prisma.lead.findMany({
    where: { followUpDate: { lt: today }, NOT: { status: "won" } },
    orderBy: { followUpDate: "asc" },
    include: { createdBy: true },
    take: 10,
  });

  return { totalLeads, proposalSent, closedDeals, totalPipelineValue, wonRevenue, averageDealSize, employeeStats, todaysFollowUps, overdueLeads };
}

async function getEmployeeStats(employeeId: string) {
  return prisma.user.findUnique({ where: { employeeId }, include: { leads: true } });
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div
      className="card-accent-border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

function LeadRow({ lead, showOwner = false }: { lead: any; showOwner?: boolean }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white/5 group"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}
        >
          {lead.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{lead.name}</p>
          {showOwner && lead.createdBy?.name && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lead.createdBy.name}</p>
          )}
        </div>
      </div>
      <span
        className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full"
        style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.25)" }}
      >
        {lead.priority || "medium"}
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;

  if (role === "employee") {
    const employee = await getEmployeeStats((session.user as any).employeeId);
    if (!employee) redirect("/login");

    const totalLeads = employee.leads.length;
    const proposalSent = employee.leads.filter((l: any) => l.status === "proposal").length;
    const wonDeals = employee.leads.filter((l: any) => l.status === "won").length;
    const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : "0";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysFollowUps = employee.leads.filter((l: any) => l.followUpDate && new Date(l.followUpDate) >= today && new Date(l.followUpDate) < tomorrow);
    const overdueLeads = employee.leads.filter((l: any) => l.followUpDate && new Date(l.followUpDate) < today && l.status !== "won");

    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-slide-up">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Welcome back, {session.user?.name}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard label="My Leads" value={totalLeads} color="#a78bfa" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          <StatCard label="Proposals" value={proposalSent} color="#67e8f9" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <StatCard label="Won Deals" value={wonDeals} color="#6ee7b7" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard label="Conversion" value={`${conversionRate}%`} color="#fcd34d" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
          <StatCard label="Follow-ups" value={todaysFollowUps.length} color="#93c5fd" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
          <StatCard label="Overdue" value={overdueLeads.length} color="#fca5a5" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold mb-4 text-white">Today&apos;s Follow-ups</h2>
            <div className="space-y-1">
              {todaysFollowUps.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>No follow-ups today</p>
              ) : (
                todaysFollowUps.map((lead: any) => <LeadRow key={lead.id} lead={lead} />)
              )}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <h2 className="text-base font-semibold mb-4 text-red-400">Overdue Leads</h2>
            <div className="space-y-1">
              {overdueLeads.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>No overdue leads</p>
              ) : (
                overdueLeads.map((lead: any) => <LeadRow key={lead.id} lead={lead} />)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = await getAdminStats();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Pipeline overview & team performance
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
        <StatCard label="Total Leads" value={stats.totalLeads} color="#a78bfa" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard label="Proposal Sent" value={stats.proposalSent} color="#67e8f9" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
        <StatCard label="Won Deals" value={stats.closedDeals} color="#6ee7b7" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Follow-ups Today" value={stats.todaysFollowUps.length} color="#93c5fd" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <StatCard label="Overdue" value={stats.overdueLeads.length} color="#fca5a5" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div
          className="rounded-2xl p-5 card-accent-border"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>Total Pipeline Value</p>
          <p className="text-3xl font-bold text-emerald-400">${Number(stats.totalPipelineValue).toLocaleString()}</p>
        </div>
        <div
          className="rounded-2xl p-5 card-accent-border"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>Won Revenue</p>
          <p className="text-3xl font-bold" style={{ color: "#34d399" }}>${Number(stats.wonRevenue).toLocaleString()}</p>
        </div>
        <div
          className="rounded-2xl p-5 card-accent-border"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.04))", border: "1px solid rgba(99,102,241,0.2)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>Average Deal Size</p>
          <p className="text-3xl font-bold text-indigo-400">${Math.round(Number(stats.averageDealSize)).toLocaleString()}</p>
        </div>
      </div>

      {/* Follow-ups & Overdue */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold mb-4 text-white">Today&apos;s Follow-ups</h2>
          <div className="space-y-1">
            {stats.todaysFollowUps.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>No follow-ups today</p>
            ) : (
              stats.todaysFollowUps.map((lead: any) => <LeadRow key={lead.id} lead={lead} showOwner />)
            )}
          </div>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <h2 className="text-base font-semibold mb-4 text-red-400">Overdue Leads</h2>
          <div className="space-y-1">
            {stats.overdueLeads.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>No overdue leads</p>
            ) : (
              stats.overdueLeads.map((lead: any) => <LeadRow key={lead.id} lead={lead} showOwner />)
            )}
          </div>
        </div>
      </div>

      {/* Employee Performance */}
      <div>
        <h2 className="text-lg font-semibold mb-5 text-white">Employee Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {stats.employeeStats.map((employee: any) => {
            const wonDeals = employee.leads.filter((l: any) => l.status === "won").length;
            const conversion = employee.leads.length > 0 ? ((wonDeals / employee.leads.length) * 100).toFixed(1) : "0";
            const conversionNum = Number(conversion);

            return (
              <div
                key={employee.id}
                className="rounded-2xl p-5 card-accent-border transition-all duration-200 hover:scale-[1.01]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}
                  >
                    {employee.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{employee.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{employee.employeeId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl py-2.5 px-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xl font-bold text-white">{employee.leads.length}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Leads</p>
                  </div>
                  <div className="rounded-xl py-2.5 px-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xl font-bold text-emerald-400">{wonDeals}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Won</p>
                  </div>
                  <div className="rounded-xl py-2.5 px-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xl font-bold text-violet-400">{conversion}%</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Conv.</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(conversionNum, 100)}%`,
                        background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
