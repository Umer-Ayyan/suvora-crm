"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeadManagement({
  leadId,
  currentStatus,
  currentPriority,
  currentFollowUpDate,
}: {
  leadId: string;
  currentStatus: string;
  currentPriority?: string | null;
  currentFollowUpDate?: Date | string | null;
}) {
  const originalStatus =
    currentStatus;

  const originalPriority =
    currentPriority || "medium";

  const originalFollowUpDate =
    currentFollowUpDate
      ? new Date(
          currentFollowUpDate
        )
          .toISOString()
          .split("T")[0]
      : "";

  const [status, setStatus] =
    useState(currentStatus);

  const [priority, setPriority] =
    useState(
      currentPriority || "medium"
    );

  const [followUpDate, setFollowUpDate] =
    useState(
      currentFollowUpDate
        ? new Date(
            currentFollowUpDate
          )
            .toISOString()
            .split("T")[0]
        : ""
    );

  const [loading, setLoading] =
    useState(false);

  async function save() {
    const payload: any = {};

    if (
      status !== originalStatus
    ) {
      payload.status = status;
    }

    if (
      priority !==
      originalPriority
    ) {
      payload.priority =
        priority;
    }

    if (
      followUpDate !==
      originalFollowUpDate
    ) {
      payload.followUpDate =
        followUpDate;
    }

    if (
      Object.keys(payload)
        .length === 0
    ) {
      toast.info(
        "No changes made"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/leads/${leadId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      if (res.ok) {
        toast.success(
          "Lead updated"
        );

        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        toast.error(
          "Failed to update lead"
        );
      }
    } catch {
      toast.error(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-5">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Status
        </label>

       <Select
  value={status}
  onValueChange={(value) => {
    if (value) setStatus(value);
  }}
>
 <SelectTrigger className="w-full bg-zinc-950 border border-white/10 rounded-2xl h-14">
    <SelectValue />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="new">
      New
    </SelectItem>

    <SelectItem value="contacted">
      Contacted
    </SelectItem>

    <SelectItem value="proposal">
      Proposal
    </SelectItem>

    <SelectItem value="won">
      Won
    </SelectItem>

    <SelectItem value="lost">
      Lost
    </SelectItem>
  </SelectContent>
</Select>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Priority
        </label>

       <Select
  value={priority}
  onValueChange={(value) => {
    if (value) setPriority(value);
  }}
>
  <SelectTrigger className="w-full bg-zinc-950 border border-white/10 rounded-2xl h-14">
    <SelectValue />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="low">
      Low
    </SelectItem>

    <SelectItem value="medium">
      Medium
    </SelectItem>

    <SelectItem value="high">
      High
    </SelectItem>
  </SelectContent>
</Select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Next Follow-up
        </label>

        <input
          type="date"
          value={followUpDate}
          onChange={(e) =>
            setFollowUpDate(
              e.target.value
            )
          }
          className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-white/30 transition"
        />
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="w-full rounded-2xl py-3 font-semibold bg-white text-black hover:opacity-90 transition"
      >
        {loading
          ? "Saving..."
          : "Save Changes"}
      </button>
    </div>
  );
}