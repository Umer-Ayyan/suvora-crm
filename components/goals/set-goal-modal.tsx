"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string | null;
}

const MONTHS = [
  { v: 1, l: "January" }, { v: 2, l: "February" }, { v: 3, l: "March" },
  { v: 4, l: "April" },   { v: 5, l: "May" },       { v: 6, l: "June" },
  { v: 7, l: "July" },    { v: 8, l: "August" },    { v: 9, l: "September" },
  { v: 10, l: "October" },{ v: 11, l: "November" },  { v: 12, l: "December" },
];

const GOAL_TYPES = [
  { value: "leads",   label: "Leads Created",   desc: "Auto-tracked from leads assigned", icon: "👥" },
  { value: "revenue", label: "Revenue (Deals)",  desc: "Auto-tracked from won deals",      icon: "💰" },
  { value: "tasks",   label: "Tasks Completed",  desc: "Auto-tracked from completed tasks",icon: "✅" },
  { value: "custom",  label: "Custom",           desc: "Employee manually updates progress",icon: "🎯" },
];

export default function SetGoalModal({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    title: "",
    type: "leads",
    targetValue: "",
    period: "monthly",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    notes: "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    // Auto-fill title based on type
    if (k === "type") {
      const t = GOAL_TYPES.find((t) => t.value === v);
      if (t && !form.title) setForm((f) => ({ ...f, type: v, title: t.label }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.title || !form.targetValue)
      return toast.error("Please fill all required fields");

    setLoading(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          month: form.period === "monthly" ? parseInt(form.month) : null,
        }),
      });
      if (res.ok) {
        toast.success("Goal set successfully");
        router.refresh();
        setOpen(false);
        setForm({ userId: "", title: "", type: "leads", targetValue: "", period: "monthly", month: String(now.getMonth() + 1), year: String(now.getFullYear()), notes: "" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to set goal");
      }
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Set Goal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div>
                <h2 className="text-base font-bold text-white">Set Employee Goal</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Define a performance target for a team member</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/5" style={{ color: "rgba(255,255,255,0.5)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Employee */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Employee *</label>
                <select value={form.userId} onChange={(e) => set("userId", e.target.value)} className={inputCls} style={inputStyle} required>
                  <option value="">Select employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId}){emp.department ? ` — ${emp.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Goal type */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Goal Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("type", t.value)}
                      className="rounded-xl p-3 text-left transition-all"
                      style={{
                        background: form.type === t.value ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                        border: form.type === t.value ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <span className="text-base">{t.icon}</span>
                      <p className="text-xs font-semibold text-white mt-1">{t.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Goal Title *</label>
                <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Close 10 leads this month" required />
              </div>

              {/* Target */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Target Value * {form.type === "revenue" && "(in $)"}
                </label>
                <input type="number" min="1" value={form.targetValue} onChange={(e) => set("targetValue", e.target.value)} className={inputCls} style={inputStyle} placeholder={form.type === "revenue" ? "e.g. 50000" : "e.g. 10"} required />
              </div>

              {/* Period */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Period</label>
                  <select value={form.period} onChange={(e) => set("period", e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                {form.period === "monthly" && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Month</label>
                    <select value={form.month} onChange={(e) => set("month", e.target.value)} className={inputCls} style={inputStyle}>
                      {MONTHS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Year</label>
                  <select value={form.year} onChange={(e) => set("year", e.target.value)} className={inputCls} style={inputStyle}>
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputCls} style={inputStyle} placeholder="Any additional context…" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  {loading ? "Setting…" : "Set Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
