"use client";

import { useState } from "react";
import { toast } from "sonner";

const SOURCES = ["website","upwork","fiverr","linkedin","referral","cold_outreach","other"];

type LeadFields = {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  industry: string | null;
  budget: string | null;
  dealValue: number | null;
  source: string | null;
  notes: string | null;
};

export default function LeadEditForm({ lead }: { lead: LeadFields }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: lead.name || "",
    company: lead.company || "",
    email: lead.email || "",
    phone: lead.phone || "",
    country: lead.country || "",
    industry: lead.industry || "",
    budget: lead.budget || "",
    dealValue: lead.dealValue != null ? String(lead.dealValue) : "",
    source: lead.source || "website",
    notes: lead.notes || "",
  });

  function set(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          country: form.country.trim() || null,
          industry: form.industry.trim() || null,
          budget: form.budget.trim() || null,
          dealValue: form.dealValue ? Number(form.dealValue) : null,
          source: form.source,
          notes: form.notes.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success("Lead updated");
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
  const labelCls = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: "rgba(255,255,255,0.45)" };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Edit Lead Details</h2>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: open ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)",
            color: open ? "#c4b5fd" : "rgba(255,255,255,0.6)",
            border: `1px solid ${open ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {open ? "Close" : "Edit"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="animate-slide-up">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls} style={labelStyle}>Name *</label>
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Company</label>
              <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Country</label>
              <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Industry</label>
              <input type="text" value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Budget</label>
              <input type="text" value={form.budget} onChange={(e) => set("budget", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Deal Value ($)</label>
              <input type="number" value={form.dealValue} onChange={(e) => set("dealValue", e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Source</label>
              <select value={form.source} onChange={(e) => set("source", e.target.value)} className={inputCls} style={inputStyle}>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,(c)=>c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                className={inputCls + " resize-none"}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!open && (
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Click Edit to modify lead details like name, contact info, budget, and source.
        </p>
      )}
    </>
  );
}
