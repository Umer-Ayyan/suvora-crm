"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const MODULES = [
  { key: "leads",      label: "Leads",       icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
  { key: "clients",    label: "Clients",     icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { key: "invoices",   label: "Invoices",    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { key: "quotations", label: "Quotations",  icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" },
  { key: "tasks",      label: "Tasks",       icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { key: "employees",  label: "Employees",   icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
  { key: "attendance", label: "Attendance",  icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "goals",      label: "Goals",       icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { key: "applications", label: "Applications", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { key: "reports",    label: "Reports",     icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v16H4z" },
];

const COLORS = ["#7c3aed","#4f46e5","#0891b2","#059669","#d97706","#dc2626","#db2777","#7c3aed"];

type Permission = { [key: string]: boolean };
type Role = { id: string; name: string; color: string; permissions: Permission; _count: { users: number } };
type Employee = { id: string; name: string; employeeId: string; role: string; customRoleId: string | null; designation: string | null };

const emptyPerms = (): Permission => Object.fromEntries(MODULES.map((m) => [m.key, false]));

export default function RolesManager({ roles: initialRoles, employees }: { roles: Role[]; employees: Employee[] }) {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  // Create/Edit form state
  const [form, setForm] = useState({ name: "", color: COLORS[0], permissions: emptyPerms() });

  function openCreate() {
    setForm({ name: "", color: COLORS[0], permissions: emptyPerms() });
    setEditRole(null);
    setShowCreate(true);
  }

  function openEdit(role: Role) {
    setForm({ name: role.name, color: role.color, permissions: { ...role.permissions } as Permission });
    setEditRole(role);
    setShowCreate(true);
  }

  function togglePerm(key: string) {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  }

  async function saveRole() {
    if (!form.name.trim()) { toast.error("Role name required"); return; }
    setLoading(true);
    try {
      const url    = editRole ? `/api/roles/${editRole.id}` : "/api/roles";
      const method = editRole ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed"); return; }
      toast.success(editRole ? "Role updated" : "Role created");
      setShowCreate(false);
      router.refresh();
      // Optimistic update
      if (editRole) {
        setRoles((r) => r.map((x) => x.id === editRole.id ? { ...x, ...form } : x));
      } else {
        setRoles((r) => [...r, { ...data, _count: { users: 0 } }]);
      }
    } catch { toast.error("Error saving role"); }
    finally { setLoading(false); }
  }

  async function deleteRole(id: string) {
    if (!confirm("Delete this role? Employees assigned to it will lose custom permissions.")) return;
    const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Role deleted");
      setRoles((r) => r.filter((x) => x.id !== id));
      router.refresh();
    } else {
      toast.error("Failed to delete");
    }
  }

  async function assignRole(employeeId: string, customRoleId: string | null) {
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customRoleId }),
    });
    if (res.ok) {
      toast.success(customRoleId ? "Custom role assigned — employee must re-login" : "Custom role removed");
      router.refresh();
    } else {
      toast.error("Failed to assign role");
    }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Roles & Permissions</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Create custom roles and control module access per employee
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Role
        </button>
      </div>

      {/* Roles list */}
      {roles.length === 0 ? (
        <div className="rounded-2xl p-12 text-center mb-8" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-white font-semibold">No custom roles yet</p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Create a role like &quot;Graphic Designer&quot; or &quot;HR Manager&quot;</p>
        </div>
      ) : (
        <div className="grid gap-4 mb-8">
          {roles.map((role) => (
            <div key={role.id} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: role.color }}>
                    {role.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{role.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {role._count.users} employee{role._count.users !== 1 ? "s" : ""} assigned
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(role)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteRole(role.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Permissions grid */}
              <div className="flex flex-wrap gap-2">
                {MODULES.map((m) => {
                  const allowed = (role.permissions as Permission)[m.key];
                  return (
                    <span key={m.key} className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={allowed
                        ? { background: "rgba(16,185,129,0.12)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.2)" }
                        : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.06)" }
                      }>
                      {allowed ? "✓" : "✗"} {m.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign roles to employees */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-sm font-bold text-white">Assign Custom Roles to Employees</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Employee must re-login for changes to take effect
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {employees.filter((e) => e.role !== "admin").map((emp) => (
            <div key={emp.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                  {emp.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{emp.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {emp.employeeId} · {emp.designation || emp.role}
                  </p>
                </div>
              </div>
              <select
                defaultValue={emp.customRoleId || ""}
                onChange={(e) => assignRole(emp.id, e.target.value || null)}
                className="rounded-xl px-3 py-1.5 text-xs text-white outline-none flex-shrink-0"
                style={{ ...inputStyle, minWidth: "150px" }}
              >
                <option value="">Default ({emp.role})</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          ))}
          {employees.filter((e) => e.role !== "admin").length === 0 && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No employees found
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-base font-bold text-white">
                {editRole ? `Edit "${editRole.name}"` : "Create New Role"}
              </h2>
              <button onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Role Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Graphic Designer, HR Manager"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["#7c3aed","#4f46e5","#0891b2","#059669","#d97706","#dc2626","#db2777","#374151"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-lg transition-all"
                      style={{
                        background: c,
                        outline: form.color === c ? `2px solid white` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Module Access
                </label>
                <div className="space-y-2">
                  {MODULES.map((m) => (
                    <div
                      key={m.key}
                      onClick={() => togglePerm(m.key)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: form.permissions[m.key] ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
                        border: form.permissions[m.key] ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                          style={{ color: form.permissions[m.key] ? "#6ee7b7" : "rgba(255,255,255,0.3)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                        </svg>
                        <span className="text-sm font-medium" style={{ color: form.permissions[m.key] ? "white" : "rgba(255,255,255,0.5)" }}>
                          {m.label}
                        </span>
                      </div>
                      {/* Toggle */}
                      <div className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                        style={{ background: form.permissions[m.key] ? "#059669" : "rgba(255,255,255,0.1)" }}>
                        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                          style={{ left: form.permissions[m.key] ? "calc(100% - 18px)" : "2px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button onClick={saveRole} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                {loading ? "Saving…" : editRole ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
