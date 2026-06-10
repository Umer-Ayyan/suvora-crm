import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  return (
    <html lang="en">
      <head>
        <title>Payslip – {payslip.user.name} – {monthName} {payslip.year}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111; }
          @media print {
            body { background: white; }
            .no-print { display: none !important; }
          }
          .page { max-width: 680px; margin: 0 auto; padding: 32px 16px; }
          .toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
          .back { color: #6b7280; text-decoration: none; font-size: 14px; }
          .print-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: white; font-size: 14px; font-weight: 600; border: none; cursor: pointer; }
          .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 2px solid #7c3aed; }
          .brand { font-size: 24px; font-weight: 800; color: #7c3aed; }
          .subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
          .period { text-align: right; }
          .period-label { font-size: 18px; font-weight: 700; color: #111; }
          .period-sub { font-size: 13px; color: #6b7280; margin-top: 2px; }
          .emp-box { background: #f5f3ff; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .emp-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #7c3aed; margin-bottom: 4px; }
          .emp-value { font-size: 15px; font-weight: 700; color: #111; }
          .att-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
          .att-cell { text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 8px; }
          .att-num { font-size: 20px; font-weight: 700; }
          .att-lbl { font-size: 11px; color: #6b7280; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
          td:last-child { text-align: right; font-weight: 600; }
          .net { background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
          .net-label { font-size: 15px; font-weight: 600; color: #166534; }
          .net-value { font-size: 24px; font-weight: 800; color: #15803d; }
          .footer { display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #e5e7eb; }
          .footer-text { font-size: 12px; color: #9ca3af; }
        `}</style>
      </head>
      <body>
        <div className="page">
          <div className="toolbar no-print">
            <a href="/payslips" className="back">← Back to Payslips</a>
            <PrintButton />
          </div>

          <div className="card">
            <div className="header">
              <div>
                <div className="brand">Suvora</div>
                <div className="subtitle">Salary Slip</div>
              </div>
              <div className="period">
                <div className="period-label">{monthName} {payslip.year}</div>
                <div className="period-sub">Generated: {new Date(payslip.generatedAt).toLocaleDateString("en-PK")}</div>
              </div>
            </div>

            <div className="emp-box">
              <div>
                <div className="emp-label">Employee</div>
                <div className="emp-value">{payslip.user.name}</div>
              </div>
              <div>
                <div className="emp-label">Employee ID</div>
                <div className="emp-value">{payslip.user.employeeId}</div>
              </div>
            </div>

            <div className="att-grid">
              {[
                { label: "Present", value: payslip.presentDays, color: "#059669" },
                { label: "Late",    value: payslip.lateDays,    color: "#d97706" },
                { label: "Half Day",value: payslip.halfDays,    color: "#dc2626" },
                { label: "Absent",  value: payslip.absentDays,  color: "#dc2626" },
              ].map((s) => (
                <div key={s.label} className="att-cell">
                  <div className="att-num" style={{ color: s.color }}>{s.value}</div>
                  <div className="att-lbl">{s.label}</div>
                </div>
              ))}
            </div>

            <table>
              <tbody>
                <tr>
                  <td style={{ color: "#6b7280" }}>Base Salary</td>
                  <td style={{ color: "#111" }}>Rs. {Number(payslip.baseSalary).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ color: "#6b7280" }}>Working Days</td>
                  <td style={{ color: "#111" }}>{payslip.workingDays}</td>
                </tr>
                <tr>
                  <td style={{ color: "#6b7280" }}>Total Deduction</td>
                  <td style={{ color: "#dc2626" }}>− Rs. {Number(payslip.totalDeduction).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div className="net">
              <span className="net-label">Net Salary</span>
              <span className="net-value">Rs. {Number(payslip.netSalary).toLocaleString()}</span>
            </div>

            <div className="footer">
              <span className="footer-text">
                {payslip.generatedBy ? `Generated by ${payslip.generatedBy.name}` : ""}
              </span>
              <span className="footer-text">Suvora CRM</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
