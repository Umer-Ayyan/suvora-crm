"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InvoiceActions({ invoiceId, currentStatus, total }: { invoiceId: string; currentStatus: string; total: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function update(status: string, extra?: object) {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) { toast.success(`Marked as ${status}`); router.refresh(); }
      else toast.error("Update failed");
    } catch { toast.error("Error"); }
    finally { setLoading(false); setOpen(false); }
  }

  async function del() {
    if (!confirm("Delete this invoice?")) return;
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); router.refresh(); }
    else toast.error("Delete failed");
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={`/invoices/${invoiceId}`}
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }} title="View">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </Link>

      <div className="relative">
        <button onClick={() => setOpen(!open)} disabled={loading}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }} title="Actions">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-9 w-40 rounded-xl z-10 overflow-hidden"
            style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            {currentStatus !== "paid" && (
              <button onClick={() => update("paid", { amountPaid: total })}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                style={{ color: "#6ee7b7" }}>✓ Mark as Paid</button>
            )}
            {currentStatus !== "unpaid" && (
              <button onClick={() => update("unpaid")}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                style={{ color: "#fcd34d" }}>Mark as Unpaid</button>
            )}
            {currentStatus !== "partial" && (
              <button onClick={() => update("partial")}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                style={{ color: "#60a5fa" }}>Mark as Partial</button>
            )}
            {currentStatus !== "overdue" && (
              <button onClick={() => update("overdue")}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                style={{ color: "#f87171" }}>Mark as Overdue</button>
            )}
          </div>
        )}
      </div>

      <button onClick={del} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10"
        style={{ color: "rgba(248,113,113,0.5)" }} title="Delete">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
