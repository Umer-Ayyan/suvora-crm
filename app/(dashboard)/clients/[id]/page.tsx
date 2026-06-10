import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EditClientForm from "@/components/clients/edit-client-form";

const STATUS_CFG: Record<string,{label:string;color:string;bg:string}> = {
  new:         { label:"New",         color:"#94a3b8", bg:"rgba(148,163,184,0.12)" },
  contacted:   { label:"Contacted",   color:"#60a5fa", bg:"rgba(96,165,250,0.12)"  },
  qualified:   { label:"Qualified",   color:"#a78bfa", bg:"rgba(167,139,250,0.12)" },
  proposal:    { label:"Proposal",    color:"#f59e0b", bg:"rgba(245,158,11,0.12)"  },
  negotiation: { label:"Negotiation", color:"#fb923c", bg:"rgba(251,146,60,0.12)"  },
  won:         { label:"Won",         color:"#6ee7b7", bg:"rgba(16,185,129,0.12)"  },
  lost:        { label:"Lost",        color:"#f87171", bg:"rgba(239,68,68,0.12)"   },
};

const TASK_CFG: Record<string,{color:string}> = {
  pending:     { color:"#94a3b8" },
  in_progress: { color:"#60a5fa" },
  completed:   { color:"#6ee7b7" },
  cancelled:   { color:"#f87171" },
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as any).role;

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      leads: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id:true, name:true, status:true, dealValue:true, createdAt:true },
      },
      tasks: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!client) redirect("/clients");

  const wonRevenue = client.leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.dealValue || 0), 0);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-slide-up">
      {/* Back */}
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm font-medium mb-6 transition-all hover:text-white"
        style={{ color: "rgba(255,255,255,0.5)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}>
          {client.company[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{client.company}</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{client.name}</p>
          <div className="flex flex-wrap gap-3 mt-2">
            {client.email && <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>✉ {client.email}</span>}
            {client.phone && <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>📞 {client.phone}</span>}
            {client.country && <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>🌍 {client.country}</span>}
            {client.industry && <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>🏭 {client.industry}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize`}
            style={{
              background: client.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              color: client.status === "active" ? "#6ee7b7" : "#f87171",
            }}>
            {client.status}
          </span>
          {(role === "admin" || role === "manager") && (
            <EditClientForm client={client} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label:"Total Leads",   value: client.leads.length, color:"#c4b5fd" },
          { label:"Won Deals",     value: client.leads.filter(l=>l.status==="won").length, color:"#6ee7b7" },
          { label:"Won Revenue",   value: `Rs. ${Math.round(wonRevenue).toLocaleString()}`, color:"#6ee7b7" },
          { label:"Open Tasks",    value: client.tasks.filter(t=>t.status!=="completed"&&t.status!=="cancelled").length, color:"#67e8f9" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color:"rgba(255,255,255,0.4)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Leads */}
        <div className="rounded-2xl p-6"
          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-4">Leads ({client.leads.length})</h2>
          {client.leads.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color:"rgba(255,255,255,0.35)" }}>No leads linked</p>
          ) : (
            <div className="space-y-2">
              {client.leads.map((l) => {
                const sc = STATUS_CFG[l.status] ?? STATUS_CFG.new;
                return (
                  <Link key={l.id} href={`/leads/${l.id}`}
                    className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/5">
                    <p className="text-sm font-medium text-white">{l.name}</p>
                    <div className="flex items-center gap-2">
                      {l.dealValue && l.dealValue > 0 && (
                        <span className="text-xs" style={{ color:"#6ee7b7" }}>
                          Rs. {Math.round(l.dealValue).toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="rounded-2xl p-6"
          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-base font-semibold text-white mb-4">Tasks ({client.tasks.length})</h2>
          {client.tasks.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color:"rgba(255,255,255,0.35)" }}>No tasks linked</p>
          ) : (
            <div className="space-y-2">
              {client.tasks.map((t) => {
                const tc = TASK_CFG[t.status] ?? TASK_CFG.pending;
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background:"rgba(255,255,255,0.03)" }}>
                    <div>
                      <p className="text-sm font-medium text-white">{t.title}</p>
                      {t.assignedTo && (
                        <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,0.4)" }}>
                          → {t.assignedTo.name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ color: tc.color, background: tc.color + "22" }}>
                      {t.status.replace("_"," ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="md:col-span-2 rounded-2xl p-6"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-base font-semibold text-white mb-3">Notes</h2>
            <p className="text-sm whitespace-pre-wrap" style={{ color:"rgba(255,255,255,0.6)" }}>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
