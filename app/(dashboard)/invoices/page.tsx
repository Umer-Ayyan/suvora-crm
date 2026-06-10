import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateInvoice from "@/components/invoices/create-invoice";
import InvoiceActions from "@/components/invoices/invoice-actions";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  unpaid:  { label: "Unpaid",  color: "#fcd34d", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
  paid:    { label: "Paid",    color: "#6ee7b7", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
  overdue: { label: "Overdue", color: "#f87171", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   },
  partial: { label: "Partial", color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)"  },
};

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["admin", "manager"].includes((session.user as any).role)) redirect("/");

  // Auto-mark overdue
  await prisma.invoice.updateMany({
    where: { status: "unpaid", dueDate: { lt: new Date() } },
    data: { status: "overdue" },
  });

  const invoices = await prisma.invoice.findMany({
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

  const paid    = invoices.filter((i) => i.status === "paid");
  const unpaid  = invoices.filter((i) => i.status === "unpaid");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const paidRevenue   = paid.reduce((s, i) => s + i.total, 0);
  const unpaidRevenue = [...unpaid, ...overdue].reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Track and manage client invoices</p>
        </div>
        <CreateInvoice clients={clients} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total",      value: invoices.length,              color: "#a78bfa", sub: "invoices" },
          { label: "Paid",       value: `$${paidRevenue.toLocaleString()}`, color: "#6ee7b7", sub: `${paid.length} invoices` },
          { label: "Unpaid",     value: `$${unpaidRevenue.toLocaleString()}`, color: "#fcd34d", sub: `${unpaid.length} pending` },
          { label: "Overdue",    value: overdue.length,               color: "#f87171", sub: "need attention" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.1)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#6ee7b7" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-white font-semibold mb-1">No invoices yet</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Create your first invoice using the button above.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Invoice", "Client", "Total", "Status", "Due Date", "Issued", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const cfg = STATUS_CFG[inv.status] ?? STATUS_CFG.unpaid;
                const isOverdue = inv.status === "overdue";
                return (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < invoices.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`} className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                        {inv.number}
                      </Link>
                      {inv.quotationNumber && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>from {inv.quotationNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{inv.clientCompany || inv.clientName}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{inv.clientName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: "#6ee7b7" }}>${inv.total.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: isOverdue ? "#f87171" : "rgba(255,255,255,0.5)" }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {new Date(inv.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceActions invoiceId={inv.id} currentStatus={inv.status} total={inv.total} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
