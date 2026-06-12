"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEFAULT_RESPONSIBILITIES = [
  "Identifying and bidding on relevant projects on Upwork and other freelance platforms",
  "Writing customized proposals based on client requirements",
  "Communicating with potential clients and converting leads",
  "Maintaining a pipeline of prospects and follow-ups",
  "Coordinating with internal teams for project understanding",
  "Achieving monthly targets",
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function OfferLetterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as Record<string, unknown>)?.role as string | undefined;

  const [employeeName, setEmployeeName] = useState("");
  const [position, setPosition] = useState("");
  const [date, setDate] = useState(today());
  const [startDate, setStartDate] = useState("");
  const [workType, setWorkType] = useState("Remote");
  const [workingHours, setWorkingHours] = useState("6–8 hours/day or task-based");
  const [baseSalary, setBaseSalary] = useState("");
  const [hasCommission, setHasCommission] = useState(false);
  const [commissionDesc, setCommissionDesc] = useState("10% on each successfully closed project");
  const [responsibilities, setResponsibilities] = useState<string[]>(DEFAULT_RESPONSIBILITIES);
  const [hrManager, setHrManager] = useState("Taheera Shahid");
  const [includeNDA, setIncludeNDA] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (status === "loading") {
    return (
      <div className="p-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
        Loading...
      </div>
    );
  }

  if (!["admin", "manager"].includes(role ?? "")) {
    return (
      <div className="p-8 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
        Access denied. Admin or Manager role required.
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!employeeName.trim()) e.employeeName = "Required";
    if (!position.trim()) e.position = "Required";
    if (!date) e.date = "Required";
    if (!startDate) e.startDate = "Required";
    if (!baseSalary) e.baseSalary = "Required";
    if (!hrManager.trim()) e.hrManager = "Required";
    return e;
  }

  function handleGenerate() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    const data = {
      employeeName,
      position,
      date,
      startDate,
      workType,
      workingHours,
      baseSalary: Number(baseSalary),
      hasCommission,
      commissionDesc,
      responsibilities,
      hrManager,
      includeNDA,
    };
    localStorage.setItem("ol_data", JSON.stringify(data));
    window.open("/print/offer-letter", "_blank");
  }

  function updateResp(idx: number, val: string) {
    setResponsibilities((prev) => prev.map((r, i) => (i === idx ? val : r)));
  }

  function addResp() {
    setResponsibilities((prev) => [...prev, ""]);
  }

  function removeResp(idx: number) {
    setResponsibilities((prev) => prev.filter((_, i) => i !== idx));
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "white",
    width: "100%",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-slide-up">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Offer Letter Generator</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Generate offer letters and NDAs for new employees
        </p>
      </div>

      {/* Employee Info */}
      <div style={cardStyle}>
        <h2 className="text-base font-semibold text-white mb-5">Employee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Employee Name *</label>
            <input
              style={{ ...inputStyle, borderColor: errors.employeeName ? "#ef4444" : "rgba(255,255,255,0.1)" }}
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Full name"
            />
            {errors.employeeName && <p className="text-red-400 text-xs mt-1">{errors.employeeName}</p>}
          </div>
          <div>
            <label style={labelStyle}>Position / Title *</label>
            <input
              style={{ ...inputStyle, borderColor: errors.position ? "#ef4444" : "rgba(255,255,255,0.1)" }}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Business Development Executive"
            />
            {errors.position && <p className="text-red-400 text-xs mt-1">{errors.position}</p>}
          </div>
          <div>
            <label style={labelStyle}>Date *</label>
            <input
              type="date"
              style={{ ...inputStyle, borderColor: errors.date ? "#ef4444" : "rgba(255,255,255,0.1)", colorScheme: "dark" }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
          </div>
          <div>
            <label style={labelStyle}>Start Date *</label>
            <input
              type="date"
              style={{ ...inputStyle, borderColor: errors.startDate ? "#ef4444" : "rgba(255,255,255,0.1)", colorScheme: "dark" }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label style={labelStyle}>Work Type</label>
            <select
              style={inputStyle}
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
            >
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Working Hours</label>
            <input
              style={inputStyle}
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="e.g. 6–8 hours/day or task-based"
            />
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div style={cardStyle}>
        <h2 className="text-base font-semibold text-white mb-5">Compensation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>Base Salary (PKR) *</label>
            <input
              type="number"
              style={{ ...inputStyle, borderColor: errors.baseSalary ? "#ef4444" : "rgba(255,255,255,0.1)" }}
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              placeholder="e.g. 50000"
            />
            {errors.baseSalary && <p className="text-red-400 text-xs mt-1">{errors.baseSalary}</p>}
          </div>
          <div className="flex items-center gap-4 md:pt-6">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Commission</label>
            <button
              type="button"
              onClick={() => setHasCommission((v) => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
              style={{ background: hasCommission ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.1)" }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: hasCommission ? "translateX(24px)" : "translateX(4px)" }}
              />
            </button>
          </div>
          {hasCommission && (
            <div className="md:col-span-2">
              <label style={labelStyle}>Commission Description</label>
              <input
                style={inputStyle}
                value={commissionDesc}
                onChange={(e) => setCommissionDesc(e.target.value)}
                placeholder="e.g. 10% on each successfully closed project"
              />
            </div>
          )}
        </div>
      </div>

      {/* Responsibilities */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Responsibilities</h2>
          <button
            type="button"
            onClick={addResp}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
          >
            + Add Item
          </button>
        </div>
        <div className="space-y-3">
          {responsibilities.map((r, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={r}
                onChange={(e) => updateResp(idx, e.target.value)}
                placeholder={`Responsibility ${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => removeResp(idx)}
                className="px-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex-shrink-0"
                style={{ border: "1px solid rgba(239,68,68,0.2)" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div style={cardStyle}>
        <h2 className="text-base font-semibold text-white mb-5">Document Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label style={labelStyle}>HR Manager Name *</label>
            <input
              style={{ ...inputStyle, borderColor: errors.hrManager ? "#ef4444" : "rgba(255,255,255,0.1)" }}
              value={hrManager}
              onChange={(e) => setHrManager(e.target.value)}
              placeholder="HR Manager full name"
            />
            {errors.hrManager && <p className="text-red-400 text-xs mt-1">{errors.hrManager}</p>}
          </div>
          <div className="flex items-center gap-4 md:pt-6">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Include NDA</label>
            <button
              type="button"
              onClick={() => setIncludeNDA((v) => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
              style={{ background: includeNDA ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,0.1)" }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: includeNDA ? "translateX(24px)" : "translateX(4px)" }}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleGenerate}
          className="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", fontSize: 15 }}
        >
          Generate Document
        </button>
      </div>
    </div>
  );
}
