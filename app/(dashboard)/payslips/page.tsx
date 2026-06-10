import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GeneratePayslip from "@/components/payslips/generate-payslip";
import PayslipList from "@/components/payslips/payslip-list";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function PayslipsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!["admin", "manager"].includes(role)) redirect("/payslips/my");

  const employees = await prisma.user.findMany({
    where: { role: { in: ["employee", "manager"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, employeeId: true, salary: true },
  });

  const allPayslips = await prisma.payslip.findMany({
    include: {
      user: { select: { id: true, name: true, employeeId: true } },
      generatedBy: { select: { name: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 50,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Payslip Management</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Generate and manage monthly payslips for all employees
        </p>
      </div>

      {/* Generate section */}
      <div
        className="rounded-2xl p-6 mb-7 card-accent-border"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-base font-semibold text-white mb-5">Generate Payslip</h2>
        <GeneratePayslip employees={employees} />
      </div>

      {/* All payslips */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-base font-semibold text-white mb-5">
          All Payslips
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
            style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
            {allPayslips.length}
          </span>
        </h2>
        <PayslipList payslips={allPayslips} showEmployee isAdmin={role === "admin"} />
      </div>
    </div>
  );
}
