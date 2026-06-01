"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function StatusSelect({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const [status, setStatus] =
    useState(currentStatus);

  const [loading, setLoading] =
    useState(false);

  async function updateStatus() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/leads/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      if (res.ok) {
        toast.success(
          "Lead status updated"
        );

        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        toast.error(
          "Failed to update status"
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
    <div className="mt-4 space-y-3">
      <select
        value={status}
        disabled={loading}
        onChange={(e) =>
          setStatus(e.target.value)
        }
        className="w-full bg-zinc-800 border border-white/10 text-white rounded-xl px-4 py-3 outline-none appearance-none disabled:opacity-50"
      >
        <option value="new">New</option>
        <option value="contacted">
          Contacted
        </option>
        <option value="proposal">
          Proposal
        </option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>

      <button
        onClick={updateStatus}
        disabled={loading}
        className="w-full bg-white text-black px-4 py-3 rounded-xl font-semibold hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "Updating..."
          : "Save Status"}
      </button>
    </div>
  );
}