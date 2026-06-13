"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Phase = "loading" | "idle" | "setup" | "verifying";

export default function SecurityPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [enabled, setEnabled] = useState(false);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [disablePass, setDisablePass] = useState("");

  async function loadStatus() {
    try {
      const r = await fetch("/api/auth/2fa/status");
      const d = await r.json();
      setEnabled(!!d.enabled);
    } catch {}
    setPhase("idle");
  }
  useEffect(() => { loadStatus(); }, []);

  async function startSetup() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        setQr(d.qr);
        setSecret(d.secret);
        setCode("");
        setPhase("setup");
      } else toast.error(d.error || "Failed to start setup");
    } catch { toast.error("Something went wrong"); }
    setBusy(false);
  }

  async function confirmSetup() {
    if (code.trim().length < 6) { toast.error("Enter the 6-digit code"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const d = await r.json();
      if (r.ok) {
        toast.success("Two-factor authentication enabled");
        setEnabled(true);
        setPhase("idle");
        setQr(""); setSecret(""); setCode("");
      } else toast.error(d.error || "Invalid code");
    } catch { toast.error("Something went wrong"); }
    setBusy(false);
  }

  async function disable() {
    if (!disablePass.trim()) { toast.error("Enter your password to disable"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePass.trim() }),
      });
      const d = await r.json();
      if (r.ok) {
        toast.success("Two-factor authentication disabled");
        setEnabled(false);
        setDisablePass("");
      } else toast.error(d.error || "Failed to disable");
    } catch { toast.error("Something went wrong"); }
    setBusy(false);
  }

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
  const input: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-bold text-white mb-1">Security</h1>
      <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Protect your account with an extra layer of security.
      </p>

      <div className="rounded-2xl p-6" style={card}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Two-Factor Authentication</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              Use an authenticator app (Google Authenticator, Authy) to generate a 6-digit code at login.
            </p>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{
              background: enabled ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
              color: enabled ? "#4ade80" : "rgba(255,255,255,0.5)",
            }}
          >
            {phase === "loading" ? "…" : enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {/* Idle, disabled -> enable button */}
        {phase === "idle" && !enabled && (
          <button
            onClick={startSetup}
            disabled={busy}
            className="mt-5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)" }}
          >
            {busy ? "Loading…" : "Enable 2FA"}
          </button>
        )}

        {/* Setup phase -> QR + confirm */}
        {phase === "setup" && (
          <div className="mt-5 space-y-4">
            <ol className="text-sm space-y-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              <li>1. Open your authenticator app.</li>
              <li>2. Scan the QR code below (or enter the key manually).</li>
              <li>3. Enter the 6-digit code it shows to confirm.</li>
            </ol>
            {qr && (
              <div className="flex flex-col items-center gap-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="2FA QR code" width={200} height={200} className="rounded-xl bg-white p-2" />
                <code className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                  {secret}
                </code>
              </div>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none tracking-[0.3em]"
              style={input}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setPhase("idle"); setQr(""); setSecret(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSetup}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)" }}
              >
                {busy ? "Verifying…" : "Confirm & Enable"}
              </button>
            </div>
          </div>
        )}

        {/* Idle, enabled -> disable with password */}
        {phase === "idle" && enabled && (
          <div className="mt-5 space-y-3">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              To turn off 2FA, confirm your password.
            </p>
            <input
              type="password"
              placeholder="Your password"
              value={disablePass}
              onChange={(e) => setDisablePass(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
              style={input}
            />
            <button
              onClick={disable}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
