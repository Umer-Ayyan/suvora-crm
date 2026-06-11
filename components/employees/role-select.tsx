"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type CustomRole = { id: string; name: string; color: string };

const SYSTEM_ROLES = [
  { value: "employee", label: "Employee", bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" },
  { value: "manager",  label: "Manager",  bg: "rgba(6,182,212,0.12)",  color: "#67e8f9" },
];

export default function RoleSelect({
  id,
  currentRole,
  currentCustomRoleId,
  currentCustomRoleName,
  isSelf,
}: {
  id: string;
  currentRole: string;
  currentCustomRoleId?: string | null;
  currentCustomRoleName?: string | null;
  isSelf?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  // Display state
  const [activeCustomRoleId, setActiveCustomRoleId] = useState(currentCustomRoleId ?? null);
  const [activeCustomRoleName, setActiveCustomRoleName] = useState(currentCustomRoleName ?? null);
  const [activeRole, setActiveRole] = useState(currentRole);

  useEffect(() => {
    if (open && customRoles.length === 0) {
      fetch("/api/roles").then((r) => r.json()).then((d) => {
        if (Array.isArray(d)) setCustomRoles(d);
      }).catch(() => {});
    }
  }, [open, customRoles.length]);

  // What label/color to show on the badge
  const displayLabel = activeCustomRoleName || activeRole;
  const displayBg    = activeCustomRoleId
    ? "rgba(124,58,237,0.15)"
    : activeRole === "manager" ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.07)";
  const displayColor = activeCustomRoleId
    ? "#c4b5fd"
    : activeRole === "manager" ? "#67e8f9" : "rgba(255,255,255,0.6)";

  async function applyChange(newSystemRole: string, newCustomRoleId: string | null) {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newSystemRole, customRoleId: newCustomRoleId }),
      });
      if (res.ok) {
        setActiveRole(newSystemRole);
        setActiveCustomRoleId(newCustomRoleId);
        setActiveCustomRoleName(customRoles.find((r) => r.id === newCustomRoleId)?.name ?? null);
        toast.success("Role updated — employee must re-login");
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  // Locked for self
  if (isSelf) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
        style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd" }}>
        Admin
        <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize transition-all hover:opacity-80 disabled:opacity-50"
        style={{ background: displayBg, color: displayColor }}
      >
        {loading ? "…" : displayLabel}
        <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden py-1 min-w-[160px]"
            style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>

            {/* System roles */}
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
              System
            </p>
            {SYSTEM_ROLES.map((r) => {
              const isActive = activeRole === r.value && !activeCustomRoleId;
              return (
                <button key={r.value} onClick={() => applyChange(r.value, null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold capitalize transition-all hover:bg-white/5"
                  style={{ color: r.color }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color, opacity: isActive ? 1 : 0.3 }} />
                  {r.label}
                  {isActive && (
                    <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}

            {/* Custom roles */}
            {customRoles.length > 0 && (
              <>
                <div className="my-1 mx-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
                <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Custom Roles
                </p>
                {customRoles.map((r) => {
                  const isActive = activeCustomRoleId === r.id;
                  return (
                    <button key={r.id} onClick={() => applyChange(activeRole, r.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all hover:bg-white/5"
                      style={{ color: r.color }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color, opacity: isActive ? 1 : 0.3 }} />
                      {r.name}
                      {isActive && (
                        <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
