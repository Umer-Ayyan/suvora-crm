import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getLogs() {
  return prisma.activityLog.findMany({
    include: {
      user: true,
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 100,
  });
}

export default async function ActivityPage() {
  const session =
    await getServerSession(
      authOptions
    );

  if (
    (session?.user as any)?.role !==
    "admin"
  ) {
    redirect("/");
  }

  const logs = await getLogs();

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">
          Activity Logs
        </h1>

        <div className="space-y-4">
          {logs.map(
            (log: any) => (
              <div
                key={log.id}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-5"
              >
                <p className="font-medium">
                  {
                    log.description
                  }
                </p>

                <p className="text-zinc-500 text-sm mt-2">
                  {new Date(
                    log.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}