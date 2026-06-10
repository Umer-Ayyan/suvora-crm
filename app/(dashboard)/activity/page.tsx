import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const ACTION_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  LEAD_CREATED:    { color: "#6ee7b7", bg: "rgba(16,185,129,0.15)",  icon: "+" },
  LEAD_UPDATED:    { color: "#67e8f9", bg: "rgba(6,182,212,0.15)",   icon: "✎" },
  LEAD_DELETED:    { color: "#fca5a5", bg: "rgba(239,68,68,0.15)",   icon: "×" },
  LEAD_REASSIGNED: { color: "#c4b5fd", bg: "rgba(167,139,250,0.15)", icon: "→" },
  STATUS_CHANGED:  { color: "#fcd34d", bg: "rgba(245,158,11,0.15)",  icon: "◈" },
  PRIORITY_CHANGED:{ color: "#fdba74", bg: "rgba(251,146,60,0.15)",  icon: "!" },
  FOLLOWUP_UPDATED:{ color: "#93c5fd", bg: "rgba(147,197,253,0.15)", icon: "📅" },
  NOTE_ADDED:      { color: "#a78bfa", bg: "rgba(167,139,250,0.15)", icon: "✍" },
  TASK_CREATED:    { color: "#60a5fa", bg: "rgba(96,165,250,0.15)",  icon: "✓" },
  TASK_COMPLETED:  { color: "#6ee7b7", bg: "rgba(16,185,129,0.15)",  icon: "✔" },
  CLIENT_CREATED:  { color: "#67e8f9", bg: "rgba(6,182,212,0.15)",   icon: "🏢" },
  EMPLOYEE_CREATED:{ color: "#c4b5fd", bg: "rgba(167,139,250,0.15)", icon: "👤" },
  DEFAULT:         { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  icon: "·" },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const params  = await searchParams;
  const page    = Math.max(1, Number(params.page || "1"));
  const action  = params.action || "";
  const perPage = 50;

  const where = action ? { action } : {};

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { name: true, employeeId: true } } },
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.activityLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Get distinct action types for filter
  const actionTypes = await prisma.activityLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {total.toLocaleString()} total events — complete audit trail
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <a href="/activity"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: !action ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
            color: !action ? "#c4b5fd" : "rgba(255,255,255,0.5)",
            border: `1px solid ${!action ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`,
          }}>
          All
        </a>
        {actionTypes.map((a) => {
          const conf = ACTION_COLORS[a.action] || ACTION_COLORS.DEFAULT;
          const isActive = action === a.action;
          return (
            <a key={a.action} href={`/activity?action=${a.action}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background: isActive ? conf.bg : "rgba(255,255,255,0.05)",
                color: isActive ? conf.color : "rgba(255,255,255,0.5)",
                border: `1px solid ${isActive ? conf.color + "40" : "rgba(255,255,255,0.1)"}`,
              }}>
              {a.action.replace(/_/g, " ").toLowerCase()}
            </a>
          );
        })}
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No activity logs found</p>
          </div>
        ) : (
          logs.map((log) => {
            const conf = ACTION_COLORS[log.action] || ACTION_COLORS.DEFAULT;
            return (
              <div key={log.id} className="flex items-start gap-3 p-4 rounded-xl transition-colors hover:bg-white/[0.03]"
                style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: conf.bg, color: conf.color }}>
                  {conf.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-relaxed">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium capitalize"
                      style={{ background: conf.bg, color: conf.color }}>
                      {log.action.replace(/_/g, " ").toLowerCase()}
                    </span>
                    {log.user?.name && (
                      <>
                        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{log.user.name}</span>
                      </>
                    )}
                    <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }} title={new Date(log.createdAt).toLocaleString()}>
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {page > 1 && (
            <a href={`/activity?${action ? `action=${action}&` : ""}page=${page - 1}`}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              ← Prev
            </a>
          )}
          <span className="text-sm px-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Page {page} of {totalPages} · {total} total
          </span>
          {page < totalPages && (
            <a href={`/activity?${action ? `action=${action}&` : ""}page=${page + 1}`}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
