"use client";

import { useRouter } from "next/navigation";
import StatusSelect from "./status-select";
import DeleteLead from "./delete-lead";
import { useSession } from "next-auth/react";

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  new: { bg: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "rgba(99,102,241,0.25)" },
  contacted: { bg: "rgba(6,182,212,0.12)", color: "#67e8f9", border: "rgba(6,182,212,0.25)" },
  proposal: { bg: "rgba(245,158,11,0.12)", color: "#fcd34d", border: "rgba(245,158,11,0.25)" },
  won: { bg: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "rgba(16,185,129,0.25)" },
  lost: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.25)" },
};

const priorityStyles: Record<string, { bg: string; color: string }> = {
  high: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5" },
  medium: { bg: "rgba(245,158,11,0.12)", color: "#fcd34d" },
  low: { bg: "rgba(16,185,129,0.12)", color: "#6ee7b7" },
};

export default function LeadsTable({ leads }: { leads: any[] }) {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Name", "Company", "Email", "Budget", "Priority", "Follow-up", "Owner", "Status", ...(session?.user?.role === "admin" ? [""] : [])].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.02)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {leads.map((lead, i) => {
              const pStyle = priorityStyles[lead.priority] || priorityStyles.medium;
              const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && lead.status !== "won";

              return (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="cursor-pointer transition-colors duration-150 group"
                  style={{
                    borderBottom: i < leads.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}
                      >
                        {lead.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{lead.name}</span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {lead.company || "—"}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {lead.email || "—"}
                  </td>

                  {/* Budget */}
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {lead.budget || "—"}
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                      style={{ background: pStyle.bg, color: pStyle.color }}
                    >
                      {lead.priority || "medium"}
                    </span>
                  </td>

                  {/* Follow-up */}
                  <td className="px-4 py-3">
                    {lead.followUpDate ? (
                      <div>
                        <p className="text-sm" style={{ color: isOverdue ? "#fca5a5" : "rgba(255,255,255,0.6)" }}>
                          {new Date(lead.followUpDate).toISOString().split("T")[0]}
                        </p>
                        {isOverdue && (
                          <span className="text-xs font-semibold text-red-400">Overdue</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
                    )}
                  </td>

                  {/* Owner */}
                  <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {lead.createdBy?.name || "Unknown"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect id={lead.id} currentStatus={lead.status} />
                  </td>

                  {/* Actions */}
                  {session?.user?.role === "admin" && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DeleteLead id={lead.id} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
