"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EditAttendance from "@/components/attendance/edit-attendance";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  present:  { label: "Present",  color: "#6ee7b7", bg: "rgba(16,185,129,0.15)"  },
  late:     { label: "Late",     color: "#fcd34d", bg: "rgba(245,158,11,0.15)"  },
  half_day: { label: "Half Day", color: "#fca5a5", bg: "rgba(239,68,68,0.15)"   },
  absent:   { label: "Absent",   color: "#f87171", bg: "rgba(239,68,68,0.12)"   },
  leave:    { label: "Leave",    color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
};

export default function AttendanceManageClient({
  records, employees, month, year, isAdmin,
}: {
  records: any[]; employees: any[]; month: number; year: number; isAdmin: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterEmp, setFilterEmp] = useState("");

  async function handleDelete(id: string) {
    if (!confirm("Delete this attendance record?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/attendance/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Record deleted"); router.refresh(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Something went wrong"); }
    finally { setDeletingId(null); }
  }
  const [leaveEmpId, setLeaveEmpId] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [bulkEmpId, setBulkEmpId] = useState("");
  const [bulkStatus, setBulkStatus] = useState("present");
  const [bulkLoading, setBulkLoading] = useState(false);

  async function handleBulkMark() {
    if (!bulkEmpId) { toast.error("Select an employee"); return; }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: bulkEmpId, month, year, status: bulkStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Marked ${data.count} working days as ${bulkStatus}`);
        router.refresh();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleMarkLeave() {
    if (!leaveEmpId || !leaveDate) { toast.error("Select employee and date"); return; }
    setLeaveLoading(true);
    try {
      const res = await fetch("/api/attendance/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: leaveEmpId, date: leaveDate, notes: leaveNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Leave marked successfully");
        setLeaveDate(""); setLeaveNotes("");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to mark leave");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLeaveLoading(false);
    }
  }

  const selectStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };
  const years = [year - 1, year, year + 1];

  function navigate(m: number, y: number) {
    router.push(`/attendance/manage?month=${m}&year=${y}`);
  }

  const filtered = filterEmp
    ? records.filter((r) => r.user?.id === filterEmp)
    : records;

  // Summary per employee
  const empMap: Record<string, { name: string; present: number; late: number; half: number; absent: number; deduction: number; salary: number }> = {};
  for (const r of filtered) {
    if (!empMap[r.user.id]) empMap[r.user.id] = { name: r.user.name, present: 0, late: 0, half: 0, absent: 0, deduction: 0, salary: r.user.salary };
    if (r.status === "present")  empMap[r.user.id].present++;
    if (r.status === "late")     { empMap[r.user.id].late++; }
    if (r.status === "half_day") { empMap[r.user.id].half++; }
    if (r.status === "absent")   { empMap[r.user.id].absent++; }
    empMap[r.user.id].deduction += r.deductionPct;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex flex-wrap gap-3">
          <select
            value={month}
            onChange={(e) => navigate(Number(e.target.value), year)}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white"
            style={selectStyle}
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>

          <select
            value={year}
            onChange={(e) => navigate(month, Number(e.target.value))}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white"
            style={selectStyle}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={filterEmp}
            onChange={(e) => setFilterEmp(e.target.value)}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white"
            style={selectStyle}
          >
            <option value="">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk Mark Month */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: "#6ee7b7" }}>Bulk Mark Month</h3>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
          Marks all Mon–Fri working days in the selected month for one employee. Skips days already marked.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <select
            value={bulkEmpId}
            onChange={(e) => setBulkEmpId(e.target.value)}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">Select Employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="present">Present (0%)</option>
            <option value="late">Late (−25%)</option>
            <option value="half_day">Half Day (−50%)</option>
            <option value="absent">Absent (−100%)</option>
            <option value="leave">Leave (0%)</option>
          </select>
          <button
            onClick={handleBulkMark}
            disabled={bulkLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}
          >
            {bulkLoading ? "Marking..." : `Mark All of ${MONTHS[month - 1]} ${year}`}
          </button>
        </div>
      </div>

      {/* Mark Leave */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "#818cf8" }}>Mark Leave (0% deduction)</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <select
            value={leaveEmpId}
            onChange={(e) => setLeaveEmpId(e.target.value)}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">Select Employee</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input
            type="date"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={leaveNotes}
            onChange={(e) => setLeaveNotes(e.target.value)}
            className="input-modern rounded-xl px-3 py-2 text-sm text-white flex-1 min-w-[160px]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <button
            onClick={handleMarkLeave}
            disabled={leaveLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)" }}
          >
            {leaveLoading ? "Saving..." : "Mark Leave"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {Object.keys(empMap).length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(empMap).map(([id, emp]) => {
            const dailySalary = emp.salary > 0 ? emp.salary / 26 : 0; // ~26 Mon-Sat days/month
            const estDeduction = (emp.deduction / 100) * dailySalary;
            return (
              <div
                key={id}
                className="rounded-2xl p-4 card-accent-border cursor-pointer transition-all hover:scale-[1.01]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => setFilterEmp(filterEmp === id ? "" : id)}
              >
                <p className="font-semibold text-white text-sm mb-3">{emp.name}</p>
                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                  {[
                    { l: "Present", v: emp.present, c: "#6ee7b7" },
                    { l: "Late",    v: emp.late,    c: "#fcd34d" },
                    { l: "Half",    v: emp.half,    c: "#fca5a5" },
                    { l: "Absent",  v: emp.absent,  c: "#f87171" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg py-1.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <p style={{ color: s.c }} className="font-bold">{s.v}</p>
                      <p style={{ color: "rgba(255,255,255,0.4)" }}>{s.l}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Est. deduction: <span style={{ color: "#fca5a5" }}>Rs. {Math.round(estDeduction).toLocaleString()}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Records table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Employee", "Date", "Check-in (PKT)", "Status", "Deduction", "Notes", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.02)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No records found</td></tr>
            ) : filtered.map((r, i) => {
              const sc = statusConfig[r.status] ?? statusConfig.absent;
              const dateStr = new Date(r.date).toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric" });
              const checkInPKT = r.checkInTime
                ? new Date(new Date(r.checkInTime).getTime() + 5 * 60 * 60 * 1000).toUTCString().slice(17, 22)
                : "—";

              return (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                        {r.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{r.user?.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{r.user?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{dateStr}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{checkInPKT}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: r.deductionPct > 0 ? "#fca5a5" : "#6ee7b7" }}>
                    {r.deductionPct > 0 ? `−${r.deductionPct}%` : "None"}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[140px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {r.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <div className="min-w-[220px]">
                        <EditAttendance
                          record={r}
                          onDone={() => { setEditingId(null); router.refresh(); }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(r.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                          style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.25)" }}
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
                          >
                            {deletingId === r.id ? "..." : "Delete"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
