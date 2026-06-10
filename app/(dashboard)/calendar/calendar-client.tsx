"use client";

import { useState } from "react";
import Link from "next/link";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const STATUS_COLORS: Record<string, string> = {
  new:"#94a3b8", contacted:"#60a5fa", qualified:"#a78bfa", proposal:"#f59e0b",
  negotiation:"#fb923c", won:"#6ee7b7", lost:"#f87171",
  pending:"#94a3b8", in_progress:"#60a5fa", completed:"#6ee7b7", cancelled:"#f87171",
};

type CalEvent = { id: string; title: string; date: Date; type: "lead" | "task"; status: string; href: string };

export default function CalendarClient({ leads, tasks }: { leads: any[]; tasks: any[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(null);

  // Build event list
  const events: CalEvent[] = [
    ...leads.map((l) => ({
      id: l.id,
      title: l.name + (l.company ? ` (${l.company})` : ""),
      date: new Date(l.followUpDate),
      type: "lead" as const,
      status: l.status,
      href: `/leads/${l.id}`,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: new Date(t.dueDate),
      type: "task" as const,
      status: t.status,
      href: `/tasks`,
    })),
  ];

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prev() { setViewDate(new Date(year, month - 1, 1)); }
  function next() { setViewDate(new Date(year, month + 1, 1)); }

  function eventsOnDay(d: number) {
    return events.filter((e) =>
      e.date.getFullYear() === year &&
      e.date.getMonth() === month &&
      e.date.getDate() === d
    );
  }

  const selectedEvents = selected
    ? events.filter((e) =>
        e.date.getFullYear() === selected.getFullYear() &&
        e.date.getMonth() === selected.getMonth() &&
        e.date.getDate() === selected.getDate()
      )
    : [];

  const totalEvents = events.filter((e) => e.date.getMonth() === month && e.date.getFullYear() === year).length;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {totalEvents} event{totalEvents !== 1 ? "s" : ""} this month
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="md:col-span-2 rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.6)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2 className="text-base font-semibold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.6)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-1"
                style={{ color: "rgba(255,255,255,0.3)" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dayEvents = eventsOnDay(d);
              const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
              const isSelected = selected?.getDate() === d && selected?.getMonth() === month && selected?.getFullYear() === year;

              return (
                <button key={d} onClick={() => setSelected(isSelected ? null : new Date(year, month, d))}
                  className="relative rounded-xl p-1.5 text-center transition-all min-h-[52px] flex flex-col items-center"
                  style={{
                    background: isSelected
                      ? "rgba(124,58,237,0.2)"
                      : isToday
                      ? "rgba(124,58,237,0.08)"
                      : "transparent",
                    border: isSelected
                      ? "1px solid rgba(124,58,237,0.5)"
                      : isToday
                      ? "1px solid rgba(124,58,237,0.25)"
                      : "1px solid transparent",
                  }}>
                  <span className="text-xs font-semibold"
                    style={{ color: isToday ? "#a78bfa" : "rgba(255,255,255,0.7)" }}>
                    {d}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: e.type === "lead" ? "#a78bfa" : "#60a5fa" }} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Follow-up</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "#60a5fa" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Task due</span>
            </div>
          </div>
        </div>

        {/* Sidebar — selected day or upcoming */}
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {selected ? (
            <>
              <h3 className="text-sm font-semibold text-white mb-4">
                {DAYS[selected.getDay()]}, {MONTHS[selected.getMonth()]} {selected.getDate()}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No events</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((e) => (
                    <Link key={e.id} href={e.href}
                      className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-white/5">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: e.type === "lead" ? "#a78bfa" : "#60a5fa" }} />
                      <div>
                        <p className="text-sm font-medium text-white">{e.title}</p>
                        <p className="text-xs mt-0.5 capitalize"
                          style={{ color: STATUS_COLORS[e.status] ?? "rgba(255,255,255,0.4)" }}>
                          {e.type} · {e.status.replace("_"," ")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-white mb-4">Upcoming</h3>
              <div className="space-y-3">
                {events
                  .filter((e) => e.date >= today)
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 8)
                  .map((e) => (
                    <Link key={e.id} href={e.href}
                      className="flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-white/5">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: e.type === "lead" ? "#a78bfa" : "#60a5fa" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{e.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {e.date.toLocaleDateString("en-PK", { month:"short", day:"numeric" })}
                        </p>
                      </div>
                    </Link>
                  ))}
                {events.filter((e) => e.date >= today).length === 0 && (
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No upcoming events</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
