"use client";

import { useState } from "react";
import { toast } from "sonner";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function GeneratePayslip({ employees }: { employees: any[] }) {
  const [userId, setUserId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    if (!userId) { toast.error("Please select an employee"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/payslips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, month, year }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success("Payslip generated!");
      } else {
        toast.error(data.error || "Failed to generate");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const selectStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };
  const years = [year - 1, year, year + 1];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Employee</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-modern w-full rounded-xl px-3 py-2.5 text-sm text-white"
            style={selectStyle}
          >
            <option value="">Select employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeId}) — Rs. {Number(e.salary).toLocaleString()}/mo
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input-modern w-full rounded-xl px-3 py-2.5 text-sm text-white"
            style={selectStyle}
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-modern w-full rounded-xl px-3 py-2.5 text-sm text-white"
            style={selectStyle}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Generate Payslip
          </>
        )}
      </button>

      {result && (
        <div
          className="rounded-2xl p-5 animate-slide-up"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <p className="text-sm font-semibold text-emerald-400 mb-3">
            ✓ Payslip generated for {MONTHS[result.month - 1]} {result.year}
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              { label: "Base Salary", value: `Rs. ${Number(result.baseSalary).toLocaleString()}`, color: "white" },
              { label: "Deductions", value: `− Rs. ${Number(result.totalDeduction).toLocaleString()}`, color: "#fca5a5" },
              { label: "Net Salary", value: `Rs. ${Number(result.netSalary).toLocaleString()}`, color: "#6ee7b7" },
            ].map((r) => (
              <div key={r.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p style={{ color: "rgba(255,255,255,0.45)" }} className="text-xs mb-1">{r.label}</p>
                <p style={{ color: r.color }} className="font-bold">{r.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs text-center">
            {[
              { label: "Present", value: result.presentDays, color: "#6ee7b7" },
              { label: "Late",    value: result.lateDays,    color: "#fcd34d" },
              { label: "Half Day",value: result.halfDays,    color: "#fca5a5" },
              { label: "Absent",  value: result.absentDays,  color: "#f87171" },
            ].map((r) => (
              <div key={r.label} className="rounded-xl py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p style={{ color: r.color }} className="font-bold text-base">{r.value}</p>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
