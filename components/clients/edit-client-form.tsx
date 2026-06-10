"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  client: {
    id: string;
    name: string;
    company: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    industry?: string | null;
    website?: string | null;
    notes?: string | null;
    status: string;
  };
}

const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20";
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };
const focusOn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(124,58,237,0.12)";
};
const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
  e.currentTarget.style.boxShadow   = "none";
};

export default function EditClientForm({ client }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:     client.name,
    company:  client.company,
    email:    client.email    || "",
    phone:    client.phone    || "",
    country:  client.country  || "",
    industry: client.industry || "",
    website:  client.website  || "",
    notes:    client.notes    || "",
    status:   client.status,
  });
  const router = useRouter();

  function set(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim()) {
      toast.error("Name and company are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Client updated");
        setOpen(false);
        router.refresh();
      } else {
        const d = await res.json();
        toast.error(d.error || "Update failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Client
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-semibold text-white">Edit Client</p>
              <button onClick={() => setOpen(false)} style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Contact Name *</label>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name"
                    className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Company *</label>
                  <input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name"
                    className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com"
                    className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Phone</label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+92 300 0000000"
                    className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Country</label>
                  <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Pakistan"
                    className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Industry</label>
                  <input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="e.g. SaaS"
                    className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Website</label>
                <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com"
                  className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}
                  className={inputCls + " cursor-pointer"} style={inputStyle} onFocus={focusOn} onBlur={focusOff}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Internal notes..."
                  className={inputCls + " resize-none"} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
