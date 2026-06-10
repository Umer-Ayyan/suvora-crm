"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SuvoraLogo from "@/components/ui/suvora-logo";
import GlobalSearch from "@/components/ui/global-search";
import NotificationBell from "@/components/notifications/notification-bell";
import SendAnnouncement from "@/components/announcements/send-announcement";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: "/leads",
    label: "Leads",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    href: "/documents",
    label: "Documents",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
];

const adminNavItems = [
  {
    href: "/attendance/manage",
    label: "Attendance Mgmt",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    href: "/payslips",
    label: "Payslips",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    href: "/quotations",
    label: "Quotations",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    href: "/activity",
    label: "Activity Logs",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    href: "/employees",
    label: "Employees",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>,
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  },
];

const managerNavItems = [
  {
    href: "/attendance/manage",
    label: "Attendance Mgmt",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    href: "/payslips",
    label: "Payslips",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    href: "/quotations",
    label: "Quotations",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const roleLabel = role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";
  const privilegedItems = role === "admin" ? adminNavItems : role === "manager" ? managerNavItems : [];

  const renderSidebar = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <SuvoraLogo size={34} />
          <div>
            <p className="font-bold text-base text-white tracking-tight">Suvora</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{roleLabel}</p>
          </div>
          {/* Close button — mobile only */}
          <button
            className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
          Main
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(item.href) ? "nav-active" : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {privilegedItems.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-2 pt-2"
              style={{ color: "rgba(255,255,255,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {role === "admin" ? "Admin" : "Manager"}
            </p>
            {privilegedItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(item.href) ? "nav-active" : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 glass">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name || "User"}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
              {(session?.user as any)?.employeeId || ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside
        className="hidden lg:flex w-60 flex-shrink-0 flex-col"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
        }}
      >
        {renderSidebar()}
      </aside>

      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 lg:hidden transition-transform duration-300 ease-in-out"
        style={{
          background: "#0d0d1a",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {renderSidebar()}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-2">
            {session?.user && (session.user as any).role === "admin" && (
              <SendAnnouncement />
            )}
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
