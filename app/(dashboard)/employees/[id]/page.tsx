import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditProfileModal from "@/components/employees/edit-profile-modal";
import DocumentsSection from "@/components/employees/documents-section";
import DeleteEmployee from "@/components/employees/delete-employee";
import ResetPassword from "@/components/employees/reset-password";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!["admin", "manager"].includes(role)) redirect("/");

  const { id } = await params;
  const employee = await prisma.user.findUnique({
    where: { id },
    include: {
      leads: { select: { status: true, dealValue: true }, orderBy: { createdAt: "desc" } },
      tasksAssigned: { select: { status: true }, orderBy: { createdAt: "desc" } },
      attendances: { select: { status: true }, orderBy: { date: "desc" }, take: 30 },
      documents: {
        select: { id: true, name: true, category: true, fileName: true, fileType: true, fileSize: true, notes: true, uploadedAt: true },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });
  if (!employee) notFound();

  const wonLeads   = employee.leads.filter((l) => l.status === "won");
  const wonRevenue = wonLeads.reduce((s, l) => s + (l.dealValue || 0), 0);
  const presentDays = employee.attendances.filter((a) => ["present","late","half_day"].includes(a.status)).length;
  const attendancePct = employee.attendances.length > 0
    ? Math.round((presentDays / employee.attendances.length) * 100) : 0;

  const DOC_CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
    offer_letter: { label: "Offer Letter", color: "#6ee7b7", icon: "📄" },
    nda:          { label: "NDA",           color: "#a78bfa", icon: "🔒" },
    contract:     { label: "Contract",      color: "#60a5fa", icon: "📋" },
    id_copy:      { label: "ID Copy",       color: "#fcd34d", icon: "🪪" },
    other:        { label: "Other",         color: "#94a3b8", icon: "📁" },
  };

  const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
    active:     { label: "Active",     color: "#6ee7b7", bg: "rgba(16,185,129,0.1)" },
    inactive:   { label: "Inactive",   color: "#fcd34d", bg: "rgba(245,158,11,0.1)" },
    terminated: { label: "Terminated", color: "#f87171", bg: "rgba(239,68,68,0.1)" },
  };
  const empStatus = statusCfg[employee.status ?? "active"] ?? statusCfg.active;

  function fmtDate(d: Date | null | undefined) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-slide-up">
      <Link href="/employees" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "rgba(255,255,255,0.4)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Team
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            {employee.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{employee.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: empStatus.bg, color: empStatus.color }}>
                {empStatus.label}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {employee.designation || (employee.role.charAt(0).toUpperCase() + employee.role.slice(1))}
              {employee.department ? ` · ${employee.department}` : ""}
            </p>
            <p className="text-xs mt-1 font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
              {employee.employeeId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EditProfileModal employee={employee} />
          {role === "admin" && employee.role !== "admin" && (
            <>
              <ResetPassword id={employee.id} />
              <DeleteEmployee id={employee.id} employeeId={employee.employeeId} />
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Leads", value: employee.leads.length,                    color: "#a78bfa" },
          { label: "Won Deals",   value: wonLeads.length,                           color: "#6ee7b7" },
          { label: "Revenue",     value: `$${wonRevenue.toLocaleString()}`,          color: "#34d399" },
          { label: "Attendance",  value: `${attendancePct}%`,                       color: "#60a5fa" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Personal Info */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Personal Information</p>
          <div className="space-y-3">
            {[
              { label: "Full Name",   value: employee.name },
              { label: "Email",       value: employee.email || "—" },
              { label: "Phone",       value: employee.phone || "—" },
              { label: "CNIC",        value: employee.cnic || "—" },
              { label: "Gender",      value: employee.gender || "—" },
              { label: "Blood Group", value: employee.bloodGroup || "—" },
              { label: "Address",     value: employee.address || "—" },
              { label: "City",        value: employee.city || "—" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm gap-4">
                <span className="flex-shrink-0 w-28" style={{ color: "rgba(255,255,255,0.45)" }}>{r.label}</span>
                <span className="text-white text-right break-all">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Job Info */}
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Job Information</p>
          <div className="space-y-3">
            {[
              { label: "Employee ID",  value: employee.employeeId },
              { label: "Designation",  value: employee.designation || "—" },
              { label: "Role",         value: employee.role.charAt(0).toUpperCase() + employee.role.slice(1) },
              { label: "Department",   value: employee.department || "—" },
              { label: "Joining Date", value: fmtDate(employee.joiningDate) },
              { label: "Salary",       value: employee.salary > 0 ? `Rs. ${employee.salary.toLocaleString()}` : "—" },
              { label: "Bank Name",    value: employee.bankName || "—" },
              { label: "Bank Account", value: employee.bankAccount || "—" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm gap-4">
                <span className="flex-shrink-0 w-28" style={{ color: "rgba(255,255,255,0.45)" }}>{r.label}</span>
                <span className="text-white text-right">{r.value}</span>
              </div>
            ))}
          </div>

          {(employee.emergencyContactName || employee.emergencyContactPhone) && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Emergency Contact</p>
              <div className="space-y-2">
                {employee.emergencyContactName && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>Name</span>
                    <span className="text-white">{employee.emergencyContactName}</span>
                  </div>
                )}
                {employee.emergencyContactPhone && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>Phone</span>
                    <span className="text-white">{employee.emergencyContactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <DocumentsSection
        employeeId={employee.id}
        employeeName={employee.name}
        documents={employee.documents}
        docCategories={DOC_CATEGORIES}
        canUpload={["admin", "manager"].includes(role)}
        canDelete={role === "admin"}
      />
    </div>
  );
}
