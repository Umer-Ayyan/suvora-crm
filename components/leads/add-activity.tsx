"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddActivity({
  leadId,
}: {
  leadId: string;
}) {
  const [note, setNote] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function save() {
    if (!note.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/leads/${leadId}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            note,
          }),
        }
      );

      if (res.ok) {
        toast.success(
          "Activity added"
        );

        setNote("");

        setTimeout(() => {
          window.location.reload();
        }, 700);
      } else {
        toast.error(
          "Failed"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) =>
          setNote(e.target.value)
        }
        placeholder="Follow-up notes..."
        className="w-full bg-zinc-800 border border-white/10 rounded-xl p-4"
      />

      <button
        onClick={save}
        disabled={loading}
        className="bg-white text-black px-5 py-2 rounded-xl font-semibold"
      >
        {loading
          ? "Saving..."
          : "Add Activity"}
      </button>
    </div>
  );
}