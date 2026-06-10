import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AssignEmployee from "@/components/leads/assign-employee";
import LeadManagement from "@/components/leads/lead-management";
import AddActivity from "@/components/leads/add-activity";
import DeleteActivity from "@/components/leads/delete-activity";
import Link from "next/link";

async function getLead(id: string, employeeId: string, role: string) {
  const user = await prisma.user.findUnique({ where: { employeeId } });
  if (!user) return null;

  if (role === "admin") {
    return prisma.lead.findUnique({
      where: { id },
      include: { createdBy: true, activities: { include: { user: true }, orderBy: { createdAt: "desc" } } },
    });
  }
  return prisma.lead.findFirst({
    where: { id, createdById: user.id },
    include: { createdBy: true, activities: { include: { user: true }, orderBy: { createdAt: "desc" } } },
  });
}

const statusConfig: Record<string, { bg: string; color: string; border: string }> = {
  new: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "rgba(99,102,241,0.3)" },
  contacted: { bg: "rgba(6,182,212,0.15)", color: "#67e8f9", border: "rgba(6,182,212,0.3)" },
  proposal: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d", border: "rgba(245,158,11,0.3)" },
  won: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "rgba(16,185,129,0.3)" },
  lost: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.3)" },
};

const priorityConfig: Record<string, { bg: string; color: string; border: string }> = {
  high: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "rgba(239,68,68,0.3)" },
  medium: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d", border: "rgba(245,158,11,0.3)" },
  low: { bg: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "rgba(16,185,129,0.3)" },
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  );
}

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="text-white p-10">Unauthorized</div>;

  const { id } = await params;
  const lead = await getLead(id, (session.user as any).employeeId, (session.user as any).role);
  if (!lead) return <div className="text-white p-10">Lead not found</div>;

  const employees =
    (session.user as any).role === "admin"
      ? await prisma.user.findMany({ where: { role: "employee" }, orderBy: { name: "asc" } })
      : [];

  const sConf = statusConfig[lead.status] || statusConfig.new;
  const pConf = priorityConfig[lead.priority || "medium"] || priorityConfig.medium;
  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && lead.status !== "won";

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:text-white"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Leads
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}
          >
            {lead.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {lead.company || "No Company"} {lead.source && `· ${lead.source}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize" style={{ background: sConf.bg, color: sConf.color, border: `1px solid ${sConf.border}` }}>
            {lead.status}
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize" style={{ background: pConf.bg, color: pConf.color, border: `1px solid ${pConf.border}` }}>
            {lead.priority || "medium"} priority
          </span>
          {isOverdue && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
              Overdue
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left column — info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold mb-3 text-white">Lead Details</h3>
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              label="Company"
              value={lead.company || "—"}
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Email"
              value={<span className="break-all">{lead.email || "—"}</span>}
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Budget"
              value={lead.budget || "—"}
            />
            {(lead as any).dealValue != null && (
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                label="Deal Value"
                value={<span className="text-emerald-400">${Number((lead as any).dealValue).toLocaleString()}</span>}
              />
            )}
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Follow-up Date"
              value={
                lead.followUpDate ? (
                  <span style={{ color: isOverdue ? "#fca5a5" : "white" }}>
                    {new Date(lead.followUpDate).toISOString().split("T")[0]}
                    {isOverdue && <span className="ml-2 text-xs text-red-400">· Overdue</span>}
                  </span>
                ) : "Not scheduled"
              }
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Assigned To"
              value={lead.createdBy?.name || "Unassigned"}
            />
          </div>

          {lead.notes && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-sm font-semibold mb-3 text-white">Notes</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Management */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold mb-5 text-white">Lead Management</h2>
            <LeadManagement
              leadId={lead.id}
              currentStatus={lead.status}
              currentPriority={lead.priority}
              currentFollowUpDate={lead.followUpDate}
            />
          </div>

          {/* Timeline */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold mb-5 text-white">
              Activity Timeline
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
                {lead.activities.length}
              </span>
            </h2>

            <div className="space-y-3">
              {lead.activities.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>No activity yet</p>
              ) : (
                lead.activities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-4 rounded-xl transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}
                    >
                      {activity.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{activity.note}</p>
                      <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {activity.user?.name} · {new Date(activity.createdAt).toISOString().split("T")[0]}
                      </p>
                    </div>
                    {(session.user as any).role === "admin" && (
                      <div className="flex-shrink-0">
                        <DeleteActivity id={activity.id} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Activity */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold mb-4 text-white">Add Activity</h2>
            <AddActivity leadId={lead.id} />
          </div>

          {/* Reassign */}
          {(session.user as any).role === "admin" && (
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-base font-semibold mb-4 text-white">Reassign Lead</h2>
              <AssignEmployee leadId={lead.id} employees={employees} currentEmployeeId={lead.createdById} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
