import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const todaysFollowUps =
    await prisma.lead.findMany({
      where: {
        followUpDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        followUpDate: "asc",
      },
      include: {
        createdBy: true,
      },
      take: 10,
    });

  const overdueLeads =
    await prisma.lead.findMany({
      where: {
        followUpDate: {
          lt: today,
        },

        NOT: {
          status: "won",
        },
      },
      orderBy: {
        followUpDate: "asc",
      },
      include: {
        createdBy: true,
      },
      take: 10,
    });

  return {
    totalLeads,
    proposalSent,
    closedDeals,
    employeeStats,
    todaysFollowUps,
    overdueLeads,
  };
}

async function getEmployeeStats(
  employeeId: string
) {
  return prisma.user.findUnique({
    where: {
      employeeId,
    },
    include: {
      leads: true,
    },
  });
}

export default async function DashboardPage() {
  const session =
    await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role =
    (session.user as any).role;

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
        (lead: any) =>
          lead.status ===
          "proposal"
      ).length;

    const wonDeals =
      employee.leads.filter(
        (lead: any) =>
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow =
      new Date(today);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const todaysFollowUps =
      employee.leads.filter(
        (lead: any) =>
          lead.followUpDate &&
          new Date(
            lead.followUpDate
          ) >= today &&
          new Date(
            lead.followUpDate
          ) < tomorrow
      );

    const overdueLeads =
      employee.leads.filter(
        (lead: any) =>
          lead.followUpDate &&
          new Date(
            lead.followUpDate
          ) < today &&
          lead.status !== "won"
      );

    return (
      <main className="min-h-screen bg-zinc-950 text-white p-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-10">
            My Dashboard
          </h1>

          <div className="grid md:grid-cols-6 gap-6">
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

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <p className="text-zinc-400">
                Follow-ups Today
              </p>

              <h2 className="text-5xl font-bold mt-3">
                {
                  todaysFollowUps.length
                }
              </h2>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
              <p className="text-zinc-400">
                Overdue
              </p>

              <h2 className="text-5xl font-bold mt-3 text-red-400">
                {
                  overdueLeads.length
                }
              </h2>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6">
                Today's Follow-ups
              </h2>

              <div className="space-y-4">
                {todaysFollowUps
                  .length === 0 ? (
                  <p className="text-zinc-500">
                    No follow-ups
                    today
                  </p>
                ) : (
                  todaysFollowUps.map(
                    (lead: any) => (
                      <Link
                        key={
                          lead.id
                        }
                        href={`/leads/${lead.id}`}
                        className="block border border-white/10 rounded-2xl p-4 hover:bg-zinc-800"
                      >
                        <h3 className="font-semibold">
                          {
                            lead.name
                          }
                        </h3>

                        <p className="text-zinc-500 capitalize">
                          {
                            lead.priority
                          }
                        </p>
                      </Link>
                    )
                  )
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-red-400">
                Overdue Leads
              </h2>

              <div className="space-y-4">
                {overdueLeads
                  .length === 0 ? (
                  <p className="text-zinc-500">
                    No overdue
                    leads
                  </p>
                ) : (
                  overdueLeads.map(
                    (lead: any) => (
                      <Link
                        key={
                          lead.id
                        }
                        href={`/leads/${lead.id}`}
                        className="block border border-red-500/20 rounded-2xl p-4 hover:bg-zinc-800"
                      >
                        <h3 className="font-semibold">
                          {
                            lead.name
                          }
                        </h3>

                        <p className="text-red-400 capitalize">
                          {
                            lead.priority
                          }
                        </p>
                      </Link>
                    )
                  )
                )}
              </div>
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

        <div className="grid md:grid-cols-5 gap-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400">
              Total Leads
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {
                stats.totalLeads
              }
            </h2>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400">
              Proposal Sent
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {
                stats.proposalSent
              }
            </h2>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400">
              Won Deals
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {
                stats.closedDeals
              }
            </h2>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400">
              Today's Follow-ups
            </p>

            <h2 className="text-5xl font-bold mt-3">
              {
                stats
                  .todaysFollowUps
                  .length
              }
            </h2>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6">
            <p className="text-zinc-400">
              Overdue Leads
            </p>

            <h2 className="text-5xl font-bold mt-3 text-red-400">
              {
                stats
                  .overdueLeads
                  .length
              }
            </h2>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              Today's Follow-ups
            </h2>

            <div className="space-y-4">
              {stats
                .todaysFollowUps
                .length === 0 ? (
                <p className="text-zinc-500">
                  No follow-ups
                  today
                </p>
              ) : (
                stats.todaysFollowUps.map(
                  (lead: any) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="block border border-white/10 rounded-2xl p-4 hover:bg-zinc-800"
                    >
                      <h3 className="font-semibold">
                        {
                          lead.name
                        }
                      </h3>

                      <p className="text-zinc-500">
                        {
                          lead.createdBy
                            ?.name
                        }
                      </p>
                    </Link>
                  )
                )
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-red-400">
              Overdue Leads
            </h2>

            <div className="space-y-4">
              {stats
                .overdueLeads
                .length === 0 ? (
                <p className="text-zinc-500">
                  No overdue
                  leads
                </p>
              ) : (
                stats.overdueLeads.map(
                  (lead: any) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="block border border-red-500/20 rounded-2xl p-4 hover:bg-zinc-800"
                    >
                      <h3 className="font-semibold">
                        {
                          lead.name
                        }
                      </h3>

                      <p className="text-red-400">
                        {
                          lead.createdBy
                            ?.name
                        }
                      </p>
                    </Link>
                  )
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">
            Employee Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stats.employeeStats.map(
              (
                employee: any
              ) => {
                const wonDeals =
                  employee.leads.filter(
                    (
                      lead: any
                    ) =>
                      lead.status ===
                      "won"
                  ).length;

                const conversion =
                  employee.leads
                    .length > 0
                    ? (
                        (wonDeals /
                          employee
                            .leads
                            .length) *
                        100
                      ).toFixed(1)
                    : "0";

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
                      Employee
                      ID:{" "}
                      {
                        employee.employeeId
                      }
                    </p>

                    <div className="mt-6 space-y-3">
                      <p>
                        Total
                        Leads:{" "}
                        <span className="font-bold">
                          {
                            employee
                              .leads
                              .length
                          }
                        </span>
                      </p>

                      <p>
                        Won
                        Deals:{" "}
                        <span className="font-bold">
                          {
                            wonDeals
                          }
                        </span>
                      </p>

                      <p>
                        Conversion:{" "}
                        <span className="font-bold">
                          {
                            conversion
                          }
                          %
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