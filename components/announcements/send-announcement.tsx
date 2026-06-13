"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

type Emp = { id: string; name: string; employeeId?: string; department?: string | null };

export default function SendAnnouncement() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<"all" | "users">("all");
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open || employees.length) return;
    fetch("/api/employees")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEmployees(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [open, employees.length]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (target === "users" && selectedIds.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    setLoading(true);
    try {
      const res =
        target === "all"
          ? await fetch("/api/announcements", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, message }),
            })
          : await fetch("/api/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, message, target: "users", userIds: selectedIds }),
            });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Announcement sent to ${data.sentTo} team member(s)`);
        setTitle("");
        setMessage("");
        setSelected({});
        setTarget("all");
        setOpen(false);
      } else {
        toast.error(data.error || "Failed to send");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        Announce
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: "#0f0f1a",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.15)" }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Send Announcement</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Notify all team members</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              {/* Recipients */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Recipients
                </label>
                <div className="flex gap-2">
                  {([
                    { v: "all", label: "Everyone" },
                    { v: "users", label: "Choose People" },
                  ] as const).map((opt) => {
                    const active = target === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setTarget(opt.v)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: active ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.05)",
                          border: active ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.1)",
                          color: active ? "#a78bfa" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient list */}
              {target === "users" && (
                <div
                  className="rounded-xl p-2 max-h-52 overflow-y-auto"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {employees.length === 0 ? (
                    <p className="text-xs text-center py-3" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</p>
                  ) : (
                    employees.map((e) => {
                      const on = !!selected[e.id];
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setSelected((p) => ({ ...p, [e.id]: !p[e.id] }))}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors"
                          style={{ background: on ? "rgba(124,58,237,0.12)" : "transparent" }}
                        >
                          <span className="text-sm text-left" style={{ color: "rgba(255,255,255,0.85)" }}>
                            {e.name}
                            <span className="text-xs ml-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                              {e.employeeId}
                            </span>
                          </span>
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{
                              border: on ? "5px solid #a78bfa" : "2px solid rgba(255,255,255,0.25)",
                            }}
                          />
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Closed Tomorrow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Message
                </label>
                <textarea
                  placeholder="Write your announcement here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all resize-none placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <p className="text-xs mt-1 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {message.length}/500
                </p>
              </div>

              {/* Info */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "rgba(167,139,250,0.8)" }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {target === "all"
                  ? "This will be sent to all employees and managers instantly."
                  : `This will be sent to ${selectedIds.length} selected recipient(s) instantly.`}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending...
                    </span>
                  ) : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
