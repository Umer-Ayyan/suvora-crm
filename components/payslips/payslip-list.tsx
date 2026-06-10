"use client";

import { useState } from "react";
import { toast } from "sonner";

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

function PayslipModal({
  payslip, onClose, isAdmin, onDeleted,
}: {
  payslip: any; onClose: () => void; isAdmin: boolean; onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete payslip for ${MONTHS[payslip.month - 1]} ${payslip.year}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payslips/${payslip.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Payslip deleted"); onDeleted(); onClose(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Something went wrong"); }
    finally { setDeleting(false); }
  }

  const rows = [
    { label: "Base Salary",    value: `Rs. ${Number(payslip.baseSalary).toLocaleString()}`,      color: "white" },
    { label: "Working Days",   value: String(payslip.workingDays),                               color: "white" },
    { label: "Present Days",   value: String(payslip.presentDays),                               color: "#6ee7b7" },
    { label: "Late Days",      value: String(payslip.lateDays),                                  color: "#fcd34d" },
    { label: "Half Days",      value: String(payslip.halfDays),                                  color: "#fca5a5" },
    { label: "Absent Days",    value: String(payslip.absentDays),                                color: "#f87171" },
    { label: "Total Deduction",value: `− Rs. ${Number(payslip.totalDeduction).toLocaleString()}`, color: "#fca5a5" },
    { label: "Net Salary",     value: `Rs. ${Number(payslip.netSalary).toLocaleString()}`,       color: "#6ee7b7" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 animate-slide-up"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Payslip</p>
            <h2 className="text-xl font-bold text-white">
              {MONTHS[payslip.month - 1]} {payslip.year}
            </h2>
            {payslip.user && (
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {payslip.user.name} · {payslip.user.employeeId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Rows */}
        <div className="space-y-2 mb-5">
          {rows.map((r, i) => (
            <div
              key={r.label}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{
                background: i === rows.length - 1 ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
                border: i === rows.length - 1 ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
              }}
            >
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{r.label}</span>
              <span className="text-sm font-semibold" style={{ color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Print / PDF */}
        <a
          href={`/print/payslips/${payslip.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all mb-3"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save as PDF
        </a>

        {/* Delete — admin only */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all mb-3 disabled:opacity-50"
            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? "Deleting..." : "Delete Payslip"}
          </button>
        )}

        {payslip.generatedBy && (
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
            Generated by {payslip.generatedBy.name} · {new Date(payslip.generatedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PayslipList({
  payslips: initialPayslips, showEmployee, isAdmin = false,
}: {
  payslips: any[]; showEmployee: boolean; isAdmin?: boolean;
}) {
  const [payslips, setPayslips] = useState(initialPayslips);
  const [selected, setSelected] = useState<any>(null);

  if (payslips.length === 0) {
    return <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.35)" }}>No payslips found</p>;
  }

  return (
    <>
      {selected && (
        <PayslipModal
          payslip={selected}
          onClose={() => setSelected(null)}
          isAdmin={isAdmin}
          onDeleted={() => setPayslips((prev) => prev.filter((p) => p.id !== selected.id))}
        />
      )}

      <div className="space-y-2">
        {payslips.map((p) => {
          const deductionRate = p.baseSalary > 0 ? (p.totalDeduction / p.baseSalary) * 100 : 0;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full text-left rounded-xl px-5 py-4 transition-all duration-150 hover:scale-[1.005] group"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#c4b5fd" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                      {MONTHS[p.month - 1]} {p.year}
                      {showEmployee && p.user && (
                        <span className="ml-2 font-normal" style={{ color: "rgba(255,255,255,0.5)" }}>
                          — {p.user.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {p.presentDays}P · {p.lateDays}L · {p.halfDays}H · {p.absentDays}A
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">Rs. {Number(p.netSalary).toLocaleString()}</p>
                  {p.totalDeduction > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: "#fca5a5" }}>
                      −Rs. {Number(p.totalDeduction).toLocaleString()} ({Math.round(deductionRate)}%)
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
