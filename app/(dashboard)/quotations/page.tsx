import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateQuotation from "@/components/quotations/create-quotation";
import QuotationActions from "@/components/quotations/quotation-actions";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:    { label: "Draft",    color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  sent:     { label: "Sent",     color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)"  },
  accepted: { label: "Accepted", color: "#6ee7b7", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)"  },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)"   },
  expired:  { label: "Expired",  color: "#fcd34d", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)"  },
};

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["admin", "manager"].includes((session.user as any).role)) redirect("/");

  const quotations = await prisma.quotation.findMany({
    include: {
      items: true,
      client: { select: { id: true, company: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const clients = await prisma.client.findMany({
    where: { status: "active" },
    select: { id: true, name: true, company: true, email: true },
    orderBy: { company: "asc" },
  });

  // Stats
  const totalValue    = quotations.reduce((s, q) => s + q.total, 0);
  const accepted      = quotations.filter((q) => q.status === "accepted");
  const acceptedValue = accepted.reduce((s, q) => s + q.total, 0);
  const pending       = quotations.filter((q) => ["draft", "sent"].includes(q.status));

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Quotations</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Generate and manage client quotations
          </p>
        </div>
        <CreateQuotation clients={clients} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total",    value: quotations.length,  color: "#a78bfa", sub: "quotations" },
          { label: "Pending",  value: pending.length,     color: "#60a5fa", sub: "draft + sent" },
          { label: "Accepted", value: accepted.length,    color: "#6ee7b7", sub: `$${acceptedValue.toLocaleString()}` },
          { label: "Pipeline", value: `$${totalValue.toLocaleString()}`, color: "#fcd34d", sub: "total value" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {quotations.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,158,11,0.12)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#fcd34d" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white font-semibold mb-1">No quotations yet</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Create your first quotation using the button above.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Number", "Client", "Items", "Subtotal", "Discount", "Tax", "Total", "Status", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotations.map((q, i) => {
                const cfg = STATUS_CFG[q.status] ?? STATUS_CFG.draft;
                return (
                  <tr key={q.id}
                    className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < quotations.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <td className="px-4 py-3">
                      <Link href={`/quotations/${q.id}`} className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                        {q.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{q.clientCompany || q.clientName}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{q.clientName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{q.items.length}</td>
                    <td className="px-4 py-3 text-sm text-white">${q.subtotal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#fca5a5" }}>
                      {q.discountPct > 0 ? `-${q.discountPct}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#fcd34d" }}>
                      {q.taxPct > 0 ? `+${q.taxPct}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: "#6ee7b7" }}>
                      ${q.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {new Date(q.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <QuotationActions quotationId={q.id} currentStatus={q.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
