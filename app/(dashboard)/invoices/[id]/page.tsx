import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import InvoiceActions from "@/components/invoices/invoice-actions";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  unpaid:  { label: "Unpaid",  color: "#fcd34d", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  paid:    { label: "Paid",    color: "#6ee7b7", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
  overdue: { label: "Overdue", color: "#f87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
  partial: { label: "Partial", color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)"  },
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["admin", "manager"].includes((session.user as any).role)) redirect("/");

  const { id } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { order: "asc" } },
      client: { select: { id: true, company: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!inv) redirect("/invoices");

  const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.unpaid;
  const discount = inv.subtotal * (inv.discountPct / 100);
  const afterDiscount = inv.subtotal - discount;
  const tax = afterDiscount * (inv.taxPct / 100);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-slide-up">
      <Link href="/invoices" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Invoices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{inv.number}</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Created {new Date(inv.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
            {inv.createdBy && ` by ${inv.createdBy.name}`}
          </p>
          {inv.paidAt && (
            <p className="text-sm mt-0.5" style={{ color: "#6ee7b7" }}>
              Paid on {new Date(inv.paidAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/print/invoices/${inv.id}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / PDF
          </Link>
          <InvoiceActions invoiceId={inv.id} currentStatus={inv.status} total={inv.total} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Bill To</p>
          <p className="text-base font-semibold text-white">{inv.clientCompany || inv.clientName}</p>
          {inv.clientCompany && <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{inv.clientName}</p>}
          {inv.clientEmail && <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{inv.clientEmail}</p>}
          {inv.client && <Link href={`/clients/${inv.client.id}`} className="text-xs mt-2 inline-block" style={{ color: "#a78bfa" }}>View Client →</Link>}
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Details</p>
          <div className="space-y-2">
            {[
              { label: "Invoice No.", value: inv.number },
              { label: "Issue Date",  value: new Date(inv.issueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) },
              { label: "Due Date",    value: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—" },
              ...(inv.quotationNumber ? [{ label: "From Quotation", value: inv.quotationNumber }] : []),
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.45)" }}>{r.label}</span>
                <span className="text-white font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["#", "Description", "Qty", "Unit Price", "Amount"].map((h) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${["Amount","Unit Price","Qty"].includes(h) ? "text-right" : "text-left"}`}
                  style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: i < inv.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
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
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {inv.notes && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Notes</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{inv.notes}</p>
            </div>
          )}
          {inv.terms && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Terms</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{inv.terms}</p>
            </div>
          )}
        </div>
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span style={{ color: "rgba(255,255,255,0.5)" }}>Subtotal</span><span className="text-white font-medium">${inv.subtotal.toLocaleString()}</span></div>
            {inv.discountPct > 0 && <div className="flex justify-between text-sm"><span style={{ color: "rgba(255,255,255,0.5)" }}>Discount ({inv.discountPct}%)</span><span style={{ color: "#fca5a5" }}>-${discount.toFixed(2)}</span></div>}
            {inv.taxPct > 0 && <div className="flex justify-between text-sm"><span style={{ color: "rgba(255,255,255,0.5)" }}>Tax ({inv.taxPct}%)</span><span style={{ color: "#fcd34d" }}>+${tax.toFixed(2)}</span></div>}
            <div className="flex justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-base font-bold text-white">Total</span>
              <span className="text-2xl font-bold" style={{ color: "#6ee7b7" }}>${inv.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
