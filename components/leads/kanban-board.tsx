"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import Link from "next/link";

const columns = [
  { id: "new", label: "New", color: "#818cf8", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
  { id: "contacted", label: "Contacted", color: "#67e8f9", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)" },
  { id: "proposal", label: "Proposal", color: "#fcd34d", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
  { id: "won", label: "Won", color: "#6ee7b7", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
  { id: "lost", label: "Lost", color: "#fca5a5", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
];

const priorityConfig: Record<string, { dot: string; label: string }> = {
  high: { dot: "#f87171", label: "High" },
  medium: { dot: "#fbbf24", label: "Med" },
  low: { dot: "#34d399", label: "Low" },
};

export default function KanbanBoard({ leads }: { leads: any[] }) {
  async function updateLeadStatus(leadId: string, status: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error();
  }

  async function onDragEnd(result: any) {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId;
    try {
      await updateLeadStatus(leadId, newStatus);
      toast.success(`Moved to ${newStatus}`);
      window.location.reload();
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-5 gap-4">
        {columns.map((col) => {
          const colLeads = leads.filter((l: any) => l.status === col.id);

          return (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col rounded-2xl p-3 min-h-[600px] transition-all duration-200"
                  style={{
                    background: snapshot.isDraggingOver ? col.bg : "rgba(255,255,255,0.025)",
                    border: `1px solid ${snapshot.isDraggingOver ? col.border : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-sm font-semibold" style={{ color: col.color }}>
                        {col.label}
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: col.bg, color: col.color }}
                    >
                      {colLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5 flex-1">
                    {colLeads.map((lead: any, index: number) => {
                      const pConf = priorityConfig[lead.priority] || priorityConfig.medium;
                      const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && lead.status !== "won";

                      return (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Link href={`/leads/${lead.id}`}>
                                <div
                                  className="rounded-xl p-3.5 transition-all duration-150"
                                  style={{
                                    background: snapshot.isDragging
                                      ? "rgba(124,58,237,0.2)"
                                      : "rgba(255,255,255,0.05)",
                                    border: snapshot.isDragging
                                      ? "1px solid rgba(124,58,237,0.5)"
                                      : "1px solid rgba(255,255,255,0.08)",
                                    boxShadow: snapshot.isDragging
                                      ? "0 8px 30px rgba(0,0,0,0.4)"
                                      : "none",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!snapshot.isDragging) {
                                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!snapshot.isDragging) {
                                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                                    }
                                  }}
                                >
                                  {/* Priority + name */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="text-sm font-semibold text-white leading-snug">{lead.name}</p>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: pConf.dot }} />
                                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{pConf.label}</span>
                                    </div>
                                  </div>

                                  {/* Company */}
                                  {lead.company && (
                                    <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                                      {lead.company}
                                    </p>
                                  )}

                                  {/* Follow-up */}
                                  {lead.followUpDate && (
                                    <div
                                      className="flex items-center gap-1.5 text-xs mb-2 px-2 py-1 rounded-lg"
                                      style={{ background: isOverdue ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)" }}
                                    >
                                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: isOverdue ? "#f87171" : "rgba(255,255,255,0.4)" }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span style={{ color: isOverdue ? "#f87171" : "rgba(255,255,255,0.5)" }}>
                                        {new Date(lead.followUpDate).toISOString().split("T")[0]}
                                        {isOverdue && " · Overdue"}
                                      </span>
                                    </div>
                                  )}

                                  {/* Owner */}
                                  <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                                    <div
                                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                                      style={{ background: "rgba(124,58,237,0.25)", color: "#c4b5fd" }}
                                    >
                                      {lead.createdBy?.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                                      {lead.createdBy?.name || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}

                    {colLeads.length === 0 && (
                      <div
                        className="flex flex-col items-center justify-center rounded-xl py-8 text-center"
                        style={{ border: "1px dashed rgba(255,255,255,0.1)" }}
                      >
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Drop here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
