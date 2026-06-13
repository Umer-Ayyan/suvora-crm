"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import SuvoraLogo from "@/components/ui/suvora-logo";

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !password) {
      toast.error("Please enter Employee ID and Password");
      return;
    }
    if (twoFactorStep && otp.trim().length < 6) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        employeeId,
        password,
        otp: twoFactorStep ? otp.trim() : "",
        redirect: false,
      });
      if (res?.ok) {
        window.location.replace("/");
      } else if (res?.error === "2FA_REQUIRED") {
        setTwoFactorStep(true);
        toast.message("Enter the 6-digit code from your authenticator app");
      } else if (res?.error === "2FA_INVALID") {
        toast.error("Invalid authentication code");
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
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#0a0a12" }}
    >
      {/* subtle background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(109,40,217,0.15), transparent)",
        }}
      />

      <div className="relative w-full max-w-[380px]">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #4f46e5 100%)",
              boxShadow: "0 8px 32px rgba(79,70,229,0.35)",
            }}
          >
            <SuvoraLogo size={32} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Suvora CRM</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Employee ID */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Employee ID
              </label>
              <input
                type="text"
                placeholder="e.g. SV001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                autoComplete="username"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="block text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition-all placeholder:text-white/20"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 2FA code */}
            {twoFactorStep && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Authentication Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  autoFocus
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20 tracking-[0.3em]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Open your authenticator app and enter the current code.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 mt-1"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6d28d9)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                twoFactorStep ? "Verify & Sign in" : "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-5"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          © {new Date().getFullYear()} Suvora · Contact your admin for access
        </p>
      </div>
    </main>
  );
}
