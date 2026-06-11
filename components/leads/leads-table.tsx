"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatusSelect from "./status-select";
import DeleteLead from "./delete-lead";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const priorityStyles: Record<string, { bg: string; color: string }> = {
  high: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5" },
  medium: { bg: "rgba(245,158,11,0.12)", color: "#fcd34d" },
  low: { bg: "rgba(16,185,129,0.12)", color: "#6ee7b7" },
};

export default function LeadsTable({ leads }: { leads: any[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const isAdminOrManager = ["admin", "manager"].includes(session?.user?.role as string);
  const allSelected = leads.length > 0 && selected.size === leads.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(leads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} lead(s)? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/leads/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.deleted} lead(s) deleted`);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Error deleting leads");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "#fca5a5" }}>
            {selected.size} lead{selected.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={bulkDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.35)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? "Deleting…" : "Delete Selected"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
          >
            Clear
          </button>
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Select all checkbox */}
                {isAdminOrManager && (
                  <th className="px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded cursor-pointer accent-violet-500"
                    />
                  </th>
                )}
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
                const isChecked = selected.has(lead.id);

                return (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className="cursor-pointer transition-colors duration-150 group"
                    style={{
                      borderBottom: i < leads.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      background: isChecked ? "rgba(124,58,237,0.08)" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isChecked ? "rgba(124,58,237,0.08)" : "transparent"; }}
                  >
                    {/* Checkbox */}
                    {isAdminOrManager && (
                      <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleOne(lead.id); }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(lead.id)}
                          className="w-4 h-4 rounded cursor-pointer accent-violet-500"
                        />
                      </td>
                    )}

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
    </div>
  );
}
