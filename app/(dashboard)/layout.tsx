"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <aside className="w-64 bg-zinc-900 border-r border-white/10 p-6">
        <h2 className="text-2xl font-bold mb-10">
          Suvora CRM
        </h2>

        <nav className="space-y-4">
          <Link
            href="/"
            className="block hover:text-zinc-300"
          >
            Dashboard
          </Link>

          <Link
  href="/leads"
  className="block hover:text-zinc-300"
>
  Leads
</Link>

{session?.user?.role === "admin" && (
  <Link
    href="/activity"
    className="block hover:text-zinc-300"
  >
    Activity Logs
  </Link>
)}

          {session?.user?.role === "admin" && (
            <Link
              href="/employees"
              className="block hover:text-zinc-300"
            >
              Employees
            </Link>
          )}

          <button
            onClick={() => signOut()}
            className="text-red-400 hover:text-red-300 mt-10"
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}