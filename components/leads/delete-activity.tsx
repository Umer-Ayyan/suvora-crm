"use client";

import { toast } from "sonner";

export default function DeleteActivity({
  id,
}: {
  id: string;
}) {
  async function remove() {
    const confirmed =
      confirm(
        "Delete this activity?"
      );

    if (!confirmed) return;

    const res = await fetch(
      `/api/activities/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      toast.success(
        "Activity deleted"
      );

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      toast.error(
        "Failed to delete activity"
      );
    }
  }

  return (
    <button
      onClick={remove}
      className="text-red-400 text-sm hover:text-red-300"
    >
      Delete
    </button>
  );
}