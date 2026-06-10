"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import SuvoraLogo from "@/components/ui/suvora-logo";

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: "Lead Management",
    desc: "Track every lead from first touch to close",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    label: "Analytics",
    desc: "Real-time insights on revenue and pipeline",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Attendance Tracking",
    desc: "Automated time-in/out with shift detection",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    label: "Task Management",
    desc: "Assign and track tasks across your team",
  },
];

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        toast.success("Welcome back!");
        window.location.replace("/");
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex text-white relative overflow-hidden"
      style={{ background: "#080810" }}
    >
      {/* ─── Rich background layer ─── */}
      {/* Top-center purple nebula */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, rgba(79,70,229,0.12) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Bottom-left indigo glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          left: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Bottom-right cyan accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "10%",
          right: "-5%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* ─── Subtle grid overlay ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ─── LEFT PANEL — Branding ─── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative p-14 overflow-hidden">

        {/* Decorative ring */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            border: "1px solid rgba(124,58,237,0.12)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            border: "1px solid rgba(124,58,237,0.06)",
          }}
        />

        {/* Logo top-left */}
        <div className="flex items-center gap-3 relative z-10">
          <SuvoraLogo size={38} />
          <div>
            <p className="text-lg font-bold tracking-tight text-white">Suvora</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>CRM Platform</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#c4b5fd",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }}
            />
            Trusted by your team
          </div>

          <h2
            className="text-4xl font-bold leading-tight mb-4"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, rgba(167,139,250,0.9) 50%, rgba(99,102,241,0.8) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your agency,<br />
            fully in control.
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.45)", maxWidth: "360px" }}>
            One workspace for leads, clients, tasks, attendance, payslips, and everything in between.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="relative z-10 flex items-center gap-8">
          {[
            { value: "100%", label: "Uptime" },
            { value: "PKT", label: "Timezone" },
            { value: "v1.0", label: "Release" },
          ].map((s) => (
            <div key={s.label}>
              <p
                className="text-xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #c4b5fd, #818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div
        className="hidden lg:block w-px flex-shrink-0"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(124,58,237,0.25) 30%, rgba(124,58,237,0.25) 70%, transparent)" }}
      />

      {/* ─── RIGHT PANEL — Login form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <SuvoraLogo size={40} />
          <p className="text-xl font-bold tracking-tight">Suvora CRM</p>
        </div>

        <div className="w-full max-w-[400px] animate-slide-up">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">Welcome back</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Sign in with your employee credentials
            </p>
          </div>

          {/* Card */}
          <div
            className="relative rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Card inner glow */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.08), transparent)",
              }}
            />

            <form onSubmit={handleLogin} className="relative space-y-5">
              {/* Employee ID */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Employee ID
                </label>
                <div className="relative">
                  <div
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c0 1.306.835 2.418 2 2.83" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="EMP001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    autoComplete="username"
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(124,58,237,0.6)";
                      e.currentTarget.style.background = "rgba(124,58,237,0.06)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <div
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(124,58,237,0.6)";
                      e.currentTarget.style.background = "rgba(124,58,237,0.06)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: showPassword ? "rgba(167,139,250,0.9)" : "rgba(255,255,255,0.25)" }}
                    tabIndex={-1}
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 overflow-hidden mt-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.4), 0 0 0 1px rgba(124,58,237,0.3)",
                }}
              >
                {/* Shimmer effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)",
                  }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
            Contact your administrator if you&#39;ve forgotten your credentials
          </p>
        </div>

        {/* Bottom branding */}
        <div
          className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-1.5 text-xs"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          <SuvoraLogo size={14} />
          <span>Suvora CRM &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </main>
  );
}
