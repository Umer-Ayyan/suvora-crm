"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

type CustomRole = { id: string; name: string; color: string };

export default function AddEmployeeForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [customRoleId, setCustomRoleId] = useState("");
  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(false);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/roles").then((r) => r.json()).then((data) => {
        if (Array.isArray(data)) setCustomRoles(data);
      }).catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !password) { toast.error("Name and password are required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, role, salary, customRoleId: customRoleId || null }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Employee created: ${data.employeeId}`);
        setName(""); setPassword(""); setRole("employee"); setSalary(""); setCustomRoleId("");
        setOpen(false);
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(data.error || "Failed to create employee");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "input-modern w-full rounded-xl px-4 py-2.5 text-sm text-white transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </button>
      ) : (
        <div className="rounded-2xl p-6 animate-slide-up"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Add New Employee</h2>
            <button onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Full Name *</label>
                <input type="text" placeholder="Ali Hassan" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Password *</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>System Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Monthly Salary (Rs.)</label>
                <input type="number" placeholder="50000" value={salary} onChange={(e) => setSalary(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            </div>

            {/* Custom role assignment */}
            {customRoles.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Custom Role (Optional)
                </label>
                <select value={customRoleId} onChange={(e) => setCustomRoleId(e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="">— No custom role —</option>
                  {customRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Custom role controls which modules this employee can access
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}>
                {loading ? "Creating..." : "Create Employee"}
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
