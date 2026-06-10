"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Real Estate","E-Commerce","Marketing","Legal","Other"];

export default function AddClientForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    country: "", industry: "", website: "", notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim()) { toast.error("Name and company required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Client added successfully");
        setForm({ name: "", company: "", email: "", phone: "", country: "", industry: "", website: "", notes: "" });
        setOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to add client");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  const inp = "input-modern w-full rounded-xl px-3 py-2.5 text-sm text-white";
  const sty = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Add Client
      </button>

      {open && (
        <form onSubmit={handleSubmit}
          className="mt-4 rounded-2xl p-6 space-y-4 animate-slide-up"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <h3 className="text-sm font-semibold text-white">New Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Contact Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Smith" className={inp} style={sty} required />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Company *</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Corp" className={inp} style={sty} required />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@acme.com" className={inp} style={sty} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+92 300 0000000" className={inp} style={sty} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Country</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Pakistan" className={inp} style={sty} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Industry</label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className={inp} style={sty}>
                <option value="">Select industry...</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Website</label>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://acme.com" className={inp} style={sty} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes..." className={inp} style={sty} rows={2} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              {loading ? "Adding..." : "Add Client"}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
