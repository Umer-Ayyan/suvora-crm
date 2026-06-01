"use client";

import { toast } from "sonner";

export default function DeleteEmployee({
  id,
  employeeId,
}: {
  id: string;
  employeeId: string;
}) {
  async function handleDelete() {
    if (
      !confirm(
        `Delete ${employeeId}?`
      )
    ) {
      return;
    }

    const res = await fetch(
      `/api/employees/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      toast.success(
        "Employee deleted"
      );

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } else {
      const data =
        await res.json();

      toast.error(
        data.error ||
          "Failed to delete employee"
      );
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-400 hover:text-red-300"
    >
      Delete
    </button>
  );
}