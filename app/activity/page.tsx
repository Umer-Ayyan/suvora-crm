import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getLogs() {
  return prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const logs = await getLogs();

  return (
    <div className="p-8 max-w-5xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Last {logs.length} actions across the team
        </p>
      </div>

      <div className="space-y-2">
        {logs.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No activity logs yet</p>
          </div>
        ) : (
          logs.map((log: any) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-4 rounded-xl transition-colors duration-150 hover:bg-white/[0.045]"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))", color: "#c4b5fd" }}
              >
                {log.user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{log.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {log.user?.name && (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{log.user.name}</span>
                  )}
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
