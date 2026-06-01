import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import AddEmployeeForm from "@/components/employees/add-employee-form";
import DeleteEmployee from "@/components/employees/delete-employee";
import ResetPassword from "@/components/employees/reset-password";
import Link from "next/link";

async function getEmployees() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default async function EmployeesPage() {
  const session =
    await getServerSession(authOptions);

  if ((session?.user as any)?.role !== "admin") {
    redirect("/");
  }

  const employees = await getEmployees();

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">
          Employee Management
          <span className="text-zinc-400 ml-3 text-2xl">
            ({employees.length})
          </span>
        </h1>

        <AddEmployeeForm />

        {employees.length === 0 ? (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-12 text-center">
            <h3 className="text-2xl font-semibold mb-2">
              No employees found
            </h3>

            <p className="text-zinc-400">
              Create your first employee to get started.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="text-left p-4">
                    Name
                  </th>

                  <th className="text-left p-4">
                    Employee ID
                  </th>

                  <th className="text-left p-4">
  Role
</th>

<th className="text-left p-4">
  Actions
</th>
                </tr>
              </thead>

              <tbody>
                {employees.map(
                  (employee: any) => (
                    <tr
                      key={employee.id}
                      className="border-t border-white/10 hover:bg-zinc-800 transition"
                    >
                      <td className="p-4 font-medium">
  <Link
    href={`/employees/${employee.id}`}
    className="hover:text-blue-400"
  >
    {employee.name}
  </Link>
</td>

                      <td className="p-4 text-zinc-400">
                        {
                          employee.employeeId
                        }
                      </td>

                      <td className="p-4 capitalize">
  {employee.role}
</td>

<td className="p-4">
  {employee.role !== "admin" && (
    <>
  <ResetPassword
    id={employee.id}
  />

  <DeleteEmployee
    id={employee.id}
    employeeId={
      employee.employeeId
    }
  />
</>
  )}
</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}