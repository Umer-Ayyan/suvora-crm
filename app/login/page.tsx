"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import SuvoraLogo from "@/components/ui/suvora-logo";

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !password) {
      toast.error("Please enter Employee ID and Password");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", { employeeId, password, redirect: false });
      if (res?.ok) {
        toast.success("Login successful");
        window.location.replace("/");
      } else {
        toast.error("Invalid credentials");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center text-white relative overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Background glow orbs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.18), transparent)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(79,70,229,0.1), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative w-full max-w-sm px-4 animate-slide-up">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <SuvoraLogo size={52} />
          <p className="text-xl font-bold text-white tracking-tight">Suvora</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(20px)",
          }}
        >
          <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
          <p className="text-center text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            Sign in to Suvora CRM
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Employee ID
              </label>
              <input
                type="text"
                placeholder="e.g. EMP001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="input-modern w-full rounded-xl px-4 py-3 text-sm text-white transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern w-full rounded-xl px-4 py-3 text-sm text-white transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: loading
                  ? "rgba(124,58,237,0.5)"
                  : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                boxShadow: loading ? "none" : "0 4px 24px rgba(124,58,237,0.35)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
