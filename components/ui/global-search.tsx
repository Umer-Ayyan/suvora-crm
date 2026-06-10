"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  new:"#94a3b8", contacted:"#60a5fa", qualified:"#a78bfa", proposal:"#f59e0b",
  negotiation:"#fb923c", won:"#6ee7b7", lost:"#f87171",
  pending:"#94a3b8", in_progress:"#60a5fa", completed:"#6ee7b7", cancelled:"#f87171",
  active:"#6ee7b7", inactive:"#f87171",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const hasResults = results && (
    results.leads?.length || results.clients?.length ||
    results.employees?.length || results.tasks?.length
  );

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none"
          viewBox="0 0 24 24" stroke="rgba(255,255,255,0.35)" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (⌘K)"
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-zinc-500 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: open ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.08)",
          }}
        />
        {loading && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin"
            fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#a78bfa" strokeWidth="4"/>
            <path className="opacity-75" fill="#a78bfa" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-11 left-0 right-0 rounded-2xl z-50 overflow-hidden animate-slide-up"
          style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
          {!hasResults && !loading && (
            <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.35)" }}>
              No results for &quot;{query}&quot;
            </p>
          )}

          {results?.leads?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1"
                style={{ color: "rgba(255,255,255,0.3)" }}>Leads</p>
              {results.leads.map((l: any) => (
                <button key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
                    {l.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{l.name}</p>
                    {l.company && <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{l.company}</p>}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ color: STATUS_COLORS[l.status] ?? "#94a3b8", background: (STATUS_COLORS[l.status] ?? "#94a3b8") + "22" }}>
                    {l.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results?.clients?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1"
                style={{ color: "rgba(255,255,255,0.3)" }}>Clients</p>
              {results.clients.map((c: any) => (
                <button key={c.id} onClick={() => navigate(`/clients/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(6,182,212,0.2)", color: "#67e8f9" }}>
                    {c.company[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-white flex-1 truncate">{c.company}</p>
                  <span className="text-xs" style={{ color: STATUS_COLORS[c.status] ?? "#6ee7b7" }}>{c.status}</span>
                </button>
              ))}
            </div>
          )}

          {results?.employees?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1"
                style={{ color: "rgba(255,255,255,0.3)" }}>Employees</p>
              {results.employees.map((e: any) => (
                <button key={e.id} onClick={() => navigate(`/employees/${e.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                    {e.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{e.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{e.employeeId}</p>
                  </div>
                  <span className="text-xs capitalize" style={{ color: "#a78bfa" }}>{e.role}</span>
                </button>
              ))}
            </div>
          )}

          {results?.tasks?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1"
                style={{ color: "rgba(255,255,255,0.3)" }}>Tasks</p>
              {results.tasks.map((t: any) => (
                <button key={t.id} onClick={() => navigate(`/tasks`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(96,165,250,0.2)" }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#60a5fa" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white flex-1 truncate">{t.title}</p>
                  <span className="text-xs capitalize" style={{ color: STATUS_COLORS[t.status] ?? "#94a3b8" }}>
                    {t.status?.replace("_"," ")}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              Press ESC to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
