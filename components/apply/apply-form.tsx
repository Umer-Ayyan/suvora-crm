"use client";

import { useState, useRef } from "react";

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

// ── Success Screen — CV Journey ───────────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#0a0a14 0%,#0f0f1c 100%)" }}>

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{transform:translateX(-110%)} to{transform:translateX(0)} }
        @keyframes floatCV  {
          0%   { transform: translateY(0) rotate(-4deg); }
          40%  { transform: translateY(-180px) rotate(2deg) scale(0.85); }
          70%  { transform: translateY(-280px) rotate(0deg) scale(0.7); opacity:1; }
          100% { transform: translateY(-310px) scale(0.5); opacity:0; }
        }
        @keyframes inboxGlow {
          0%,100% { box-shadow: 0 0 0 rgba(52,211,153,0); }
          50%      { box-shadow: 0 0 40px rgba(52,211,153,0.5); }
        }
        @keyframes stampDrop {
          0%   { transform: translateY(-40px) rotate(-8deg); opacity:0; }
          60%  { transform: translateY(4px) rotate(2deg); opacity:1; }
          80%  { transform: translateY(-3px) rotate(-1deg); }
          100% { transform: translateY(0) rotate(0deg); opacity:1; }
        }
        @keyframes stampScale {
          0%   { transform: scale(0); opacity:0; }
          60%  { transform: scale(1.15); opacity:1; }
          100% { transform: scale(1); opacity:1; }
        }
        @keyframes lineGrow {
          from { width:0; opacity:0; }
          to   { width:100%; opacity:1; }
        }
        @keyframes trayShake {
          0%,100% { transform:translateX(0); }
          20%      { transform:translateX(-4px) rotate(-1deg); }
          40%      { transform:translateX(4px) rotate(1deg); }
          60%      { transform:translateX(-2px); }
          80%      { transform:translateX(2px); }
        }
        @keyframes dotPulse {
          0%,80%,100%{ transform:scale(0.6); opacity:0.4; }
          40%         { transform:scale(1);   opacity:1;   }
        }
        .cv-fly    { animation: floatCV 1.4s 0.2s cubic-bezier(0.4,0,0.2,1) forwards; }
        .inbox-hit { animation: trayShake 0.4s 1.5s ease, inboxGlow 1.2s 1.5s ease; }
        .stamp     { animation: stampDrop 0.5s 1.8s cubic-bezier(0.34,1.56,0.64,1) both; }
        .stamp-txt { animation: stampScale 0.4s 2s cubic-bezier(0.34,1.56,0.64,1) both; }
        .line1     { animation: lineGrow 0.6s 2.4s ease both; }
        .line2     { animation: lineGrow 0.6s 2.7s ease both; }
        .title     { animation: fadeUp 0.6s 2.3s ease both; opacity:0; }
        .sub       { animation: fadeUp 0.6s 2.6s ease both; opacity:0; }
        .card-in   { animation: fadeUp 0.7s 0s ease both; }
      `}</style>

      <div className="card-in w-full max-w-sm text-center">

        {/* Scene: desk with inbox tray */}
        <div className="relative mx-auto mb-8" style={{ height: 220, width: 260 }}>

          {/* CV document — floats up into inbox */}
          <div className="cv-fly absolute" style={{ bottom: 50, left: "50%", transform: "translateX(-50%) rotate(-4deg)", zIndex: 10 }}>
            <div className="rounded-xl overflow-hidden"
              style={{ width: 80, height: 100, background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              {/* CV lines */}
              <div style={{ padding: "10px 10px 8px" }}>
                <div style={{ height: 6, borderRadius: 3, background: "#7c3aed", marginBottom: 6, width: "70%" }} />
                <div style={{ height: 3, borderRadius: 2, background: "#e5e7eb", marginBottom: 4, width: "90%" }} />
                <div style={{ height: 3, borderRadius: 2, background: "#e5e7eb", marginBottom: 4, width: "75%" }} />
                <div style={{ height: 3, borderRadius: 2, background: "#e5e7eb", marginBottom: 8, width: "60%" }} />
                <div style={{ height: 2, borderRadius: 2, background: "#f3f4f6", marginBottom: 3, width: "85%" }} />
                <div style={{ height: 2, borderRadius: 2, background: "#f3f4f6", marginBottom: 3, width: "70%" }} />
                <div style={{ height: 2, borderRadius: 2, background: "#f3f4f6", marginBottom: 3, width: "80%" }} />
                <div style={{ height: 2, borderRadius: 2, background: "#f3f4f6", marginBottom: 3, width: "55%" }} />
                <div style={{ height: 2, borderRadius: 2, background: "#f3f4f6", marginBottom: 3, width: "75%" }} />
              </div>
            </div>
          </div>

          {/* Inbox tray (top) */}
          <div className="inbox-hit absolute" style={{ top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 5 }}>
            {/* Tray label */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399" }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#34d399" }}>Inbox</span>
            </div>
            {/* Tray body */}
            <div className="relative rounded-xl overflow-hidden"
              style={{ width: 120, height: 70, background: "rgba(52,211,153,0.08)", border: "2px solid rgba(52,211,153,0.35)" }}>
              {/* Tray slot */}
              <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 4, background: "rgba(52,211,153,0.4)", borderRadius: "0 0 4px 4px" }} />
              {/* Stack of papers inside */}
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 70, height: 38, background: "rgba(255,255,255,0.06)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%) rotate(2deg)", width: 68, height: 38, background: "rgba(255,255,255,0.04)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)" }} />
            </div>
          </div>

          {/* RECEIVED stamp — drops after CV lands */}
          <div className="stamp absolute" style={{ top: 32, right: 10, zIndex: 20 }}>
            <div className="rounded-lg px-3 py-1.5"
              style={{ border: "2px solid #34d399", transform: "rotate(12deg)" }}>
              <div className="stamp-txt text-xs font-black tracking-widest" style={{ color: "#34d399", fontSize: 10 }}>
                RECEIVED
              </div>
            </div>
          </div>

          {/* Desk surface */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 48 }}>
            <div className="w-full h-full rounded-2xl"
              style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Desk items */}
              <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 6, alignItems: "center" }}>
                {/* Pen */}
                <div style={{ width: 3, height: 22, borderRadius: 2, background: "rgba(167,139,250,0.5)", transform: "rotate(20deg)" }} />
                {/* Cup */}
                <div style={{ width: 14, height: 16, borderRadius: "0 0 4px 4px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Text content */}
        <h2 className="title text-2xl font-black text-white mb-2">
          Application Received!
        </h2>
        <div className="sub">
          <p className="text-sm font-semibold mb-4"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            Hey <span style={{ color: "#a78bfa" }}>{name}</span>, your CV just landed in our inbox
          </p>

          {/* Timeline */}
          <div className="rounded-2xl p-4 text-left space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {[
              { label: "Application submitted",  done: true,  delay: "2.9s" },
              { label: "Under review by our team", done: false, delay: "3.1s" },
              { label: "We'll reach out via email", done: false, delay: "3.3s" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3"
                style={{ animation: `fadeUp 0.5s ${step.delay} ease both`, opacity: 0 }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: step.done ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)", border: `1.5px solid ${step.done ? "#34d399" : "rgba(255,255,255,0.1)"}` }}>
                  {step.done
                    ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />}
                </div>
                <span className="text-xs" style={{ color: step.done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Typing dots — "our team is reviewing" */}
          <div className="flex items-center justify-center gap-2 mt-5"
            style={{ animation: "fadeUp 0.5s 3.5s ease both", opacity: 0 }}>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#a78bfa", animation: `dotPulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Team notified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Animated Submit Button ────────────────────────────────────────────────────
type BtnPhase = "idle" | "loading" | "sending";

function SubmitButton({ phase }: { phase: BtnPhase }) {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{
      height: 52,
      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
      boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
      transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <style>{`
        @keyframes docSlide {
          0%   { transform: translateX(-80px) rotate(-8deg); opacity:0; }
          15%  { opacity:1; }
          85%  { opacity:1; }
          100% { transform: translateX(calc(100vw)) rotate(4deg); opacity:0; }
        }
        @keyframes trackReveal { from{width:0} to{width:100%} }
        @keyframes idlePulse { 0%,100%{opacity:1} 50%{opacity:0.85} }
      `}</style>

      {/* Idle label */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{
          transition: "opacity 0.3s",
          opacity: phase === "idle" ? 1 : 0,
          pointerEvents: "none",
        }}>
        <span className="text-sm font-bold text-white">Submit Application →</span>
      </div>

      {/* Loading state */}
      {phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-white opacity-80">Sending...</span>
        </div>
      )}

      {/* Sending state — CV flies across */}
      {phase === "sending" && (
        <div className="absolute inset-0 flex items-center overflow-hidden">
          {/* Track / road line */}
          <div style={{
            position: "absolute", top: "50%", left: 0, height: 2,
            background: "rgba(255,255,255,0.2)", borderRadius: 1,
            animation: "trackReveal 0.3s ease forwards",
            width: "100%",
          }} />
          {/* Dashes on track */}
          {[20, 35, 50, 65, 80].map((pct) => (
            <div key={pct} style={{
              position: "absolute", top: "50%", left: `${pct}%`,
              width: 8, height: 2, background: "rgba(255,255,255,0.15)",
              borderRadius: 1, transform: "translateY(-50%)",
            }} />
          ))}
          {/* Flying CV document */}
          <div style={{ animation: "docSlide 1.1s 0.1s cubic-bezier(0.4,0,0.6,1) forwards", position: "absolute" }}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span className="text-xs font-bold text-white">CV</span>
            </div>
          </div>
          {/* Inbox icon on right */}
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Apply Form ────────────────────────────────────────────────────────────────
export default function ApplyForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", position: "", linkedin: "", coverLetter: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cv, setCv]           = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [btnPhase, setBtnPhase] = useState<BtnPhase>("idle");
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
      body: JSON.stringify({ ...form, cvFileName: cv.name, cvFileType: cv.type, cvFileData: base64, cvFileSize: cv.size }),
    });

    if (res.ok) {
      // Play the sending animation before showing success
      setBtnPhase("sending");
      setTimeout(() => setDone(true), 1400);
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
      <div className="max-w-xl mx-auto">
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

        <form onSubmit={handleSubmit}
          className="rounded-3xl p-6 md:p-8 space-y-5"
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
