import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import AddEmployeeForm from "@/components/employees/add-employee-form";
import DeleteEmployee from "@/components/employees/delete-employee";
import ResetPassword from "@/components/employees/reset-password";
import Link from "next/link";

async function getEmployees() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const employees = await getEmployees();

  return (
    <div className="p-8 max-w-6xl mx-auto animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Management</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {employees.length} team member{employees.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <AddEmployeeForm />

      {employees.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-lg font-semibold text-white mb-1">No employees found</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Create your first employee to get started.</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Name", "Employee ID", "Role", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.02)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee: any, i) => (
                <tr
                  key={employee.id}
                  className="transition-colors duration-150 hover:bg-white/[0.04]"
                  style={{ borderBottom: i < employees.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}
                      >
                        {employee.name?.[0]?.toUpperCase()}
                      </div>
                      <Link href={`/employees/${employee.id}`} className="text-sm font-medium text-white hover:text-violet-400 transition-colors">
                        {employee.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {employee.employeeId}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                      style={
                        employee.role === "admin"
                          ? { background: "rgba(124,58,237,0.15)", color: "#c4b5fd" }
                          : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }
                      }
                    >
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {employee.role !== "admin" && (
                      <div className="flex items-center gap-2">
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
      )}
    </div>
  );
}
