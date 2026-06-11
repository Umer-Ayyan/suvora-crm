"use client";

import { useState } from "react";
import { toast } from "sonner";

const SOURCES = ["website","upwork","fiverr","linkedin","referral","cold_outreach","other"];
const PRIORITIES = ["low","medium","high"];

export default function AddLeadForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    country: "", industry: "", source: "website",
    budget: "", dealValue: "", notes: "",
    followUpDate: "", priority: "medium",
  });

  function set(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function reset() {
    setForm({ name:"", company:"", email:"", phone:"", country:"", industry:"",
      source:"website", budget:"", dealValue:"", notes:"", followUpDate:"", priority:"medium" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Lead name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Lead created successfully");
        reset();
        setOpen(false);
        setTimeout(() => window.location.reload(), 500);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create lead");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };
  const labelCls = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "rgba(255,255,255,0.45)" };

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Lead
        </button>
      ) : (
        <div className="rounded-2xl p-6 animate-slide-up" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">New Lead</h2>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Row 1 — identity */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls} style={labelStyle}>Lead Name *</label>
                <input type="text" placeholder="John Smith" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Company</label>
                <input type="text" placeholder="Acme Corp" value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Email</label>
                <input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Phone</label>
                <input type="tel" placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Country</label>
                <input type="text" placeholder="United States" value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Industry</label>
                <input type="text" placeholder="Technology" value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
            </div>

            {/* Row 2 — deal info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className={labelCls} style={labelStyle}>Source</label>
                <select value={form.source} onChange={(e) => set("source", e.target.value)} className={inputCls} style={inputStyle}>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Priority</label>
                <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls} style={inputStyle}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Budget</label>
                <input type="text" placeholder="$10,000" value={form.budget} onChange={(e) => set("budget", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Deal Value ($)</label>
                <input type="number" placeholder="0" value={form.dealValue} onChange={(e) => set("dealValue", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
            </div>

            {/* Row 3 — follow-up + notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className={labelCls} style={labelStyle}>Follow-up Date</label>
                <input type="date" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Notes</label>
                <textarea
                  placeholder="Any additional notes..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={1}
                  className={inputCls + " resize-none"}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating...
                  </>
                ) : "Create Lead"}
              </button>
              <button type="button" onClick={() => { setOpen(false); reset(); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
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
