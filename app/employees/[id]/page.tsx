import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

import DeleteEmployee from "@/components/employees/delete-employee";
import ResetPassword from "@/components/employees/reset-password";

async function getEmployee(id: string) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      leads: true,
    },
  });
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const employee =
    await getEmployee(id);

  if (!employee) {
    notFound();
  }

  const totalLeads =
    employee.leads.length;

  const newLeads =
    employee.leads.filter(
      (lead) =>
        lead.status === "new"
    ).length;

  const contactedLeads =
    employee.leads.filter(
      (lead) =>
        lead.status ===
        "contacted"
    ).length;

  const proposalLeads =
    employee.leads.filter(
      (lead) =>
        lead.status ===
        "proposal"
    ).length;

  const wonLeads =
    employee.leads.filter(
      (lead) =>
        lead.status === "won"
    ).length;

  const lostLeads =
    employee.leads.filter(
      (lead) =>
        lead.status === "lost"
    ).length;

  const conversionRate =
    totalLeads > 0
      ? (
          (wonLeads /
            totalLeads) *
          100
        ).toFixed(1)
      : "0";

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/employees"
            className="bg-zinc-900 border border-white/10 px-5 py-3 rounded-xl hover:bg-zinc-800 transition"
          >
            ← Back to Employees
          </Link>

          {employee.role !== "admin" && (
            <div className="flex items-center gap-4">
              <ResetPassword
                id={employee.id}
              />

              <DeleteEmployee
                id={employee.id}
                employeeId={
                  employee.employeeId
                }
              />
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
          <h1 className="text-4xl font-bold mb-4">
            Employee Profile
          </h1>

          {wonLeads >= 5 && (
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl mb-6">
              🏆 Top Performer
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-zinc-400">
                Name
              </p>

              <h2 className="text-2xl font-semibold">
                {employee.name}
              </h2>
            </div>

            <div>
              <p className="text-zinc-400">
                Employee ID
              </p>

              <h2 className="text-xl">
                {
                  employee.employeeId
                }
              </h2>
            </div>

            <div>
              <p className="text-zinc-400">
                Role
              </p>

              <h2 className="text-xl capitalize">
                {employee.role}
              </h2>
            </div>

            <div>
              <p className="text-zinc-400">
                Created
              </p>

              <h2 className="text-xl">
                {new Date(
                  employee.createdAt
                ).toLocaleDateString()}
              </h2>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-zinc-900 rounded-3xl p-6 border border-white/10">
            <p className="text-zinc-400">
              Total Leads
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {totalLeads}
            </h2>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-white/10">
            <p className="text-zinc-400">
              Won Leads
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {wonLeads}
            </h2>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-white/10">
            <p className="text-zinc-400">
              Lost Leads
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {lostLeads}
            </h2>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-white/10">
            <p className="text-zinc-400">
              Performance
            </p>

            <div className="mt-4 space-y-2">
              <p>
                Leads: {totalLeads}
              </p>

              <p>
                Won: {wonLeads}
              </p>

              <p className="font-bold text-2xl">
                {conversionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6">
            Lead Breakdown
          </h2>

          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <p className="text-zinc-400">
                New
              </p>

              <h3 className="text-3xl font-bold">
                {newLeads}
              </h3>
            </div>

            <div>
              <p className="text-zinc-400">
                Contacted
              </p>

              <h3 className="text-3xl font-bold">
                {
                  contactedLeads
                }
              </h3>
            </div>

            <div>
              <p className="text-zinc-400">
                Proposal
              </p>

              <h3 className="text-3xl font-bold">
                {
                  proposalLeads
                }
              </h3>
            </div>

            <div>
              <p className="text-zinc-400">
                Won
              </p>

              <h3 className="text-3xl font-bold">
                {wonLeads}
              </h3>
            </div>

            <div>
              <p className="text-zinc-400">
                Lost
              </p>

              <h3 className="text-3xl font-bold">
                {lostLeads}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6">
            Recent Leads
          </h2>

          {employee.leads.length ===
          0 ? (
            <p className="text-zinc-400">
              No leads assigned
            </p>
          ) : (
            <div className="space-y-4">
              {employee.leads
                .slice(0, 10)
                .map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="block border border-white/10 rounded-2xl p-4 hover:bg-zinc-800 transition"
                  >
                    <h3 className="font-semibold">
                      {lead.name}
                    </h3>

                    <p className="text-zinc-400 text-sm">
                      {lead.company}
                    </p>

                    <p className="text-zinc-500 text-sm capitalize">
                      {lead.status}
                    </p>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}