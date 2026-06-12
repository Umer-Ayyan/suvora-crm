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
// Global styles (injected once)
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes pageFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sceneRise {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes cvFloat {
    0%   { transform: translateY(0px)    rotate(-5deg) scale(1);    opacity: 1; }
    50%  { transform: translateY(-130px) rotate(1deg)  scale(0.88); opacity: 1; }
    80%  { transform: translateY(-220px) rotate(-1deg) scale(0.72); opacity: 0.6; }
    100% { transform: translateY(-260px) rotate(0deg)  scale(0.55); opacity: 0; }
  }
  @keyframes trayReceive {
    0%,100% { transform: translateY(0) scale(1); }
    30%     { transform: translateY(3px) scale(1.04); }
    60%     { transform: translateY(-2px) scale(0.98); }
    80%     { transform: translateY(1px) scale(1.01); }
  }
  @keyframes stampIn {
    0%   { opacity: 0; transform: rotate(15deg) scale(0.4) translateY(-20px); }
    55%  { opacity: 1; transform: rotate(10deg) scale(1.08) translateY(2px); }
    75%  { transform: rotate(11deg) scale(0.97) translateY(0); }
    100% { opacity: 1; transform: rotate(11deg) scale(1)    translateY(0); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes softPulse {
    0%,100% { opacity: 0.5; transform: scale(0.8); }
    50%     { opacity: 1;   transform: scale(1);   }
  }
  @keyframes glowBreath {
    0%,100% { opacity: 0.5; }
    50%     { opacity: 1; }
  }

  /* Button animation */
  @keyframes btnShrink {
    from { max-width: 100%; }
    to   { max-width: 100%; }
  }
  @keyframes trackAppear {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes cvTravel {
    0%   { left: -60px; opacity: 0; }
    8%   { opacity: 1; }
    88%  { opacity: 1; }
    100% { left: calc(100% + 20px); opacity: 0; }
  }
  @keyframes inboxPop {
    0%,100% { transform: translateY(-50%) scale(1); }
    40%     { transform: translateY(-50%) scale(1.18); }
    70%     { transform: translateY(-50%) scale(0.95); }
  }
  @keyframes formFadeOut {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-12px); }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, background: "linear-gradient(135deg,#0a0a14 0%,#0f0f1c 100%)",
      animation: "pageFadeIn 0.6s ease both",
    }}>
      <style>{STYLES}</style>

      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.1) 0%, transparent 70%)",
        animation: "glowBreath 3s ease-in-out infinite",
      }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 360, textAlign: "center",
        animation: "sceneRise 0.7s cubic-bezier(0.22,1,0.36,1) both" }}>

        {/* ── Desk scene ── */}
        <div style={{ position: "relative", height: 200, marginBottom: 32 }}>

          {/* Background glow behind inbox */}
          <div style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: 140, height: 80, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)",
            animation: "glowBreath 2s 1.6s ease-in-out infinite",
          }} />

          {/* Inbox tray */}
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            animation: "trayReceive 0.5s 1.55s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Label */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399",
                boxShadow: "0 0 8px #34d399", animation: "softPulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em",
                color: "#34d399", textTransform: "uppercase" }}>Inbox</span>
            </div>
            {/* Tray */}
            <div style={{
              width: 110, height: 64, borderRadius: 14,
              background: "rgba(52,211,153,0.07)",
              border: "1.5px solid rgba(52,211,153,0.3)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Slot */}
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: "55%", height: 3, background: "rgba(52,211,153,0.5)",
                borderRadius: "0 0 3px 3px" }} />
              {/* Stacked papers */}
              {[3, 1, -1].map((rot, i) => (
                <div key={i} style={{
                  position: "absolute",
                  bottom: 6 + i * 2, left: "50%",
                  transform: `translateX(-50%) rotate(${rot}deg)`,
                  width: 64, height: 36, borderRadius: 6,
                  background: `rgba(255,255,255,${0.05 - i * 0.01})`,
                  border: `1px solid rgba(255,255,255,${0.08 - i * 0.02})`,
                }} />
              ))}
            </div>
          </div>

          {/* RECEIVED stamp */}
          <div style={{
            position: "absolute", top: 20, right: 8,
            animation: "stampIn 0.55s 1.85s cubic-bezier(0.34,1.56,0.64,1) both",
            opacity: 0,
          }}>
            <div style={{
              border: "2px solid rgba(52,211,153,0.7)", borderRadius: 8,
              padding: "4px 10px", transform: "rotate(11deg)",
              background: "rgba(52,211,153,0.06)",
              boxShadow: "0 0 16px rgba(52,211,153,0.2)",
            }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
                color: "#34d399", textTransform: "uppercase" }}>Received</span>
            </div>
          </div>

          {/* Floating CV */}
          <div style={{
            position: "absolute", bottom: 44, left: "50%",
            transform: "translateX(-50%)",
            animation: "cvFloat 1.3s 0.2s cubic-bezier(0.4,0,0.2,1) forwards",
          }}>
            <div style={{
              width: 68, height: 88, borderRadius: 10, background: "white",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(124,58,237,0.2)",
              padding: "10px 10px 8px", overflow: "hidden",
            }}>
              <div style={{ height: 5, borderRadius: 3, background: "#7c3aed", marginBottom: 6, width: "65%" }} />
              {[90, 75, 60, 85, 70, 80, 55].map((w, i) => (
                <div key={i} style={{
                  height: 2.5, borderRadius: 2,
                  background: i < 3 ? "#e5e7eb" : "#f3f4f6",
                  marginBottom: 3.5, width: `${w}%`,
                }} />
              ))}
            </div>
          </div>

          {/* Desk */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 44,
            background: "linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))",
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16,
          }}>
            {/* Pen */}
            <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%) rotate(18deg)",
              width: 3, height: 20, borderRadius: 2, background: "rgba(167,139,250,0.45)" }} />
            {/* Mug */}
            <div style={{ position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
              width: 12, height: 14, borderRadius: "0 0 4px 4px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }} />
          </div>
        </div>

        {/* Text */}
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 6, letterSpacing: "-0.02em",
          animation: "rowIn 0.6s 2.1s ease both", opacity: 0 }}>
          Application Received!
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 24, lineHeight: 1.6,
          animation: "rowIn 0.6s 2.3s ease both", opacity: 0 }}>
          Hey <span style={{ color: "#a78bfa", fontWeight: 600 }}>{name}</span>,
          your CV just landed in our inbox.
        </p>

        {/* Timeline */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: "16px 18px",
          animation: "rowIn 0.6s 2.5s ease both", opacity: 0,
        }}>
          {[
            { text: "CV submitted successfully", done: true,  delay: "2.7s" },
            { text: "Team notified, under review",  done: false, delay: "2.9s" },
            { text: "We'll reach out via email",    done: false, delay: "3.1s" },
          ].map((step, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: i < 2 ? 14 : 0,
              animation: `rowIn 0.5s ${step.delay} ease both`, opacity: 0,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step.done ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${step.done ? "#34d399" : "rgba(255,255,255,0.1)"}`,
                transition: "all 0.3s ease",
              }}>
                {step.done
                  ? <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  : <div style={{ width: 6, height: 6, borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)" }} />
                }
              </div>
              <span style={{
                fontSize: 13, lineHeight: 1.4,
                color: step.done ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)",
              }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* Typing indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20,
          animation: "rowIn 0.6s 3.4s ease both", opacity: 0 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: "50%", background: "#7c3aed",
                animation: `softPulse 1.2s ${i * 0.18}s ease-in-out infinite`,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>Our team has been notified</span>
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
