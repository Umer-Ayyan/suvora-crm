"use client";

import { useState } from "react";
import { toast } from "sonner";

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
          body: JSON.stringify({
            status,
            priority,
            followUpDate,
          }),
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Status
        </label>

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3"
        >
          <option value="new">
            New
          </option>

          <option value="contacted">
            Contacted
          </option>

          <option value="proposal">
            Proposal
          </option>

          <option value="won">
            Won
          </option>

          <option value="lost">
            Lost
          </option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Priority
        </label>

        <select
          value={priority}
          onChange={(e) =>
            setPriority(
              e.target.value
            )
          }
          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3"
        >
          <option value="low">
            Low
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="high">
            High
          </option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">
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
          className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3"
        />
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="w-full bg-white text-black rounded-xl py-3 font-semibold"
      >
        {loading
          ? "Saving..."
          : "Save Changes"}
      </button>
    </div>
  );
}