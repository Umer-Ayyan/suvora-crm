import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!["admin", "manager"].includes((session.user as any).role)) redirect("/");

  return (
    <div className="p-8 max-w-4xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Quotations</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Generate professional quotes for clients
        </p>
      </div>

      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(245,158,11,0.12)" }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#fcd34d" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Quotation Generator Coming Soon</h2>
        <p className="text-sm max-w-lg mx-auto mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Create professional, branded quotations with service line items, discounts, tax calculations, and PDF export in one click.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left mt-8">
          {[
            { label: "Service Line Items",   desc: "Add services with qty & unit price" },
            { label: "Discount & Tax",        desc: "Apply percentage-based discounts and GST" },
            { label: "Client Selection",      desc: "Link quotes directly to clients" },
            { label: "PDF Export",            desc: "One-click branded PDF generation" },
          ].map((f) => (
            <div key={f.label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-semibold text-white mb-1">{f.label}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
