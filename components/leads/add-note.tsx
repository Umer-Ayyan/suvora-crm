"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddNote({
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

    const res = await fetch(
      `/api/leads/${leadId}/notes`,
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
        "Note added"
      );

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } else {
      toast.error(
        "Failed"
      );
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <textarea
        value={note}
        onChange={(e) =>
          setNote(
            e.target.value
          )
        }
        placeholder="Add follow-up note..."
        className="w-full bg-zinc-800 border border-white/10 rounded-xl p-4 min-h-[120px]"
      />

      <button
        onClick={save}
        disabled={loading}
        className="bg-white text-black px-5 py-3 rounded-xl font-semibold"
      >
        {loading
          ? "Saving..."
          : "Add Note"}
      </button>
    </div>
  );
}