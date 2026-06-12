"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  linkedin: string | null;
  coverLetter: string | null;
  cvFileName: string;
  cvFileType: string;
  cvFileSize: number;
  status: string;
  notes: string | null;
  createdAt: string;
  reviewedBy: { id: string; name: string } | null;
};

const STATUS_TABS = [
  { key: "all",         label: "All" },
  { key: "new",         label: "New" },
  { key: "reviewing",   label: "Reviewing" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "hired",       label: "Hired" },
  { key: "rejected",    label: "Rejected" },
];

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  new:         { label: "New",          bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
  reviewing:   { label: "Reviewing",    bg: "rgba(250,204,21,0.15)",  color: "#facc15" },
  shortlisted: { label: "Shortlisted",  bg: "rgba(167,139,250,0.15)", color: "#a78bfa" },
  hired:       { label: "Hired",        bg: "rgba(52,211,153,0.15)",  color: "#34d399" },
  rejected:    { label: "Rejected",     bg: "rgba(248,113,113,0.15)", color: "#f87171" },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function fmtSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── CV Preview Modal ──────────────────────────────────────────────────────────
function CvPreviewModal({ appId, fileName, fileType, onClose }: {
  appId: string; fileName: string; fileType: string; onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const isPdf = fileType === "application/pdf";

  useEffect(() => {
    let url = "";
    (async () => {
      try {
        const res = await fetch(`/api/applications/${appId}`);
        if (!res.ok) throw new Error("Failed to load CV");
        const data = await res.json();
        const byteChars = atob(data.cvFileData);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: data.cvFileType });
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch {
        setErr("Could not load CV preview.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [appId]);

  function download() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl; a.download = fileName; a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col rounded-3xl overflow-hidden w-full max-w-4xl"
        style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)", height: "90vh" }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.2)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{fileName}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>CV Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={download}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <span className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : err ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-400">{err}</p>
              <button onClick={download}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
                Download Instead
              </button>
            </div>
          ) : isPdf && blobUrl ? (
            <iframe src={blobUrl} className="w-full h-full" style={{ border: "none" }} title="CV Preview" />
          ) : (
            /* Word doc — can't preview inline, offer download */
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">Word Document</p>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Word files can&apos;t be previewed in browser — download to open.
                </p>
                <button onClick={download}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  Download CV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;

  const [apps, setApps]           = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected]   = useState<Application | null>(null);
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [cvPreview, setCvPreview] = useState<{ id: string; fileName: string; fileType: string } | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if (!["admin", "manager"].includes(role)) router.replace("/");
  }, [role, status, router]);

  const fetchApps = useCallback(async (tab: string) => {
    setLoading(true);
    const q = tab !== "all" ? `?status=${tab}` : "";
    const res = await fetch(`/api/applications${q}`);
    if (res.ok) setApps(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { if (role && ["admin", "manager"].includes(role)) fetchApps(activeTab); }, [activeTab, fetchApps, role]);
  useEffect(() => { setNotes(selected?.notes ?? ""); }, [selected]);

  async function updateStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: newStatus } : s);
    }
  }

  async function saveNotes(id: string) {
    setSaving(true);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, notes } : a));
      if (selected?.id === id) setSelected((s) => s ? { ...s, notes } : s);
    }
    setSaving(false);
  }

  async function deleteApp(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) {
      setApps((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
    }
  }

  const filtered = apps.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.position.toLowerCase().includes(q);
  });

  if (status === "loading") return null;

  return (
    <>
      {/* CV Preview Modal */}
      {cvPreview && (
        <CvPreviewModal
          appId={cvPreview.id}
          fileName={cvPreview.fileName}
          fileType={cvPreview.fileType}
          onClose={() => setCvPreview(null)}
        />
      )}

      <div className="flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>

        {/* ── LEFT PANEL ── */}
        <div className="flex flex-col w-full md:w-96 flex-shrink-0 border-r" style={{ borderColor: "rgba(255,255,255,0.07)" }}>

          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex-shrink-0">
            <h1 className="text-lg font-bold text-white mb-1">Applications</h1>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              {apps.length} total · review and manage candidates
            </p>

            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: "rgba(255,255,255,0.3)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, position…"
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_TABS.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: activeTab === tab.key ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)",
                    color: activeTab === tab.key ? "#c4b5fd" : "rgba(255,255,255,0.45)",
                    border: activeTab === tab.key ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-3.5 rounded w-2/3 mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="h-2.5 rounded w-1/2 mb-3" style={{ background: "rgba(255,255,255,0.05)" }} />
                  <div className="h-2 rounded w-1/3" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.2)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white opacity-40">No applications</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {activeTab !== "all" ? "Try a different filter" : "Share your /apply link to start receiving candidates"}
                </p>
              </div>
            ) : filtered.map((app) => {
              const badge = STATUS_BADGE[app.status] ?? STATUS_BADGE["new"];
              const isActive = selected?.id === app.id;
              return (
                <button key={app.id} onClick={() => setSelected(app)}
                  className="w-full text-left rounded-2xl p-4 transition-all"
                  style={{
                    background: isActive ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{app.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs mb-1 truncate" style={{ color: "#a78bfa" }}>{app.position}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{app.email}</p>
                  <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>{fmtDate(app.createdAt)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT DETAIL PANEL ── */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6 hidden md:block">
            <div className="max-w-2xl mx-auto space-y-5">

              {/* Top bar */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <p className="text-sm mt-0.5" style={{ color: "#a78bfa" }}>{selected.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)}
                    className="text-sm rounded-xl px-3 py-2 outline-none font-medium"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {/* CV Preview button */}
                  <button
                    onClick={() => setCvPreview({ id: selected.id, fileName: selected.cvFileName, fileType: selected.cvFileType })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View CV
                  </button>

                  {/* Delete (admin only) */}
                  {role === "admin" && (
                    <button onClick={() => deleteApp(selected.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Email", value: selected.email, href: `mailto:${selected.email}` },
                  { label: "Phone", value: selected.phone || "—" },
                  { label: "Applied", value: fmtDate(selected.createdAt) },
                  { label: "CV File", value: `${selected.cvFileName} · ${fmtSize(selected.cvFileSize)}` },
                ].map(({ label, value, href }) => (
                  <div key={label} className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                    {href ? (
                      <a href={href} className="text-sm text-violet-400 hover:text-violet-300 truncate block">{value}</a>
                    ) : (
                      <p className="text-sm text-white truncate">{value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* LinkedIn */}
              {selected.linkedin && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>LinkedIn / Portfolio</p>
                  <a href={selected.linkedin} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-violet-400 hover:text-violet-300 break-all">{selected.linkedin}</a>
                </div>
              )}

              {/* Cover Letter */}
              {selected.coverLetter && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Cover Letter</p>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{selected.coverLetter}</p>
                </div>
              )}

              {/* Notes */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Internal Notes</p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this candidate..."
                  rows={4}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white bg-transparent outline-none resize-none mb-3"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", lineHeight: 1.6 }} />
                <button onClick={() => saveNotes(selected.id)} disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}>
                  {saving ? "Saving…" : "Save Notes"}
                </button>
              </div>

              {selected.reviewedBy && (
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Last reviewed by <span style={{ color: "rgba(255,255,255,0.4)" }}>{selected.reviewedBy.name}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 items-center justify-center hidden md:flex">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.2)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Select an application to review</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
