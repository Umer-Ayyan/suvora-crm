"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ROLES = [
  { value: "employee", label: "Employee", bg: "rgba(255,255,255,0.07)",      color: "rgba(255,255,255,0.6)" },
  { value: "manager",  label: "Manager",  bg: "rgba(6,182,212,0.12)",        color: "#67e8f9" },
  { value: "admin",    label: "Admin",    bg: "rgba(124,58,237,0.15)",       color: "#c4b5fd" },
];

export default function RoleSelect({ id, currentRole }: { id: string; currentRole: string }) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const current = ROLES.find((r) => r.value === role) || ROLES[0];

  async function changeRole(newRole: string) {
    if (newRole === role) { setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setRole(newRole);
        toast.success(`Role changed to ${newRole}`);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update role");
      }
    } catch {
      toast.error("Error updating role");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize transition-all hover:opacity-80 disabled:opacity-50"
        style={{ background: current.bg, color: current.color }}
      >
        {loading ? "…" : current.label}
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden py-1 min-w-[120px]"
            style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          >
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => changeRole(r.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold capitalize transition-all hover:bg-white/5"
                style={{ color: r.color }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: r.color, opacity: role === r.value ? 1 : 0.3 }}
                />
                {r.label}
                {role === r.value && (
                  <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
