"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddNote({ leadId }: { leadId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        toast.success("Note saved");
        setContent("");
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error("Failed to save note");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note about this lead..."
        rows={3}
        className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none transition-all"
        style={inputStyle}
      />
      <button
        onClick={save}
        disabled={loading || !content.trim()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Saving...
          </>
        ) : "Save Note"}
      </button>
    </div>
  );
}