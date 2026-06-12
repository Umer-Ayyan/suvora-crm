"use client";

import { useState, useRef, useEffect } from "react";

const MAX_SIZE = 5 * 1024 * 1024;

function isValidPhone(val: string) {
  const digits = val.replace(/\D/g, "");
  return /^[+\d][\d\s\-().]{5,19}$/.test(val) && digits.length >= 7;
}
function isValidUrl(val: string) {
  try {
    const url = new URL(val.startsWith("http") ? val : `https://${val}`);
    return url.hostname.includes(".");
  } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global styles
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes riseUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn     { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes checkDraw { from{stroke-dashoffset:56} to{stroke-dashoffset:0} }
  @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.15} 50%{transform:scale(1.18);opacity:0} }
  @keyframes planefly  {
    0%   { transform: translate(0,0) rotate(0deg); opacity:1; }
    40%  { transform: translate(80px,-60px) rotate(20deg); opacity:1; }
    70%  { transform: translate(180px,-110px) rotate(15deg); opacity:0.5; }
    100% { transform: translate(260px,-140px) rotate(10deg); opacity:0; }
  }
  @keyframes dotBounce {
    0%,80%,100%{ transform:translateY(0); opacity:0.4; }
    40%        { transform:translateY(-5px); opacity:1; }
  }
  @keyframes softGlow {
    0%,100%{ opacity:0.4; }
    50%    { opacity:0.8; }
  }
  @keyframes trackAppear { from{opacity:0} to{opacity:1} }
  @keyframes cvTravel {
    0%   { left:-60px; opacity:0; }
    8%   { opacity:1; }
    88%  { opacity:1; }
    100% { left:calc(100% + 20px); opacity:0; }
  }
  @keyframes inboxPop {
    0%,100%{ transform:translateY(-50%) scale(1); }
    40%    { transform:translateY(-50%) scale(1.2); }
    70%    { transform:translateY(-50%) scale(0.94); }
  }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      background: "linear-gradient(135deg,#0a0a14 0%,#0f0f1c 100%)",
      animation: "fadeIn 0.5s ease both",
    }}>
      <style>{STYLES}</style>

      {/* Soft radial glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 55% 45% at 50% 45%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        animation: "softGlow 4s ease-in-out infinite",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, textAlign: "center" }}>

        {/* ── Check icon ── */}
        <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 28px" }}>
          {/* Outer pulse ring */}
          <div style={{
            position: "absolute", inset: -12, borderRadius: "50%",
            background: "rgba(124,58,237,0.15)",
            animation: "ringPulse 2s 0.6s ease-out infinite",
          }} />
          {/* Middle ring */}
          <div style={{
            position: "absolute", inset: -4, borderRadius: "50%",
            background: "rgba(124,58,237,0.1)",
            animation: "ringPulse 2s 0.3s ease-out infinite",
          }} />
          {/* Circle */}
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            boxShadow: "0 0 0 0 rgba(124,58,237,0.4), 0 8px 32px rgba(124,58,237,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            {/* Animated checkmark */}
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <polyline
                points="10,22 18,32 34,14"
                stroke="white" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                  strokeDasharray: 56,
                  strokeDashoffset: 56,
                  animation: "checkDraw 0.5s 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
                }}
              />
            </svg>
          </div>
        </div>

        {/* ── Paper plane flying away ── */}
        <div style={{
          position: "absolute", top: 20, left: "55%",
          animation: "planefly 1.2s 0.1s cubic-bezier(0.4,0,0.2,1) forwards",
          pointerEvents: "none",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
              stroke="rgba(167,139,250,0.8)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* ── Title ── */}
        <h2 style={{
          fontSize: 28, fontWeight: 900, color: "white",
          letterSpacing: "-0.02em", marginBottom: 8,
          animation: "riseUp 0.55s 0.5s cubic-bezier(0.22,1,0.36,1) both", opacity: 0,
        }}>
          Application Sent!
        </h2>

        <p style={{
          fontSize: 15, marginBottom: 28, lineHeight: 1.6,
          color: "rgba(255,255,255,0.45)",
          animation: "riseUp 0.55s 0.65s cubic-bezier(0.22,1,0.36,1) both", opacity: 0,
        }}>
          Hey <span style={{ color: "#c4b5fd", fontWeight: 700 }}>{name}</span>,
          your CV is on its way to our team.
        </p>

        {/* ── Timeline card ── */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: "20px 20px",
          animation: "riseUp 0.55s 0.8s cubic-bezier(0.22,1,0.36,1) both", opacity: 0,
        }}>
          {[
            { icon: "✓", label: "Application received",      sub: "Just now",          done: true,  d: "0.95s" },
            { icon: "→", label: "CV under review by team",   sub: "In progress",       done: false, d: "1.1s"  },
            { icon: "✉", label: "We'll reach out via email", sub: "Within a few days", done: false, d: "1.25s" },
          ].map((step, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              paddingBottom: i < 2 ? 16 : 0,
              marginBottom: i < 2 ? 16 : 0,
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
              animation: `riseUp 0.45s ${step.d} ease both`, opacity: 0,
            }}>
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step.done ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${step.done ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}>
                <span style={{ fontSize: 13, color: step.done ? "#34d399" : "rgba(255,255,255,0.25)" }}>
                  {step.icon}
                </span>
              </div>
              {/* Text */}
              <div style={{ flex: 1, textAlign: "left" }}>
                <p style={{
                  fontSize: 13, fontWeight: 600, marginBottom: 2,
                  color: step.done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                }}>{step.label}</p>
                <p style={{ fontSize: 11, color: step.done ? "#34d399" : "rgba(255,255,255,0.2)" }}>
                  {step.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer dots ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginTop: 24,
          animation: "riseUp 0.45s 1.4s ease both", opacity: 0,
        }}>
          <div style={{ display: "flex", gap: 5 }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "rgba(124,58,237,0.6)",
                animation: `dotBounce 1.3s ${i * 0.15}s ease-in-out infinite`,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            Team has been notified
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Submit Button
// ─────────────────────────────────────────────────────────────────────────────
type BtnPhase = "idle" | "loading" | "sending";

function SubmitButton({ phase }: { phase: BtnPhase }) {
  return (
    <div style={{
      position: "relative", width: "100%", height: 52,
      borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
      boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
      transition: "opacity 0.3s ease",
      cursor: phase !== "idle" ? "default" : "pointer",
    }}>
      <style>{STYLES}</style>

      {/* Idle */}
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        transition: "opacity 0.25s ease",
        opacity: phase === "idle" ? 1 : 0,
        pointerEvents: "none",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "white", letterSpacing: "0.01em" }}>
          Submit Application →
        </span>
      </div>

      {/* Loading */}
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", gap: 8,
        transition: "opacity 0.25s ease",
        opacity: phase === "loading" ? 1 : 0,
        pointerEvents: "none",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          border: "2.5px solid rgba(255,255,255,0.3)",
          borderTopColor: "white",
          animation: phase === "loading" ? "spin 0.75s linear infinite" : "none",
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Sending…</span>
      </div>

      {/* Sending — CV travels across */}
      {phase === "sending" && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", animation: "trackAppear 0.3s ease" }}>
          {/* Track line */}
          <div style={{
            position: "absolute", top: "50%", left: 0, right: 0, height: 1.5,
            background: "rgba(255,255,255,0.18)", transform: "translateY(-50%)",
          }} />
          {/* Dashes */}
          {[15,30,45,60,75].map((pct) => (
            <div key={pct} style={{
              position: "absolute", top: "50%", left: `${pct}%`,
              transform: "translateY(-50%)",
              width: 10, height: 1.5, borderRadius: 1,
              background: "rgba(255,255,255,0.12)",
            }} />
          ))}
          {/* CV chip travelling */}
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            animation: "cvTravel 1.0s cubic-bezier(0.4,0,0.2,1) forwards",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px", borderRadius: 10,
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>CV</span>
            </div>
          </div>
          {/* Inbox on right */}
          <div style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            animation: "inboxPop 0.4s 0.85s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(52,211,153,0.2)",
              border: "1.5px solid rgba(52,211,153,0.5)",
              boxShadow: "0 0 16px rgba(52,211,153,0.3)",
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply Form
// ─────────────────────────────────────────────────────────────────────────────
export default function ApplyForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", position: "", linkedin: "", coverLetter: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cv, setCv]           = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [btnPhase, setBtnPhase] = useState<BtnPhase>("idle");
  const [formVisible, setFormVisible] = useState(true);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");
  const fileRef               = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (!value.trim()) return;
    if (name === "phone" && !isValidPhone(value))
      setFieldErrors((prev) => ({ ...prev, phone: "Enter a valid phone number (e.g. +92 300 1234567)" }));
    if (name === "linkedin" && !isValidUrl(value))
      setFieldErrors((prev) => ({ ...prev, linkedin: "Enter a valid URL (e.g. https://linkedin.com/in/yourname)" }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setCvError("");
    if (!file) return;
    if (file.size > MAX_SIZE) { setCvError("File must be under 5 MB"); return; }
    const allowed = ["application/pdf","application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) { setCvError("Only PDF or Word files allowed"); return; }
    setCv(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (form.phone.trim() && !isValidPhone(form.phone))
      errors.phone = "Enter a valid phone number (e.g. +92 300 1234567)";
    if (form.linkedin.trim() && !isValidUrl(form.linkedin))
      errors.linkedin = "Enter a valid URL (e.g. https://linkedin.com/in/yourname)";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    if (!cv) { setCvError("Please upload your CV"); return; }

    setBtnPhase("loading");
    setError("");

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(cv);
    });

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, cvFileName: cv.name, cvFileType: cv.type,
        cvFileData: base64, cvFileSize: cv.size,
      }),
    });

    if (res.ok) {
      setBtnPhase("sending");
      // Form fades out while CV travels
      setTimeout(() => setFormVisible(false), 300);
      // Show success screen after sending animation
      setTimeout(() => setDone(true), 1300);
    } else {
      setBtnPhase("idle");
      const data = await res.json();
      setError(data.error || "Something went wrong. Please try again.");
    }
  }

  if (done) return <SuccessScreen name={form.name} />;

  return (
    <div className="min-h-screen py-10 px-4"
      style={{ background: "linear-gradient(135deg,#0a0a14 0%,#0f0f1c 100%)" }}>
      <style>{STYLES}</style>
      <div className="max-w-xl mx-auto" style={{
        transition: "opacity 0.5s ease, transform 0.5s ease",
        opacity: formVisible ? 1 : 0,
        transform: formVisible ? "translateY(0)" : "translateY(-16px)",
      }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} style={{ width: 26, height: 26 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Apply Now</h1>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            Fill in your details and upload your CV — we&apos;ll be in touch soon.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="rounded-3xl p-6 md:p-8 space-y-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name *" name="name" placeholder="Ali Hassan" value={form.name} onChange={handleChange} required />
            <Field label="Email Address *" name="email" type="email" placeholder="ali@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone Number" name="phone" placeholder="+92 300 1234567" value={form.phone}
              onChange={handleChange} onBlur={handleBlur} error={fieldErrors.phone} />
            <Field label="Position Applying For *" name="position" placeholder="e.g. Graphic Designer"
              value={form.position} onChange={handleChange} required />
          </div>
          <Field label="LinkedIn / Portfolio" name="linkedin" placeholder="https://linkedin.com/in/yourname"
            value={form.linkedin} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.linkedin} />

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              Cover Letter / Message
            </label>
            <textarea name="coverLetter" value={form.coverLetter} onChange={handleChange}
              placeholder="Tell us a bit about yourself and why you'd be a great fit..."
              rows={4}
              className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-transparent outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", lineHeight: 1.6 }} />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              Upload CV / Resume *
            </label>
            <div onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition-all"
              style={{
                background: cv ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)",
                border: cv ? "1.5px dashed rgba(124,58,237,0.5)" : "1.5px dashed rgba(255,255,255,0.15)",
              }}>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
              {cv ? (
                <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.8} style={{ width: 22, height: 22 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#c4b5fd" }}>{cv.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{(cv.size / 1024).toFixed(0)} KB — click to change</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.8} style={{ width: 22, height: 22 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Click to upload CV</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>PDF or Word — max 5 MB</p>
                </>
              )}
            </div>
            {cvError && <p className="text-xs mt-1.5 text-red-400">{cvError}</p>}
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm text-red-300"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={btnPhase !== "idle"} className="w-full">
            <SubmitButton phase={btnPhase} />
          </button>

          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Your information is kept private and used only for recruitment purposes.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, value, onChange, onBlur, required = false, error }: {
  label: string; name: string; type?: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</label>
      <input type={type} name={name} placeholder={placeholder} value={value}
        onChange={onChange} onBlur={onBlur} required={required}
        className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none"
        style={{ background: "rgba(255,255,255,0.05)", border: error ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)" }} />
      {error && <p className="text-xs mt-1.5 text-red-400">{error}</p>}
    </div>
  );
}
