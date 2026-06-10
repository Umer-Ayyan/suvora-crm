import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PayslipList from "@/components/payslips/payslip-list";

export default async function MyPayslipsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const employeeId = (session.user as any).employeeId;
  const user = await prisma.user.findUnique({ where: { employeeId } });
  if (!user) redirect("/login");

  const payslips = await prisma.payslip.findMany({
    where: { userId: user.id },
    include: { generatedBy: { select: { name: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <div className="p-8 max-w-4xl mx-auto animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">My Payslips</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Your monthly salary statements
        </p>
      </div>

      {payslips.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(124,58,237,0.15)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p className="text-base font-semibold text-white mb-1">No payslips yet</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Your manager will generate payslips at the end of each month.
          </p>
        </div>
      ) : (
        <PayslipList payslips={payslips} showEmployee={false} />
      )}
    </div>
  );
}
