"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddEmployeeForm() {
  const [name, setName] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!name || !password) {
      toast.error(
        "Fill all fields"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "/api/employees",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            password,
          }),
        }
      );

      const data =
        await res.json();

      if (res.ok) {
        toast.success(
          `Employee created: ${data.employeeId}`
        );

        setName("");
        setPassword("");

        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast.error(
          data.error ||
            "Failed to create employee"
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
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-white/10 rounded-3xl p-6 mb-10"
    >
      <h2 className="text-2xl font-bold mb-6">
        Create Employee
      </h2>

      <div className="grid gap-4">
        <input
          type="text"
          placeholder="Employee Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Creating..."
            : "Create Employee"}
        </button>
      </div>
    </form>
  );
}