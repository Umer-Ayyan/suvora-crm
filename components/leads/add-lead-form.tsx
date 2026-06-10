"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddLeadForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dealValue, setDealValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!name || !source) {
      toast.error("Lead Name and Source are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, source, company, email, budget, dealValue, notes, followUpDate, priority }),
      });
      if (res.ok) {
        toast.success("Lead created successfully");
        setName(""); setSource(""); setCompany(""); setEmail(""); setBudget("");
        setDealValue(""); setNotes(""); setFollowUpDate(""); setPriority("medium");
        setOpen(false);
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error("Failed to create lead");
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
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Lead
        </button>
      ) : (
        <div
          className="rounded-2xl p-6 animate-slide-up"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Add New Lead</h2>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = "transparent")}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Lead Name *</label>
                <input type="text" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Source *</label>
                <input type="text" placeholder="Website, Referral..." value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Company</label>
                <input type="text" placeholder="Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Email</label>
                <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Budget</label>
                <input type="text" placeholder="$10,000" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Deal Value ($)</label>
                <input type="number" placeholder="0" value={dealValue} onChange={(e) => setDealValue(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Notes</label>
              <textarea
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputClass + " resize-none"}
                style={inputStyle}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.25)",
                }}
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
