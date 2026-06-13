"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SuvoraLogo from "@/components/ui/suvora-logo";
import GlobalSearch from "@/components/ui/global-search";
import NotificationBell from "@/components/notifications/notification-bell";
import SendAnnouncement from "@/components/announcements/send-announcement";

// permKey: which permission key controls this item (undefined = always show)
const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",   permKey: undefined,     icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/leads",      label: "Leads",       permKey: "leads",       icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { href: "/clients",    label: "Clients",     permKey: "clients",     icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/tasks",      label: "Tasks",       permKey: "tasks",       icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { href: "/calendar",   label: "Calendar",    permKey: undefined,     icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/documents",  label: "Documents",   permKey: undefined,     icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/attendance", label: "Attendance",  permKey: "attendance",  icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { href: "/goals",      label: "Goals",       permKey: "goals",       icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/chat",       label: "Team Chat",   permKey: undefined,     icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { href: "/leaves",     label: "Leaves",      permKey: undefined,     icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/security",   label: "Security",    permKey: undefined,     icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

const ADMIN_ITEMS = [
  { href: "/attendance/manage", label: "Attendance Mgmt", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/payslips",          label: "Payslips",        icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/analytics",         label: "Analytics",       icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/quotations",        label: "Quotations",      icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { href: "/invoices",          label: "Invoices",        icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/employees",         label: "Employees",       icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
  { href: "/roles",             label: "Roles",           icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { href: "/activity",          label: "Activity Logs",   icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { href: "/integrations",      label: "Integrations",    icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  { href: "/applications",      label: "Applications",    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { href: "/offer-letter",      label: "Offer Letter",    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

const MANAGER_ITEMS = [
  { href: "/attendance/manage", label: "Attendance Mgmt", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/payslips",          label: "Payslips",        icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/employees",         label: "Employees",       icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
  { href: "/quotations",        label: "Quotations",      icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { href: "/invoices",          label: "Invoices",        icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/applications",      label: "Applications",    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { href: "/offer-letter",      label: "Offer Letter",    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  const department = ((session?.user as any)?.department as string | null) ?? "";
  const permissions = (session?.user as any)?.permissions as Record<string, boolean> | undefined;
  const customRoleName = (session?.user as any)?.customRoleName as string | undefined;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newAppCount, setNewAppCount] = useState(0);

  useEffect(() => {
    setSidebarOpen(false);
    if (pathname.startsWith("/applications")) setNewAppCount(0);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // Fetch new applications count for admin/manager
  useEffect(() => {
    if (!["admin", "manager"].includes(role)) return;
    async function fetchCount() {
      try {
        const res = await fetch("/api/applications?status=new");
        if (res.ok) {
          const data = await res.json();
          setNewAppCount(data.length);
        }
      } catch {}
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, [role]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  // Role label — show custom role name if assigned
  const roleLabel = customRoleName
    ? customRoleName
    : role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Employee";

  // Filter main nav items by permissions
  const isSalesDept = department.toLowerCase().includes("sales");
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (role === "admin" || role === "manager") return true; // admin/manager see everything
    // Leads: only sales department employees
    if (item.href === "/leads" && role === "employee" && !isSalesDept) return false;
    if (!item.permKey) return true;          // no permission gate = always visible
    if (!permissions) return false;          // no permissions loaded yet
    return permissions[item.permKey] === true;
  });

  // Privileged section items (admin / manager get fixed sections; custom roles don't get these)
  const privilegedItems = role === "admin" ? ADMIN_ITEMS : role === "manager" ? MANAGER_ITEMS : [];

  const renderSidebar = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <SuvoraLogo size={34} />
          <div>
            <p className="font-bold text-base text-white tracking-tight">Suvora</p>
            <p className="text-xs truncate max-w-[100px]" style={{ color: "rgba(255,255,255,0.4)" }}>{roleLabel}</p>
          </div>
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
        {visibleNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(item.href) ? "nav-active" : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <NavIcon d={item.icon} />
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
                <NavIcon d={item.icon} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/applications" && newAppCount > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", minWidth: 20, textAlign: "center" }}>
                    {newAppCount > 99 ? "99+" : newAppCount}
                  </span>
                )}
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col"
        style={{ background: "rgba(255,255,255,0.025)", borderRight: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
        {renderSidebar()}
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 lg:hidden transition-transform duration-300 ease-in-out"
        style={{ background: "#0d0d1a", borderRight: "1px solid rgba(255,255,255,0.07)", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}>
        {renderSidebar()}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
          <button className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}
            onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            {role === "admin" && <SendAnnouncement />}
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
