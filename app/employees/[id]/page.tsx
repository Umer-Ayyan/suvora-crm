import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteEmployee from "@/components/employees/delete-employee";
import ResetPassword from "@/components/employees/reset-password";

async function getEmployee(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { leads: true },
  });
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  new: { color: "#a5b4fc", bg: "rgba(99,102,241,0.15)" },
  contacted: { color: "#67e8f9", bg: "rgba(6,182,212,0.15)" },
  proposal: { color: "#fcd34d", bg: "rgba(245,158,11,0.15)" },
  won: { color: "#6ee7b7", bg: "rgba(16,185,129,0.15)" },
  lost: { color: "#fca5a5", bg: "rgba(239,68,68,0.15)" },
};

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const totalLeads = employee.leads.length;
  const newLeads = employee.leads.filter((l) => l.status === "new").length;
  const contactedLeads = employee.leads.filter((l) => l.status === "contacted").length;
  const proposalLeads = employee.leads.filter((l) => l.status === "proposal").length;
  const wonLeads = employee.leads.filter((l) => l.status === "won").length;
  const lostLeads = employee.leads.filter((l) => l.status === "lost").length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  const breakdown = [
    { label: "New", value: newLeads, color: "#a5b4fc", bg: "rgba(99,102,241,0.12)" },
    { label: "Contacted", value: contactedLeads, color: "#67e8f9", bg: "rgba(6,182,212,0.12)" },
    { label: "Proposal", value: proposalLeads, color: "#fcd34d", bg: "rgba(245,158,11,0.12)" },
    { label: "Won", value: wonLeads, color: "#6ee7b7", bg: "rgba(16,185,129,0.12)" },
    { label: "Lost", value: lostLeads, color: "#fca5a5", bg: "rgba(239,68,68,0.12)" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-slide-up">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:text-white"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Employees
        </Link>
      </div>

      {/* Header card */}
      <div
        className="rounded-2xl p-6 mb-6 card-accent-border"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}
            >
              {employee.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{employee.name}</h1>
                {wonLeads >= 5 && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(234,179,8,0.15)", color: "#fcd34d", border: "1px solid rgba(234,179,8,0.3)" }}
                  >
                    🏆 Top Performer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  ID: {employee.employeeId}
                </span>
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                  style={
                    employee.role === "admin"
                      ? { background: "rgba(124,58,237,0.15)", color: "#c4b5fd" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }
                  }
                >
                  {employee.role}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Joined {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {employee.role !== "admin" && (
            <div className="flex items-center gap-2">
              <ResetPassword id={employee.id} />
              <DeleteEmployee id={employee.id} employeeId={employee.employeeId} />
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Leads", value: totalLeads, color: "#a78bfa" },
          { label: "Won", value: wonLeads, color: "#6ee7b7" },
          { label: "Lost", value: lostLeads, color: "#fca5a5" },
          { label: "Conversion", value: `${conversionRate}%`, color: "#93c5fd" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 card-accent-border"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              {s.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-base font-semibold text-white mb-5">Lead Breakdown</h2>
        <div className="grid grid-cols-5 gap-3">
          {breakdown.map((b) => (
            <div key={b.label} className="rounded-xl p-4 text-center" style={{ background: b.bg }}>
              <p className="text-2xl font-bold" style={{ color: b.color }}>{b.value}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{b.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span>Conversion rate</span>
            <span style={{ color: "#a78bfa" }}>{conversionRate}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(Number(conversionRate), 100)}%`,
                background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-base font-semibold text-white mb-4">
          Recent Leads
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
            style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}
          >
            {employee.leads.length}
          </span>
        </h2>

        {employee.leads.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>No leads assigned</p>
        ) : (
          <div className="space-y-2">
            {employee.leads.slice(0, 10).map((lead) => {
              const sc = statusConfig[lead.status] || statusConfig.new;
              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors duration-150 group hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}
                    >
                      {lead.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                        {lead.name}
                      </p>
                      {lead.company && (
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lead.company}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{ background: sc.bg, color: sc.color }}
                  >
                    {lead.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
