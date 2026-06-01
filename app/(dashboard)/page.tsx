import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getAdminStats() {
  const totalLeads = await prisma.lead.count();

  const proposalSent = await prisma.lead.count({
    where: {
      status: "proposal",
    },
  });

  const closedDeals = await prisma.lead.count({
    where: {
      status: "won",
    },
  });

  const employeeStats =
    await prisma.user.findMany({
      include: {
        leads: true,
      },
    });

  return {
    totalLeads,
    proposalSent,
    closedDeals,
    employeeStats,
  };
}

async function getEmployeeStats(
  employeeId: string
) {
  const user =
    await prisma.user.findUnique({
      where: {
        employeeId,
      },
      include: {
        leads: true,
      },
    });

  return user;
}

export default async function DashboardPage() {
  const session =
    await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any)
    .role;

  if (role === "employee") {
    const employee =
      await getEmployeeStats(
        (session.user as any)
          .employeeId
      );

    if (!employee) {
      redirect("/login");
    }

    const totalLeads =
      employee.leads.length;

    const proposalSent =
      employee.leads.filter(
        (lead) =>
          lead.status ===
          "proposal"
      ).length;

    const wonDeals =
      employee.leads.filter(
        (lead) =>
          lead.status === "won"
      ).length;

    const conversionRate =
      totalLeads > 0
        ? (
            (wonDeals /
              totalLeads) *
            100
          ).toFixed(1)
        : "0";

    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-10">
            My Dashboard
          </h1>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <p className="text-zinc-400">
                My Leads
              </p>

              <h2 className="text-5xl font-bold mt-3">
                {totalLeads}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <p className="text-zinc-400">
                Proposals
              </p>

              <h2 className="text-5xl font-bold mt-3">
                {proposalSent}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <p className="text-zinc-400">
                Won Deals
              </p>

              <h2 className="text-5xl font-bold mt-3">
                {wonDeals}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <p className="text-zinc-400">
                Conversion
              </p>

              <h2 className="text-5xl font-bold mt-3">
                {conversionRate}%
              </h2>
            </div>
          </div>

          <div className="mt-12 bg-zinc-900 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              My Recent Leads
            </h2>

            <div className="space-y-4">
              {employee.leads
                .slice(0, 10)
                .map((lead) => (
                  <div
                    key={lead.id}
                    className="border border-white/10 rounded-2xl p-4"
                  >
                    <h3 className="font-semibold">
                      {lead.name}
                    </h3>

                    <p className="text-zinc-400">
                      {lead.company}
                    </p>

                    <p className="capitalize text-zinc-500">
                      {lead.status}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const stats =
    await getAdminStats();

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400 text-sm">
              Total Leads
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {stats.totalLeads}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400 text-sm">
              Proposal Sent
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {stats.proposalSent}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400 text-sm">
              Won Deals
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {stats.closedDeals}
            </h2>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">
            Employee Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stats.employeeStats.map(
              (employee: any) => {
                const wonDeals =
                  employee.leads.filter(
                    (lead: any) =>
                      lead.status ===
                      "won"
                  ).length;

                return (
                  <div
                    key={
                      employee.id
                    }
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-6"
                  >
                    <h3 className="text-2xl font-bold">
                      {
                        employee.name
                      }
                    </h3>

                    <p className="text-zinc-400 mt-2">
                      Employee ID:
                      {" "}
                      {
                        employee.employeeId
                      }
                    </p>

                    <div className="mt-6 space-y-3">
                      <p>
                        Total Leads:
                        {" "}
                        <span className="font-bold">
                          {
                            employee
                              .leads
                              .length
                          }
                        </span>
                      </p>

                      <p>
                        Won Deals:
                        {" "}
                        <span className="font-bold">
                          {
                            wonDeals
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </main>
  );
}