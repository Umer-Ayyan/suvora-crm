"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

const statusConfig = {
  present:  { label: "Present",   color: "#6ee7b7", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.3)" },
  late:     { label: "Late",      color: "#fcd34d", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)" },
  half_day: { label: "Half Day",  color: "#fca5a5", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.3)"  },
  absent:   { label: "Absent",    color: "#f87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)" },
};

export default function CheckInButton({ todayRecord, role }: { todayRecord: any; role?: string }) {
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(todayRecord);
  const [time, setTime] = useState("");
  const [previewStatus, setPreviewStatus] = useState("present");
  const [windowOpen, setWindowOpen] = useState(false);

  // Live clock + preview status in PKT
  useEffect(() => {
    function tick() {
      const now = new Date();
      const pkt = new Date(now.getTime() + 5 * 60 * 60 * 1000);
      const h = pkt.getUTCHours();
      const m = pkt.getUTCMinutes();
      // Format time as 12-hour
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h >= 12 ? "PM" : "AM";
      setTime(`${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(pkt.getUTCSeconds()).padStart(2, "0")} ${ampm}`);

      // Attendance window: 10:00 PM – 12:00 AM PKT (22:00–23:59)
      setWindowOpen(h >= 22);

      // Night shift: 10 PM start. Compute minutes from shift start (22:00).
      let minutesFromStart: number;
      if (h >= 22) {
        minutesFromStart = (h - 22) * 60 + m;
      } else {
        minutesFromStart = (24 - 22 + h) * 60 + m;
      }
      if (minutesFromStart <= 15) setPreviewStatus("present");
      else if (minutesFromStart <= 60) setPreviewStatus("late");
      else setPreviewStatus("half_day");
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleCheckIn() {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRecord(data);
        toast.success("Attendance marked successfully!");
      } else {
        toast.error(data.error || "Failed to check in");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const preview = statusConfig[previewStatus as keyof typeof statusConfig];

  if (record?.checkInTime) {
    const sc = statusConfig[record.status as keyof typeof statusConfig] ?? statusConfig.present;
    const checkInPKT = new Date(new Date(record.checkInTime).getTime() + 5 * 60 * 60 * 1000);
    const checkInStr = checkInPKT.toUTCString().slice(17, 25);

    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center gap-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Big status icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: sc.bg, border: `2px solid ${sc.border}` }}
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke={sc.color} strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="text-center">
          <span
            className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-2"
            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
          >
            {sc.label}
          </span>
          <p className="text-2xl font-bold text-white mt-1">Checked In</p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Check-in time: <span className="text-white font-medium">{checkInStr} PKT</span>
          </p>
          {record.deductionPct > 0 && role !== "employee" && (
            <p className="text-sm mt-2 text-yellow-400">
              ⚠ {record.deductionPct}% daily salary deducted
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center gap-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Live clock */}
      <div className="text-center">
        <p className="text-5xl font-bold text-white tabular-nums tracking-tight">{time}</p>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Pakistan Standard Time (PKT)</p>
      </div>

      {/* Preview of what status will be */}
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
        style={{ background: preview.bg, border: `1px solid ${preview.border}` }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: preview.color }} />
        <span style={{ color: preview.color }} className="font-medium">
          Checking in now will mark you as: <strong>{preview.label}</strong>
        </span>
      </div>

      {/* Timing rules */}
      <div className="w-full grid grid-cols-3 gap-3 text-center text-xs">
        {[
          { time: "Before 10:15 PM", label: "Present",  color: "#6ee7b7", deduct: "0%"   },
          { time: "10:15 – 11:00 PM", label: "Late",    color: "#fcd34d", deduct: "−25%" },
          { time: "After 11:00 PM",   label: "Half Day", color: "#fca5a5", deduct: "−50%" },
        ].map((r) => (
          <div key={r.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <p style={{ color: r.color }} className="font-semibold">{r.label}</p>
            <p style={{ color: "rgba(255,255,255,0.45)" }} className="mt-0.5">{r.time}</p>
            <p style={{ color: r.color }} className="font-bold mt-1">{r.deduct}</p>
          </div>
        ))}
      </div>

      {!windowOpen && (
        <div className="w-full py-3 rounded-2xl text-sm font-medium text-center"
          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
          🔒 Attendance opens at 10:00 PM PKT
        </div>
      )}
      <button
        onClick={handleCheckIn}
        disabled={loading || !windowOpen}
        className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: windowOpen ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.08)",
          boxShadow: windowOpen ? "0 6px 30px rgba(124,58,237,0.4)" : "none",
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Marking attendance...
          </span>
        ) : windowOpen ? "Mark Attendance" : "Attendance Closed"}
      </button>
    </div>
  );
}
