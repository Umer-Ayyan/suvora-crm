"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "pending",     label: "Pending",     color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  { value: "in_progress", label: "In Progress", color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  { value: "completed",   label: "Completed",   color: "#6ee7b7", bg: "rgba(16,185,129,0.12)"  },
  { value: "cancelled",   label: "Cancelled",   color: "#f87171", bg: "rgba(239,68,68,0.10)"   },
];

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  low:    { color: "#94a3b8", label: "Low"    },
  medium: { color: "#fcd34d", label: "Medium" },
  high:   { color: "#fb923c", label: "High"   },
  urgent: { color: "#f87171", label: "Urgent" },
};

function TaskCard({ task, isAdmin, onStatusChange, onDelete }: {
  task: any; isAdmin: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const pr = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <div
      className="rounded-xl p-4 group transition-all duration-150 hover:scale-[1.01]"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white leading-snug flex-1">{task.title}</p>
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
          style={{ background: pr.color + "22", color: pr.color }}>
          {pr.label}
        </span>
      </div>

      {task.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.45)" }}>
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs mb-3">
        {task.assignedTo && (
          <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {task.assignedTo.name}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1" style={{ color: isOverdue ? "#f87171" : "rgba(255,255,255,0.5)" }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            {new Date(task.dueDate).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
            {isOverdue && " (overdue)"}
          </span>
        )}
        {task.lead && (
          <span style={{ color: "#c4b5fd" }}>↗ {task.lead.name}</span>
        )}
        {task.client && (
          <span style={{ color: "#67e8f9" }}>🏢 {task.client.name}</span>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 mt-3 pt-3 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="flex-1 text-xs rounded-lg px-2 py-1 text-white"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            onClick={() => onDelete(task.id)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskBoard({ initialTasks, employees, isAdmin, leads, clients }: {
  initialTasks: any[]; employees: any[]; isAdmin: boolean; leads: any[]; clients: any[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", status: "pending",
    dueDate: "", assignedToId: "", leadId: "", clientId: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dueDate: form.dueDate || null, assignedToId: form.assignedToId || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setTasks((prev) => [data, ...prev]);
        setForm({ title: "", description: "", priority: "medium", status: "pending", dueDate: "", assignedToId: "", leadId: "", clientId: "" });
        setShowForm(false);
        toast.success("Task created");
      } else toast.error(data.error || "Failed");
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      toast.success("Status updated");
    } else toast.error("Failed to update");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) { setTasks((prev) => prev.filter((t) => t.id !== id)); toast.success("Deleted"); }
    else toast.error("Failed to delete");
  }

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterEmployee !== "all" && t.assignedTo?.id !== filterEmployee) return false;
    return true;
  });

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s.value] = filtered.filter((t) => t.status === s.value);
    return acc;
  }, {} as Record<string, any[]>);

  const inputCls = "input-modern w-full rounded-xl px-3 py-2 text-sm text-white";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className={inputCls} style={{ ...inputStyle, width: "auto" }}>
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {isAdmin && (
          <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
            className={inputCls} style={{ ...inputStyle, width: "auto" }}>
            <option value="all">All Employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}

        <div className="ml-auto">
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Create form */}
      {showForm && isAdmin && (
        <form onSubmit={handleCreate}
          className="rounded-2xl p-6 space-y-4 animate-slide-up"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.3)" }}>
          <h3 className="text-sm font-semibold text-white">Create New Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input placeholder="Task title *" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls} style={inputStyle} required />
            </div>
            <div className="md:col-span-2">
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputCls} style={inputStyle} rows={2} />
            </div>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className={inputCls} style={inputStyle}>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={inputCls} style={inputStyle} />
            <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              className={inputCls} style={inputStyle}>
              <option value="">Assign to employee...</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              className={inputCls} style={inputStyle}>
              <option value="">Link to lead (optional)</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name}{l.company ? ` — ${l.company}` : ""}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              {saving ? "Creating..." : "Create Task"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATUSES.map((s) => (
          <div key={s.value} className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: s.color }}>
                {s.label}
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: s.bg, color: s.color }}>
                {grouped[s.value].length}
              </span>
            </div>
            <div className="space-y-3">
              {grouped[s.value].length === 0 ? (
                <p className="text-center py-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>No tasks</p>
              ) : (
                grouped[s.value].map((task) => (
                  <TaskCard key={task.id} task={task} isAdmin={isAdmin}
                    onStatusChange={handleStatusChange} onDelete={handleDelete} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
