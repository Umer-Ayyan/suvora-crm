"use client";

import { useState } from "react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "present",  label: "Present",  deduct: 0,   color: "#6ee7b7" },
  { value: "late",     label: "Late",     deduct: 25,  color: "#fcd34d" },
  { value: "half_day", label: "Half Day", deduct: 50,  color: "#fca5a5" },
  { value: "absent",   label: "Absent",   deduct: 100, color: "#f87171" },
  { value: "leave",    label: "Leave",    deduct: 0,   color: "#818cf8" },
];

export default function EditAttendance({ record, onDone }: { record: any; onDone: () => void }) {
  const [status, setStatus] = useState(record.status);
  const [notes, setNotes] = useState(record.notes || "");
  const [loading, setLoading] = useState(false);

  const deduct = STATUS_OPTIONS.find((s) => s.value === status)?.deduct ?? 0;

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, deductionPct: deduct, notes }),
      });
      if (res.ok) {
        toast.success("Attendance updated");
        onDone();
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className="py-2 px-3 rounded-xl text-sm font-medium transition-all duration-150"
            style={
              status === opt.value
                ? { background: `${opt.color}25`, color: opt.color, border: `1px solid ${opt.color}60` }
                : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
            }
          >
            {opt.label} {opt.deduct > 0 && `(−${opt.deduct}%)`}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Note (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input-modern w-full rounded-xl px-3 py-2 text-sm text-white"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      />

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
