"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Goal {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  period: string;
  month: number | null;
  year: number;
  notes: string | null;
  user: { id: string; name: string; employeeId: string };
}

export default function GoalCard({
  goal,
  role,
  typeCfg,
  months,
}: {
  goal: Goal;
  role: string;
  typeCfg: Record<string, { label: string; color: string; icon: string }>;
  months: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(String(goal.currentValue));
  const [loading, setLoading] = useState(false);

  const cfg = typeCfg[goal.type] ?? typeCfg.custom;
  const pct = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
  const achieved = goal.currentValue >= goal.targetValue;
  const periodLabel = goal.month ? `${months[goal.month - 1]} ${goal.year}` : `${goal.period} ${goal.year}`;

  const isRevenue = goal.type === "revenue";
  const fmt = (v: number) => isRevenue ? `$${v.toLocaleString()}` : v.toLocaleString();

  async function saveProgress() {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentValue: current }),
      });
      if (res.ok) { toast.success("Progress updated"); router.refresh(); setEditing(false); }
      else toast.error("Update failed");
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  async function del() {
    if (!confirm("Delete this goal?")) return;
    const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Goal deleted"); router.refresh(); }
    else toast.error("Delete failed");
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${achieved ? "rgba(110,231,183,0.2)" : "rgba(255,255,255,0.08)"}` }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{cfg.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{goal.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{periodLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {achieved && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.2)" }}>
              ✓ Done
            </span>
          )}
          {role === "admin" && (
            <button onClick={del} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors"
              style={{ color: "rgba(248,113,113,0.5)" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Type badge */}
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full self-start"
        style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
        {cfg.label}
      </span>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: "rgba(255,255,255,0.5)" }}>Progress</span>
          <span className="font-semibold" style={{ color: cfg.color }}>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: achieved
                ? "linear-gradient(90deg,#6ee7b7,#059669)"
                : `linear-gradient(90deg,${cfg.color}99,${cfg.color})`,
            }}
          />
        </div>
      </div>

      {/* Values */}
      <div className="flex justify-between text-xs">
        <span style={{ color: "rgba(255,255,255,0.4)" }}>Current</span>
        <span className="font-bold text-white">{fmt(goal.currentValue)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color: "rgba(255,255,255,0.4)" }}>Target</span>
        <span className="font-semibold" style={{ color: cfg.color }}>{fmt(goal.targetValue)}</span>
      </div>

      {/* Custom type: employee can update progress */}
      {goal.type === "custom" && (
        <div>
          {editing ? (
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                placeholder="Current value"
              />
              <button
                onClick={saveProgress}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "linear-gradient(135deg,#059669,#047857)", color: "white" }}
              >
                {loading ? "…" : "Save"}
              </button>
              <button
                onClick={() => { setEditing(false); setCurrent(String(goal.currentValue)); }}
                className="px-2 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full mt-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              Update Progress
            </button>
          )}
        </div>
      )}

      {/* Notes */}
      {goal.notes && (
        <p className="text-xs leading-relaxed pt-1 border-t"
          style={{ color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.06)" }}>
          {goal.notes}
        </p>
      )}
    </div>
  );
}
