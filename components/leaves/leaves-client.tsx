"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const LEAVE_TYPES = [
  { value: "annual",   label: "Annual Leave",   color: "#6ee7b7", bg: "rgba(16,185,129,0.12)"  },
  { value: "sick",     label: "Sick Leave",      color: "#fca5a5", bg: "rgba(239,68,68,0.12)"   },
  { value: "casual",   label: "Casual Leave",    color: "#93c5fd", bg: "rgba(59,130,246,0.12)"  },
  { value: "unpaid",   label: "Unpaid Leave",    color: "#fcd34d", bg: "rgba(245,158,11,0.12)"  },
  { value: "other",    label: "Other",           color: "#e9d5ff", bg: "rgba(167,139,250,0.12)" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "#fcd34d", bg: "rgba(245,158,11,0.12)",  label: "Pending"  },
  approved:  { color: "#6ee7b7", bg: "rgba(16,185,129,0.12)",  label: "Approved" },
  rejected:  { color: "#fca5a5", bg: "rgba(239,68,68,0.12)",   label: "Rejected" },
  cancelled: { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)", label: "Cancelled" },
};

type Leave = {
  id: string; type: string; startDate: string; endDate: string; days: number;
  reason: string | null; status: string; reviewNote: string | null;
  user: { id: string; name: string; employeeId: string; designation: string | null };
  reviewedBy: { id: string; name: string } | null;
  createdAt: string;
};

export default function LeavesClient({ leaves: initialLeaves, currentUserId, isPrivileged }: {
  leaves: Leave[];
  currentUserId: string;
  isPrivileged: boolean;
}) {
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>(initialLeaves);
  const [showApply, setShowApply] = useState(false);
  const [reviewModal, setReviewModal] = useState<Leave | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // Apply form
  const [form, setForm] = useState({ type: "annual", startDate: "", endDate: "", reason: "" });

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };
  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none";

  async function applyLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.startDate || !form.endDate) { toast.error("Select dates"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Leave request submitted");
        setLeaves((l) => [data, ...l]);
        setShowApply(false);
        setForm({ type: "annual", startDate: "", endDate: "", reason: "" });
      } else {
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function reviewLeave(status: "approved" | "rejected") {
    if (!reviewModal) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leaves/${reviewModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(status === "approved" ? "Leave approved ✓" : "Leave rejected");
        setLeaves((l) => l.map((x) => x.id === data.id ? data : x));
        setReviewModal(null);
        setReviewNote("");
        router.refresh();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function cancelLeave(id: string) {
    if (!confirm("Cancel this leave request?")) return;
    const res = await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      toast.success("Request cancelled");
      setLeaves((l) => l.map((x) => x.id === id ? { ...x, status: "cancelled" } : x));
    }
  }

  const filtered = filterStatus === "all" ? leaves : leaves.filter((l) => l.status === filterStatus);
  const pending  = leaves.filter((l) => l.status === "pending").length;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-white">Leave Requests</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {isPrivileged
              ? `${leaves.length} total · ${pending} pending review`
              : `${leaves.length} request${leaves.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => setShowApply(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Apply Leave
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {["all", "pending", "approved", "rejected", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={{
              background: filterStatus === s ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              color: filterStatus === s ? "#c4b5fd" : "rgba(255,255,255,0.4)",
              border: filterStatus === s ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
            }}>
            {s === "all" ? `All (${leaves.length})` : `${s} (${leaves.filter((l) => l.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Leave cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.1)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white font-semibold">No leave requests</p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {isPrivileged ? "No requests to review" : "Click 'Apply Leave' to submit a request"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((leave) => {
            const type    = LEAVE_TYPES.find((t) => t.value === leave.type) || LEAVE_TYPES[4];
            const statusS = STATUS_STYLE[leave.status] || STATUS_STYLE.pending;
            const isOwn   = leave.user.id === currentUserId;

            return (
              <div key={leave.id} className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                      {leave.user.name[0].toUpperCase()}
                    </div>
                    <div>
                      {isPrivileged && (
                        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {leave.user.name} · {leave.user.employeeId}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: type.bg, color: type.color }}>
                          {type.label}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: statusS.bg, color: statusS.color }}>
                          {statusS.label}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
                          {leave.days} day{leave.days !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white mt-1.5">
                        {new Date(leave.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" → "}
                        {new Date(leave.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {leave.reason && (
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{leave.reason}</p>
                      )}
                      {leave.reviewNote && (
                        <p className="text-xs mt-1 italic" style={{ color: "#fcd34d" }}>
                          Note: {leave.reviewNote}
                        </p>
                      )}
                      {leave.reviewedBy && (
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Reviewed by {leave.reviewedBy.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Admin/Manager: review pending */}
                    {isPrivileged && leave.status === "pending" && (
                      <button onClick={() => { setReviewModal(leave); setReviewNote(""); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }}>
                        Review
                      </button>
                    )}
                    {/* Employee: cancel own pending */}
                    {isOwn && leave.status === "pending" && (
                      <button onClick={() => cancelLeave(leave.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
                        Cancel
                      </button>
                    )}
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(leave.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-base font-bold text-white">Apply for Leave</h2>
              <button onClick={() => setShowApply(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={applyLeave} className="px-6 py-5 space-y-4">
              {/* Leave type */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Leave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.map((t) => (
                    <button type="button" key={t.value}
                      onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left"
                      style={{
                        background: form.type === t.value ? t.bg : "rgba(255,255,255,0.04)",
                        color: form.type === t.value ? t.color : "rgba(255,255,255,0.5)",
                        border: form.type === t.value ? `1px solid ${t.color}40` : "1px solid transparent",
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>From *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className={inputCls} style={inputStyle} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>To *</label>
                  <input type="date" value={form.endDate} min={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className={inputCls} style={inputStyle} required />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Reason (optional)</label>
                <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={3} placeholder="Brief reason for leave..."
                  className={inputCls} style={{ ...inputStyle, resize: "none" }} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowApply(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  {loading ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <h2 className="text-base font-bold text-white">Review Leave Request</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {reviewModal.user.name} · {LEAVE_TYPES.find((t) => t.value === reviewModal.type)?.label} · {reviewModal.days} days
                </p>
              </div>
              <button onClick={() => setReviewModal(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm text-white font-medium">
                  {new Date(reviewModal.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {" → "}
                  {new Date(reviewModal.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                {reviewModal.reason && (
                  <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>{reviewModal.reason}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Note (optional)
                </label>
                <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="e.g. Approved, enjoy your leave!"
                  className={inputCls} style={inputStyle} />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => reviewLeave("rejected")} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.25)" }}>
                  Reject
                </button>
                <button onClick={() => reviewLeave("approved")} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                  {loading ? "…" : "Approve ✓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
