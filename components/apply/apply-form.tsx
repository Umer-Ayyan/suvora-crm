"use client";

import { useState, useRef } from "react";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Validation helpers
function isValidPhone(val: string) {
  // Allow digits, spaces, +, -, (, ) — at least 7 digits total
  const digits = val.replace(/\D/g, "");
  return /^[+\d][\d\s\-().]{5,19}$/.test(val) && digits.length >= 7;
}

function isValidUrl(val: string) {
  try {
    const url = new URL(val.startsWith("http") ? val : `https://${val}`);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

export default function ApplyForm() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", position: "", linkedin: "", coverLetter: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cv, setCv]           = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");
  const fileRef               = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (!value.trim()) return;
    if (name === "phone" && !isValidPhone(value)) {
      setFieldErrors((prev) => ({ ...prev, phone: "Enter a valid phone number (e.g. +92 300 1234567)" }));
    }
    if (name === "linkedin" && !isValidUrl(value)) {
      setFieldErrors((prev) => ({ ...prev, linkedin: "Enter a valid URL (e.g. https://linkedin.com/in/yourname)" }));
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setCvError("");
    if (!file) return;
    if (file.size > MAX_SIZE) { setCvError("File must be under 5 MB"); return; }
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) { setCvError("Only PDF or Word files allowed"); return; }
    setCv(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate before submit
    const errors: Record<string, string> = {};
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      errors.phone = "Enter a valid phone number (e.g. +92 300 1234567)";
    }
    if (form.linkedin.trim() && !isValidUrl(form.linkedin)) {
      errors.linkedin = "Enter a valid URL (e.g. https://linkedin.com/in/yourname)";
    }
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    if (!cv) { setCvError("Please upload your CV"); return; }

    setSubmitting(true);
    setError("");

    // Read CV as base64
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
        ...form,
        cvFileName: cv.name,
        cvFileType: cv.type,
        cvFileData: base64,
        cvFileSize: cv.size,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong. Please try again.");
    }
  }

  // ── Success screen ──
  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#0a0a14 0%,#0f0f1c 100%)" }}>
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 60px rgba(124,58,237,0.4)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 36, height: 36 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Application Submitted!</h2>
        <p className="text-base mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
          Thank you <span className="text-violet-400 font-semibold">{form.name}</span>, we&apos;ve received your application.
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Our team will review your profile and get back to you via email.
        </p>
      </div>
    </div>
  );

  // ── Form ──
  return (
    <div className="min-h-screen py-10 px-4"
      style={{ background: "linear-gradient(135deg,#0a0a14 0%,#0f0f1c 100%)" }}>
      <div className="max-w-xl mx-auto">

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

        {/* Card */}
        <form onSubmit={handleSubmit}
          className="rounded-3xl p-6 md:p-8 space-y-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name *" name="name" placeholder="Ali Hassan" value={form.name} onChange={handleChange} required />
            <Field label="Email Address *" name="email" type="email" placeholder="ali@example.com" value={form.email} onChange={handleChange} required />
          </div>

          {/* Phone + Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone Number" name="phone" placeholder="+92 300 1234567" value={form.phone}
              onChange={handleChange} onBlur={handleBlur} error={fieldErrors.phone} />
            <Field label="Position Applying For *" name="position" placeholder="e.g. Graphic Designer" value={form.position} onChange={handleChange} required />
          </div>

          {/* LinkedIn */}
          <Field label="LinkedIn / Portfolio" name="linkedin" placeholder="https://linkedin.com/in/yourname"
            value={form.linkedin} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.linkedin} />

          {/* Cover Letter */}
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

          {/* CV Upload */}
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

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Submitting...
              </span>
            ) : "Submit Application →"}
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
  label: string; name: string; type?: string; placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</label>
      <input type={type} name={name} placeholder={placeholder} value={value}
        onChange={onChange} onBlur={onBlur} required={required}
        className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: error ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)",
        }} />
      {error && <p className="text-xs mt-1.5 text-red-400">{error}</p>}
    </div>
  );
}
