import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PrintButton from "./print-button";

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

export default async function PrintPayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (!["admin", "manager"].includes(role)) redirect("/");

  const { id } = await params;

  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, employeeId: true } },
      generatedBy: { select: { name: true } },
    },
  });

  if (!payslip) redirect("/payslips");

  const monthName = MONTHS[payslip.month - 1];
  const rows = [
    { label: "Employee",       value: payslip.user.name },
    { label: "Employee ID",    value: payslip.user.employeeId },
    { label: "Period",         value: `${monthName} ${payslip.year}` },
    { label: "Base Salary",    value: `Rs. ${Number(payslip.baseSalary).toLocaleString()}` },
    { label: "Working Days",   value: String(payslip.workingDays) },
    { label: "Present Days",   value: String(payslip.presentDays) },
    { label: "Late Days",      value: String(payslip.lateDays) },
    { label: "Half Days",      value: String(payslip.halfDays) },
    { label: "Absent Days",    value: String(payslip.absentDays) },
    { label: "Total Deduction",value: `Rs. ${Number(payslip.totalDeduction).toLocaleString()}` },
    { label: "Net Salary",     value: `Rs. ${Number(payslip.netSalary).toLocaleString()}` },
  ];

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4" style={{ background: "var(--bg-base)" }}>
        {/* Toolbar */}
        <div className="no-print w-full max-w-2xl flex items-center justify-between mb-6">
          <Link href="/payslips" className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Back to Payslips
          </Link>
          <PrintButton />
        </div>

        {/* Payslip card */}
        <div
          className="print-card w-full max-w-2xl rounded-2xl p-8"
          style={{ background: "#fff", color: "#111" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6" style={{ borderBottom: "2px solid #7c3aed" }}>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#7c3aed" }}>Suvora</h1>
              <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>Salary Slip</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: "#111" }}>{monthName} {payslip.year}</p>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Generated: {new Date(payslip.generatedAt).toLocaleDateString("en-PK")}
              </p>
            </div>
          </div>

          {/* Employee info */}
          <div className="grid grid-cols-2 gap-4 mb-8 p-4 rounded-xl" style={{ background: "#f5f3ff" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7c3aed" }}>Employee</p>
              <p className="text-base font-bold mt-0.5">{payslip.user.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#7c3aed" }}>Employee ID</p>
              <p className="text-base font-bold mt-0.5">{payslip.user.employeeId}</p>
            </div>
          </div>

          {/* Attendance breakdown */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: "Present", value: payslip.presentDays, color: "#059669" },
              { label: "Late",    value: payslip.lateDays,    color: "#d97706" },
              { label: "Half Day",value: payslip.halfDays,    color: "#dc2626" },
              { label: "Absent",  value: payslip.absentDays,  color: "#dc2626" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Salary breakdown */}
          <table className="w-full mb-8">
            <tbody>
              {[
                { label: "Base Salary",     value: `Rs. ${Number(payslip.baseSalary).toLocaleString()}`,    bold: false },
                { label: "Working Days",    value: String(payslip.workingDays),                              bold: false },
                { label: "Total Deduction", value: `− Rs. ${Number(payslip.totalDeduction).toLocaleString()}`, bold: false, red: true },
              ].map((r) => (
                <tr key={r.label} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="py-3 text-sm" style={{ color: "#6b7280" }}>{r.label}</td>
                  <td className="py-3 text-sm font-semibold text-right" style={{ color: r.red ? "#dc2626" : "#111" }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Net salary */}
          <div className="rounded-xl p-5 flex items-center justify-between" style={{ background: "#f0fdf4", border: "2px solid #bbf7d0" }}>
            <p className="text-base font-semibold" style={{ color: "#166534" }}>Net Salary</p>
            <p className="text-2xl font-bold" style={{ color: "#15803d" }}>Rs. {Number(payslip.netSalary).toLocaleString()}</p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid #e5e7eb" }}>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              {payslip.generatedBy ? `Generated by ${payslip.generatedBy.name}` : ""}
            </p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>Suvora CRM</p>
          </div>
        </div>
      </div>
    </>
  );
}
