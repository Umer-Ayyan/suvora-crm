import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AttendanceManageClient from "./client";

export default async function AttendanceManagePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; userId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!["admin", "manager"].includes(role)) redirect("/attendance");

  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month || now.getMonth() + 1);
  const year  = Number(params.year  || now.getFullYear());

  const employees = await prisma.user.findMany({
    where: { role: { in: ["employee", "manager"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, employeeId: true, salary: true },
  });

  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: start, lt: end }, user: { role: { in: ["employee", "manager"] } } },
    include: { user: { select: { id: true, name: true, employeeId: true, salary: true } } },
    orderBy: [{ date: "desc" }, { user: { name: "asc" } }],
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-slide-up">
      {/* Back */}
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:text-white"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Management</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {records.length} records for{" "}
            {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {year}
          </p>
        </div>
      </div>

      <AttendanceManageClient
        records={records}
        employees={employees}
        month={month}
        year={year}
        isAdmin={role === "admin"}
      />
    </div>
  );
}
