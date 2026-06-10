import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddClientForm from "@/components/clients/add-client-form";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:   { color: "#6ee7b7", bg: "rgba(16,185,129,0.12)"  },
  inactive: { color: "#f87171", bg: "rgba(239,68,68,0.12)"   },
};

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const isAdmin = ["admin", "manager"].includes(role);

  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { leads: true, tasks: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const active   = clients.filter((c) => c.status === "active").length;
  const inactive = clients.filter((c) => c.status === "inactive").length;
  const totalRev = clients.reduce((s, c) => s + c.totalRevenue, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isAdmin && <AddClientForm />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-7">
        {[
          { label: "Active Clients",   value: active,   color: "#6ee7b7" },
          { label: "Inactive",         value: inactive, color: "#f87171" },
          { label: "Total Revenue",    value: `Rs. ${Math.round(totalRev).toLocaleString()}`, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {clients.length === 0 ? (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.12)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <p className="text-white font-semibold mb-1">No clients yet</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Add your first client to get started</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Company","Contact","Industry","Leads","Tasks","Revenue","Status",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.02)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => {
                const sc = STATUS_COLORS[c.status] ?? STATUS_COLORS.active;
                return (
                  <tr key={c.id}
                    style={{ borderBottom: i < clients.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                          {c.company[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{c.company}</p>
                          {c.website && (
                            <a href={c.website} target="_blank" rel="noopener noreferrer"
                              className="text-xs hover:underline" style={{ color: "rgba(255,255,255,0.4)" }}>
                              {c.website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{c.name}</p>
                      {c.email && <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {c.industry || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#c4b5fd" }}>
                      {c._count.leads}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#67e8f9" }}>
                      {c._count.tasks}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#6ee7b7" }}>
                      {c.totalRevenue > 0 ? `Rs. ${Math.round(c.totalRevenue).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                        style={{ background: sc.bg, color: sc.color }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/clients/${c.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.25)" }}>
                        View
                      </Link>
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
