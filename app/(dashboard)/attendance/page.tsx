import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CheckInButton from "@/components/attendance/check-in-button";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  present:  { label: "Present",  color: "#6ee7b7", bg: "rgba(16,185,129,0.15)"  },
  late:     { label: "Late",     color: "#fcd34d", bg: "rgba(245,158,11,0.15)"  },
  half_day: { label: "Half Day", color: "#fca5a5", bg: "rgba(239,68,68,0.15)"   },
  absent:   { label: "Absent",   color: "#f87171", bg: "rgba(239,68,68,0.12)"   },
  leave:    { label: "Leave",    color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
};

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;

  // Admin doesn't mark personal attendance — send to manage view
  if (role === "admin") redirect("/attendance/manage");

  const employeeId = (session.user as any).employeeId;

  const user = await prisma.user.findUnique({ where: { employeeId } });
  if (!user) redirect("/login");

  // Today in PKT — night shift: after midnight PKT counts as previous day's shift
  const pktNow = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
  const pktHour = pktNow.getUTCHours();
  const todayDate = pktHour < 6
    ? new Date(Date.UTC(pktNow.getUTCFullYear(), pktNow.getUTCMonth(), pktNow.getUTCDate() - 1))
    : new Date(Date.UTC(pktNow.getUTCFullYear(), pktNow.getUTCMonth(), pktNow.getUTCDate()));

  const todayRecord = await prisma.attendance.findUnique({
    where: { userId_date: { userId: user.id, date: todayDate } },
  });

  // Last 30 days history
  const thirtyDaysAgo = new Date(todayDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const history = await prisma.attendance.findMany({
    where: { userId: user.id, date: { gte: thirtyDaysAgo } },
    orderBy: { date: "desc" },
    take: 30,
  });

  // Stats for this month
  const monthStart = new Date(Date.UTC(pktNow.getUTCFullYear(), pktNow.getUTCMonth(), 1));
  const monthRecords = history.filter((r) => new Date(r.date) >= monthStart);
  const presentCount  = monthRecords.filter((r) => r.status === "present").length;
  const lateCount     = monthRecords.filter((r) => r.status === "late").length;
  const halfCount     = monthRecords.filter((r) => r.status === "half_day").length;
  const absentCount   = monthRecords.filter((r) => r.status === "absent").length;
  const totalDeductionPct = monthRecords.reduce((s, r) => s + r.deductionPct, 0);

  const dailySalary = user.salary > 0
    ? user.salary / 26 // approx Mon-Sat working days per month
    : 0;
  const estimatedDeduction = (totalDeductionPct / 100) * dailySalary;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Attendance</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {pktNow.toUTCString().slice(0, 16)}
          </p>
        </div>
        {["admin", "manager"].includes(role) && (
          <Link
            href="/attendance/manage"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Manage All Attendance
          </Link>
        )}
      </div>

      {/* Check-in widget */}
      <div className="mb-8">
        <CheckInButton todayRecord={todayRecord} role={role} />
      </div>

      {/* Monthly summary */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-base font-semibold text-white mb-4">This Month&apos;s Summary</h2>
        <div className={`grid grid-cols-2 gap-3 ${role !== "employee" ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
          {[
            { label: "Present",  value: presentCount, color: "#6ee7b7" },
            { label: "Late",     value: lateCount,    color: "#fcd34d" },
            { label: "Half Day", value: halfCount,    color: "#fca5a5" },
            { label: "Absent",   value: absentCount,  color: "#f87171" },
            ...(role !== "employee" ? [{ label: "Est. Deduction", value: `Rs. ${Math.round(estimatedDeduction).toLocaleString()}`, color: "#fca5a5" as string }] : []),
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-base font-semibold text-white mb-4">Attendance History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.35)" }}>No records yet</p>
        ) : (
          <div className="space-y-2">
            {history.map((r) => {
              const sc = statusConfig[r.status] ?? statusConfig.absent;
              const dateStr = new Date(r.date).toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric" });
              const checkInPKT = r.checkInTime
                ? new Date(new Date(r.checkInTime).getTime() + 5 * 60 * 60 * 1000).toUTCString().slice(17, 22) + " PKT"
                : "—";
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.color }} />
                    <div>
                      <p className="text-sm font-medium text-white">{dateStr}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Check-in: {checkInPKT}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.deductionPct > 0 && !["employee"].includes(role) && (
                      <span className="text-xs" style={{ color: "#fca5a5" }}>−{r.deductionPct}%</span>
                    )}
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
