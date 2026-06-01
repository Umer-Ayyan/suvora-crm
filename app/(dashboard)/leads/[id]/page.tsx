import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import AssignEmployee from "@/components/leads/assign-employee";
import AddNote from "@/components/leads/add-note";
import LeadManagement from "@/components/leads/lead-management";

async function getLead(
  id: string,
  employeeId: string,
  role: string
) {
  const user = await prisma.user.findUnique({
    where: {
      employeeId,
    },
  });

  if (!user) {
    return null;
  }

  if (role === "admin") {
    return prisma.lead.findUnique({
      where: {
        id,
      },
      include: {
        createdBy: true,
        leadNotes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  return prisma.lead.findFirst({
    where: {
      id,
      createdById: user.id,
    },
    include: {
      createdBy: true,
      leadNotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session =
    await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="text-white p-10">
        Unauthorized
      </div>
    );
  }

  const { id } = await params;

  const lead = await getLead(
    id,
    (session.user as any).employeeId,
    (session.user as any).role
  );

  if (!lead) {
    return (
      <div className="text-white p-10">
        Lead not found
      </div>
    );
  }

  const employees =
    (session.user as any).role ===
    "admin"
      ? await prisma.user.findMany({
          where: {
            role: "employee",
          },
          orderBy: {
            name: "asc",
          },
        })
      : [];

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-4xl mx-auto bg-zinc-900 rounded-3xl p-8 border border-white/10">
        <h1 className="text-4xl font-bold mb-8">
          {lead.name}
        </h1>

        <div className="space-y-5">
          <div>
            <p className="text-zinc-400 text-sm">
              Company
            </p>

            <h2 className="text-xl">
              {lead.company || "-"}
            </h2>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Email
            </p>

            <h2 className="text-xl">
              {lead.email || "-"}
            </h2>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Budget
            </p>

            <h2 className="text-xl">
              {lead.budget || "-"}
            </h2>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Status
            </p>

            <h2 className="text-xl capitalize">
              {lead.status}
            </h2>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Priority
            </p>

            <h2 className="text-xl capitalize">
              {lead.priority || "medium"}
            </h2>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Follow-up Date
            </p>

            <h2 className="text-xl">
              {lead.followUpDate
                ? new Date(
                    lead.followUpDate
                  ).toLocaleDateString()
                : "Not Scheduled"}
            </h2>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Assigned To
            </p>

            <h2 className="text-xl">
              {lead.createdBy?.name ||
                "Unassigned"}
            </h2>
          </div>

          <div>
            <p className="text-zinc-400 text-sm">
              Original Notes
            </p>

            <p className="text-lg leading-8">
              {lead.notes || "-"}
            </p>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-4">
              Lead Management
            </h2>

            <LeadManagement
              leadId={lead.id}
              currentStatus={lead.status}
              currentPriority={
                lead.priority
              }
              currentFollowUpDate={
                lead.followUpDate
              }
            />
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-4">
              Add Follow-up Note
            </h2>

            <AddNote
              leadId={lead.id}
            />
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-2xl font-bold mb-4">
              Timeline
            </h2>

            <div className="space-y-4">
              {lead.leadNotes.length ===
              0 ? (
                <p className="text-zinc-500">
                  No follow-up notes
                  yet.
                </p>
              ) : (
                lead.leadNotes.map(
                  (note: any) => (
                    <div
                      key={note.id}
                      className="bg-zinc-800 rounded-2xl p-4"
                    >
                      <p className="whitespace-pre-wrap">
                        {note.note}
                      </p>

                      <p className="text-zinc-500 text-sm mt-2">
                        {new Date(
                          note.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>

          {(session.user as any)
            .role === "admin" && (
            <div className="pt-6 border-t border-white/10">
              <h2 className="text-2xl font-bold mb-4">
                Reassign Lead
              </h2>

              <AssignEmployee
                leadId={lead.id}
                employees={employees}
                currentEmployeeId={
                  lead.createdById
                }
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}