"use client";

import { useState } from "react";

export default function ViewToggle({
  tableView,
  kanbanView,
}: {
  tableView: React.ReactNode;
  kanbanView: React.ReactNode;
}) {
  const [view, setView] =
    useState("table");

  return (
    <>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() =>
            setView("table")
          }
          className={`px-4 py-2 rounded-xl ${
            view === "table"
              ? "bg-white text-black"
              : "bg-zinc-900"
          }`}
        >
          Table View
        </button>

        <button
          onClick={() =>
            setView("kanban")
          }
          className={`px-4 py-2 rounded-xl ${
            view === "kanban"
              ? "bg-white text-black"
              : "bg-zinc-900"
          }`}
        >
          Kanban View
        </button>
      </div>

      {view === "table"
        ? tableView
        : kanbanView}
    </>
  );
}