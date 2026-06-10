"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok && mounted) setNotifications(await res.json());
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function deleteOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const TYPE_COLORS: Record<string, string> = {
    info: "#60a5fa", success: "#6ee7b7", warning: "#fcd34d", error: "#f87171",
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
        style={{ background: open ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)" }}>
        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: "#7c3aed", color: "white" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-2xl z-50 animate-slide-up overflow-hidden"
          style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs" style={{ color: "#a78bfa" }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.35)" }}>
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div key={n.id}
                  className="flex items-start gap-3 px-4 py-3 group transition-all"
                  style={{
                    background: n.read ? "transparent" : "rgba(124,58,237,0.06)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: n.read ? "rgba(255,255,255,0.2)" : (TYPE_COLORS[n.type] ?? "#a78bfa") }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: n.read ? "rgba(255,255,255,0.5)" : "white" }}>
                      {n.title}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {n.message}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(n.createdAt).toLocaleString("en-PK", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </div>
                  <button onClick={() => deleteOne(n.id)}
                    className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
