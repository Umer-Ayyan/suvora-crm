"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [employeeId, setEmployeeId] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!employeeId || !password) {
      toast.error(
        "Please enter Employee ID and Password"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await signIn(
        "credentials",
        {
          employeeId,
          password,
          redirect: false,
        }
      );

      if (res?.ok) {
        toast.success(
          "Login successful"
        );

        window.location.replace("/");
      } else {
        toast.error(
          "Invalid credentials"
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
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-10 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-8 text-center">
          Suvora CRM Login
        </h1>

        <div className="space-y-5">
          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) =>
              setEmployeeId(
                e.target.value
              )
            }
            className="w-full bg-zinc-800 rounded-xl px-4 py-3 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full bg-zinc-800 rounded-xl px-4 py-3 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </div>
      </form>
    </main>
  );
}