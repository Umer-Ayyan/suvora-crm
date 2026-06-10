import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import QuotationActions from "@/components/quotations/quotation-actions";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft:    { label: "Draft",    color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
  sent:     { label: "Sent",     color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.2)"  },
  accepted: { label: "Accepted", color: "#6ee7b7", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)"  },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)"   },
  expired:  { label: "Expired",  color: "#fcd34d", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)"  },
};

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["admin", "manager"].includes((session.user as any).role)) redirect("/");

  const { id } = await params;
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      client: { select: { id: true, company: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!q) redirect("/quotations");

  const cfg = STATUS_CFG[q.status] ?? STATUS_CFG.draft;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-slide-up">
      {/* Back */}
      <Link href="/quotations" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "rgba(255,255,255,0.4)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Quotations
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{q.number}</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Created {new Date(q.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
            {q.createdBy && ` by ${q.createdBy.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/quotations/${q.id}/print`} target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / PDF
          </Link>
          <QuotationActions quotationId={q.id} currentStatus={q.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Client info */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Bill To</p>
          <p className="text-base font-semibold text-white">{q.clientCompany || q.clientName}</p>
          {q.clientCompany && <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{q.clientName}</p>}
          {q.clientEmail && <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{q.clientEmail}</p>}
          {q.client && (
            <Link href={`/clients/${q.client.id}`} className="text-xs mt-2 inline-block" style={{ color: "#a78bfa" }}>
              View Client →
            </Link>
          )}
        </div>

        {/* Dates */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Details</p>
          <div className="space-y-2">
            {[
              { label: "Quotation No.", value: q.number },
              { label: "Issue Date", value: new Date(q.issueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) },
              { label: "Valid Until", value: q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.45)" }}>{r.label}</span>
                <span className="text-white font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["#", "Description", "Qty", "Unit Price", "Amount"].map((h) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${h === "Amount" || h === "Unit Price" || h === "Qty" ? "text-right" : "text-left"}`}
                  style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: i < q.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>{i + 1}</td>
                <td className="px-4 py-3 text-sm text-white">{item.description}</td>
                <td className="px-4 py-3 text-sm text-right text-white">{item.quantity}</td>
                <td className="px-4 py-3 text-sm text-right text-white">${item.unitPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: "#6ee7b7" }}>${item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + Notes */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Notes / Terms */}
        <div className="space-y-4">
          {q.notes && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Notes</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{q.notes}</p>
            </div>
          )}
          {q.terms && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Terms & Conditions</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{q.terms}</p>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Subtotal</span>
              <span className="text-white font-medium">${q.subtotal.toLocaleString()}</span>
            </div>
            {q.discountPct > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Discount ({q.discountPct}%)</span>
                <span style={{ color: "#fca5a5" }}>-${(q.subtotal * q.discountPct / 100).toLocaleString()}</span>
              </div>
            )}
            {q.taxPct > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Tax / GST ({q.taxPct}%)</span>
                <span style={{ color: "#fcd34d" }}>+${((q.subtotal - q.subtotal * q.discountPct / 100) * q.taxPct / 100).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-base font-bold text-white">Total</span>
              <span className="text-2xl font-bold" style={{ color: "#6ee7b7" }}>${q.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
