import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AssignEmployee from "@/components/leads/assign-employee";
import LeadManagement from "@/components/leads/lead-management";
import AddActivity from "@/components/leads/add-activity";
import DeleteActivity from "@/components/leads/delete-activity";
import AddNote from "@/components/leads/add-note";
import LeadEditForm from "@/components/leads/lead-edit-form";
import Link from "next/link";

async function getLead(id: string, userId: string, role: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const where = role === "admin" || role === "manager"
    ? { id }
    : { id, createdById: userId };

  return prisma.lead.findFirst({
    where,
    include: {
      createdBy: true,
      client: { select: { id: true, company: true } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
      leadNotes: { include: { user: { select: { name: true, employeeId: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

const statusConfig: Record<string, { bg: string; color: string; border: string }> = {
  new:          { bg: "rgba(99,102,241,0.15)",  color: "#a5b4fc", border: "rgba(99,102,241,0.3)"  },
  contacted:    { bg: "rgba(6,182,212,0.15)",   color: "#67e8f9", border: "rgba(6,182,212,0.3)"   },
  qualified:    { bg: "rgba(167,139,250,0.15)", color: "#c4b5fd", border: "rgba(167,139,250,0.3)" },
  proposal:     { bg: "rgba(245,158,11,0.15)",  color: "#fcd34d", border: "rgba(245,158,11,0.3)"  },
  negotiation:  { bg: "rgba(251,146,60,0.15)",  color: "#fdba74", border: "rgba(251,146,60,0.3)"  },
  won:          { bg: "rgba(16,185,129,0.15)",  color: "#6ee7b7", border: "rgba(16,185,129,0.3)"  },
  lost:         { bg: "rgba(239,68,68,0.15)",   color: "#fca5a5", border: "rgba(239,68,68,0.3)"   },
};

const priorityConfig: Record<string, { bg: string; color: string; border: string }> = {
  high:   { bg: "rgba(239,68,68,0.15)",   color: "#fca5a5", border: "rgba(239,68,68,0.3)"   },
  urgent: { bg: "rgba(239,68,68,0.2)",    color: "#f87171", border: "rgba(239,68,68,0.4)"   },
  medium: { bg: "rgba(245,158,11,0.15)",  color: "#fcd34d", border: "rgba(245,158,11,0.3)"  },
  low:    { bg: "rgba(16,185,129,0.15)",  color: "#6ee7b7", border: "rgba(16,185,129,0.3)"  },
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
        <div className="text-sm font-medium text-white break-words">{value}</div>
      </div>
    </div>
  );
}

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="text-white p-10">Unauthorized</div>;

  const { id } = await params;
  const sessionUser = session.user as any;
  const role = sessionUser.role;

  // Get the actual user record to get the internal id
  const dbUser = await prisma.user.findUnique({ where: { employeeId: sessionUser.employeeId } });
  if (!dbUser) return <div className="text-white p-10">User not found</div>;

  const lead = await getLead(id, dbUser.id, role);
  if (!lead) return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link href="/leads" className="inline-flex items-center gap-2 text-sm mb-6 transition-all hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Leads
      </Link>
      <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-white text-lg font-semibold">Lead not found</p>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>This lead does not exist or you don&apos;t have access to it.</p>
      </div>
    </div>
  );

  const allEmployees = role === "admin"
    ? await prisma.user.findMany({ where: { role: { in: ["employee","manager"] } }, orderBy: { name: "asc" } })
    : [];

  const sConf = statusConfig[lead.status] || statusConfig.new;
  const pConf = priorityConfig[lead.priority || "medium"] || priorityConfig.medium;
  const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && lead.status !== "won" && lead.status !== "lost";
  const isAdmin = role === "admin";

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      {/* Back */}
      <div className="mb-6">
        <Link href="/leads" className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Leads
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}>
            {lead.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
              {[lead.company, lead.country, lead.industry].filter(Boolean).join(" · ") || "No details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize"
            style={{ background: sConf.bg, color: sConf.color, border: `1px solid ${sConf.border}` }}>
            {lead.status}
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full capitalize"
            style={{ background: pConf.bg, color: pConf.color, border: `1px solid ${pConf.border}` }}>
            {lead.priority || "medium"} priority
          </span>
          {isOverdue && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
              ⚠ Overdue
            </span>
          )}
          {lead.source && (
            <span className="text-xs px-3 py-1.5 rounded-full capitalize"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {lead.source.replace("_"," ")}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Contact Info */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold mb-1 text-white">Contact Info</h3>
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Email"
              value={lead.email ? <a href={`mailto:${lead.email}`} className="hover:text-purple-400 transition-colors">{lead.email}</a> : "—"}
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              label="Phone"
              value={lead.phone ? <a href={`tel:${lead.phone}`} className="hover:text-purple-400 transition-colors">{lead.phone}</a> : "—"}
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>}
              label="Country"
              value={lead.country || "—"}
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              label="Company"
              value={lead.company || "—"}
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
              label="Industry"
              value={lead.industry || "—"}
            />
          </div>

          {/* Deal Info */}
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-sm font-semibold mb-1 text-white">Deal Info</h3>
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Budget"
              value={lead.budget || "—"}
            />
            {lead.dealValue != null && (
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                label="Deal Value"
                value={<span className="text-emerald-400 font-semibold">${Number(lead.dealValue).toLocaleString()}</span>}
              />
            )}
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Follow-up Date"
              value={lead.followUpDate ? (
                <span style={{ color: isOverdue ? "#fca5a5" : "white" }}>
                  {new Date(lead.followUpDate).toLocaleDateString("en-PK", { year:"numeric", month:"short", day:"numeric" })}
                  {isOverdue && <span className="ml-2 text-xs text-red-400">· Overdue</span>}
                </span>
              ) : "Not set"}
            />
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Assigned To"
              value={lead.createdBy?.name || "Unassigned"}
            />
            {lead.client && (
              <InfoRow
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="Client"
                value={<Link href={`/clients/${lead.client.id}`} className="text-purple-400 hover:text-purple-300 transition-colors">{lead.client.company}</Link>}
              />
            )}
            <InfoRow
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Created"
              value={new Date(lead.createdAt).toLocaleDateString("en-PK", { year:"numeric", month:"short", day:"numeric" })}
            />
          </div>

          {lead.notes && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-sm font-semibold mb-3 text-white">Notes</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.65)" }}>{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Management panel */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold mb-5 text-white">Manage Lead</h2>
            <LeadManagement
              leadId={lead.id}
              currentStatus={lead.status}
              currentPriority={lead.priority}
              currentFollowUpDate={lead.followUpDate}
            />
          </div>

          {/* Edit lead details */}
          {isAdmin && (
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <LeadEditForm lead={{
                id: lead.id,
                name: lead.name,
                company: lead.company,
                email: lead.email,
                phone: (lead as any).phone,
                country: (lead as any).country,
                industry: (lead as any).industry,
                budget: lead.budget,
                dealValue: lead.dealValue,
                source: lead.source,
                notes: lead.notes,
              }} />
            </div>
          )}

          {/* Lead Notes */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
              Notes
              <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
                {(lead as any).leadNotes?.length || 0}
              </span>
            </h2>

            {(lead as any).leadNotes?.length > 0 && (
              <div className="space-y-3 mb-5">
                {(lead as any).leadNotes.map((note: any) => (
                  <div key={note.id} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {note.user?.name || "Unknown"} · {new Date(note.createdAt).toLocaleDateString("en-PK", { month:"short", day:"numeric", year:"numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <AddNote leadId={lead.id} />
          </div>

          {/* Activity Timeline */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold mb-5 text-white flex items-center gap-2">
              Activity Timeline
              <span className="text-xs px-2 py-0.5 rounded-full font-normal" style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
                {lead.activities.length}
              </span>
            </h2>

            <div className="space-y-3">
              {lead.activities.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>No activity yet</p>
              ) : (
                lead.activities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-3 p-4 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                      {activity.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{activity.note}</p>
                      <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {activity.user?.name || "Unknown"} · {new Date(activity.createdAt).toLocaleDateString("en-PK", { month:"short", day:"numeric", year:"numeric" })}
                      </p>
                    </div>
                    {isAdmin && (
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
            <h2 className="text-base font-semibold mb-4 text-white">Log Activity</h2>
            <AddActivity leadId={lead.id} />
          </div>

          {/* Reassign — admin only */}
          {isAdmin && (
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-base font-semibold mb-4 text-white">Reassign Lead</h2>
              <AssignEmployee leadId={lead.id} employees={allEmployees} currentEmployeeId={lead.createdById} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
