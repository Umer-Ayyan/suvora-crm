import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-zinc-900 border-r border-white/10 p-6">
      <h1 className="text-3xl font-bold text-white mb-10">
        Suvora CRM
      </h1>

      <nav className="flex flex-col gap-4">
        <Link
          href="/"
          className="text-zinc-300 hover:text-white"
        >
          Dashboard
        </Link>

        <Link
          href="/leads"
          className="text-zinc-300 hover:text-white"
        >
          Leads
        </Link>
      </nav>
    </aside>
  );
}