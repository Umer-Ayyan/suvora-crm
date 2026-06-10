"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function StatusSelect({ id, currentStatus }: { id: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function updateStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Status updated");
        setTimeout(() => window.location.reload(), 700);
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 mt-3">
      <select
        value={status}
        disabled={loading}
        onChange={(e) => setStatus(e.target.value)}
        className="input-modern w-full rounded-xl px-3 py-2.5 text-sm text-white disabled:opacity-50 cursor-pointer"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="proposal">Proposal</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>

      <button
        onClick={updateStatus}
        disabled={loading}
        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
      >
        {loading ? "Saving..." : "Save Status"}
      </button>
    </div>
  );
}
