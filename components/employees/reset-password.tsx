"use client";

import { toast } from "sonner";

export default function ResetPassword({
  id,
}: {
  id: string;
}) {
  async function handleReset() {
    const password = prompt(
      "Enter new password"
    );

    if (!password) return;

    const res = await fetch(
      `/api/employees/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      }
    );

    const data =
      await res.json();

    if (res.ok) {
      toast.success(
        "Password updated"
      );
    } else {
      toast.error(
        data.error ||
          "Failed to update password"
      );
    }
  }

  return (
    <button
      onClick={handleReset}
      className="text-blue-400 hover:text-blue-300 mr-4"
    >
      Reset Password
    </button>
  );
}