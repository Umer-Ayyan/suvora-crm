"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ConvertToClient({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function handleConvert() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Lead converted to client!");
        router.push(`/clients/${data.clientId}`);
      } else {
        toast.error(data.error || "Conversion failed");
        setConfirm(false);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Convert this lead to a client?</span>
        <button
          onClick={handleConvert}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 2px 8px rgba(5,150,105,0.35)" }}
        >
          {loading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          Yes, Convert
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
      style={{
        background: "linear-gradient(135deg, rgba(5,150,105,0.2), rgba(4,120,87,0.15))",
        border: "1px solid rgba(16,185,129,0.3)",
        color: "#6ee7b7",
      }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      Convert to Client
    </button>
  );
}
