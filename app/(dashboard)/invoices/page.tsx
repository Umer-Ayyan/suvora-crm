import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["admin", "manager"].includes((session.user as any).role)) redirect("/");

  return (
    <div className="p-8 max-w-4xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Track and manage client invoices
        </p>
      </div>

      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.12)" }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#6ee7b7" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Invoice Module Coming Soon</h2>
        <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
          Create and manage professional invoices with automatic status tracking, payment reminders, and PDF generation.
        </p>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Paid",    value: "0", color: "#6ee7b7", bg: "rgba(16,185,129,0.1)" },
            { label: "Unpaid",  value: "0", color: "#fcd34d", bg: "rgba(245,158,11,0.1)" },
            { label: "Overdue", value: "0", color: "#f87171", bg: "rgba(239,68,68,0.1)"  },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: s.bg }}>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
