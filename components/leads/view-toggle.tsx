"use client";

import { useState } from "react";

export default function ViewToggle({ tableView, kanbanView }: { tableView: React.ReactNode; kanbanView: React.ReactNode }) {
  const [view, setView] = useState("table");

  return (
    <>
      <div className="flex items-center gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { id: "table", label: "Table", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 4v16M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg> },
          { id: "kanban", label: "Kanban", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={
              view === v.id
                ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }
                : { color: "rgba(255,255,255,0.5)" }
            }
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      <div key={view} className="animate-fade-in">
        {view === "table" ? tableView : kanbanView}
      </div>
    </>
  );
}
