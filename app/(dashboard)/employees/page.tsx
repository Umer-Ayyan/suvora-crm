import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import AddEmployeeForm from "@/components/employees/add-employee-form";
import RoleSelect from "@/components/employees/role-select";
import DeleteEmployee from "@/components/employees/delete-employee";
import ResetPassword from "@/components/employees/reset-password";
import EditEmployeeForm from "@/components/employees/edit-employee-form";
import Link from "next/link";

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const currentUserId = (session?.user as any)?.id;
  if (role !== "admin") redirect("/");

  const employees = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  const adminCount = employees.filter((e) => e.role === "admin").length;
  const managerCount = employees.filter((e) => e.role === "manager").length;
  const employeeCount = employees.filter((e) => e.role === "employee").length;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Team Management</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {employees.length} team members · {adminCount} admin · {managerCount} manager{managerCount !== 1 ? "s" : ""} · {employeeCount} employee{employeeCount !== 1 ? "s" : ""}
        </p>
      </div>

      <AddEmployeeForm />

      {employees.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)" }}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No team members yet</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Add your first employee to get started.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Member", "Employee ID", "Role", "Department", "Salary", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.02)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, i) => (
                <tr key={employee.id} className="transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: i < employees.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                        {employee.name?.[0]?.toUpperCase()}
                      </div>
                      <Link href={`/employees/${employee.id}`} className="text-sm font-medium text-white hover:text-violet-400 transition-colors">
                        {employee.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {employee.employeeId}
                  </td>
                  <td className="px-5 py-3.5">
                    <RoleSelect id={employee.id} currentRole={employee.role} isSelf={employee.id === currentUserId} />
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {employee.department || <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {employee.role !== "admin" && employee.salary > 0
                      ? `Rs. ${employee.salary.toLocaleString()}`
                      : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {employee.role !== "admin" && (
                      <div className="flex items-center gap-2">
                        <EditEmployeeForm employee={{
                          id: employee.id,
                          name: employee.name,
                          role: employee.role,
                          department: employee.department,
                          phone: employee.phone,
                          salary: employee.salary,
                        }} />
                        <ResetPassword id={employee.id} />
                        <DeleteEmployee id={employee.id} employeeId={employee.employeeId} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
