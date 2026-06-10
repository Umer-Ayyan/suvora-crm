"use client";

import { useState } from "react";
import { toast } from "sonner";

type Employee = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  phone: string | null;
  salary: number;
};

export default function EditEmployeeForm({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: employee.name || "",
    role: employee.role || "employee",
    department: employee.department || "",
    phone: employee.phone || "",
    salary: employee.salary > 0 ? String(employee.salary) : "",
  });

  function set(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role,
          department: form.department.trim() || null,
          phone: form.phone.trim() || null,
          salary: form.salary ? Number(form.salary) : 0,
        }),
      });
      if (res.ok) {
        toast.success("Employee updated");
        setOpen(false);
        setTimeout(() => window.location.reload(), 500);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: "rgba(124,58,237,0.12)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.25)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setOpen(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-slide-up"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.12)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Edit Employee</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Full Name *</label>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Role</label>
                  <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Department</label>
                  <input type="text" placeholder="Sales" value={form.department} onChange={(e) => set("department", e.target.value)} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Phone</label>
                  <input type="tel" placeholder="+92 300 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Salary (Rs.)</label>
                  <input type="number" placeholder="50000" value={form.salary} onChange={(e) => set("salary", e.target.value)} className={inputCls} style={inputStyle} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
