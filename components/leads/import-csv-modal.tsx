"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Our Lead fields that can be mapped
const LEAD_FIELDS = [
  { key: "name",      label: "Full Name",    required: true  },
  { key: "company",   label: "Company",      required: false },
  { key: "email",     label: "Email",        required: false },
  { key: "phone",     label: "Phone",        required: false },
  { key: "country",   label: "Country",      required: false },
  { key: "industry",  label: "Industry",     required: false },
  { key: "budget",    label: "Budget",       required: false },
  { key: "dealValue", label: "Deal Value",   required: false },
  { key: "priority",  label: "Priority",     required: false },
  { key: "notes",     label: "Notes",        required: false },
  { key: "source",    label: "Source",       required: false },
];

// Apollo.io common column names → auto-map to our fields
const AUTO_MAP: Record<string, string> = {
  // Name variations
  "first name":        "name",
  "firstname":         "name",
  "full name":         "name",
  "name":              "name",
  "contact name":      "name",
  "person name":       "name",
  // Company
  "company":           "company",
  "company name":      "company",
  "organization":      "company",
  "account name":      "company",
  // Email
  "email":             "email",
  "email address":     "email",
  "work email":        "email",
  // Phone
  "phone":             "phone",
  "phone number":      "phone",
  "mobile":            "phone",
  "mobile phone":      "phone",
  "direct phone":      "phone",
  "work phone":        "phone",
  // Country
  "country":           "country",
  "location country":  "country",
  // Industry
  "industry":          "industry",
  "company industry":  "industry",
  // Budget/Deal (only explicit deal columns — NOT revenue/annual revenue as those are company financials)
  "budget":            "budget",
  "deal value":        "dealValue",
  "deal size":         "dealValue",
  // Priority
  "priority":          "priority",
  // Notes
  "notes":             "notes",
  "note":              "notes",
  "description":       "notes",
  "title":             "notes",
  "job title":         "notes",
  "person title":      "notes",
  // Source
  "source":            "source",
  "lead source":       "source",
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

export default function ImportCSVModal() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});  // csvCol → leadField
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [fileName, setFileName] = useState("");

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return; }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { toast.error("CSV is empty or invalid"); return; }

      setHeaders(h);
      setRows(r);

      // Auto-map columns
      const autoMap: Record<string, string> = {};
      h.forEach((col) => {
        const key = col.toLowerCase().trim();
        if (AUTO_MAP[key]) autoMap[col] = AUTO_MAP[key];
      });

      // Special case: if "First Name" + "Last Name" both exist, combine into name
      const hasFirst = h.find((c) => c.toLowerCase().includes("first name") || c.toLowerCase() === "firstname");
      const hasLast  = h.find((c) => c.toLowerCase().includes("last name")  || c.toLowerCase() === "lastname");
      if (hasFirst && hasLast) {
        // Mark both as "name" (we'll combine during import)
        autoMap["__combine_name__"] = `${hasFirst}|${hasLast}`;
      }

      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  }

  // Build lead objects from mapping
  function buildLeads() {
    // Check if we have a combined name mapping
    const combinedName = mapping["__combine_name__"];
    const [firstCol, lastCol] = combinedName ? combinedName.split("|") : [];

    return rows
      .filter((row) => row.some((cell) => cell.trim()))
      .map((row) => {
        const lead: Record<string, string> = {};

        if (combinedName && firstCol && lastCol) {
          const fi = headers.indexOf(firstCol);
          const li = headers.indexOf(lastCol);
          const first = fi >= 0 ? (row[fi] || "").trim() : "";
          const last  = li >= 0 ? (row[li] || "").trim() : "";
          lead.name = `${first} ${last}`.trim();
        }

        headers.forEach((col, i) => {
          const field = mapping[col];
          if (field && field !== "__skip__") {
            const val = (row[i] || "").trim();
            if (val) {
              if (field === "name" && combinedName) return; // already set
              lead[field] = val;
            }
          }
        });

        return lead;
      })
      .filter((l) => l.name);
  }

  const previewLeads = buildLeads().slice(0, 5);
  const totalLeads   = buildLeads().length;

  async function importLeads() {
    const leads = buildLeads();
    if (leads.length === 0) { toast.error("No valid leads to import"); return; }

    setImporting(true);
    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setStep("done");
        router.refresh();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch { toast.error("Import failed"); }
    finally { setImporting(false); }
  }

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <>
      <button onClick={() => { setOpen(true); reset(); }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <h2 className="text-base font-bold text-white">Import Leads from CSV</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Apollo.io, LinkedIn Sales Nav, or any CSV
                </p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 px-6 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { key: "upload",  label: "1. Upload" },
                { key: "map",     label: "2. Map Columns" },
                { key: "preview", label: "3. Preview" },
                { key: "done",    label: "4. Done" },
              ].map((s, i, arr) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="text-xs font-semibold"
                    style={{ color: step === s.key ? "#a78bfa" : ["map","preview","done"].indexOf(step) >= i ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>
                    {s.label}
                  </span>
                  {i < arr.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>}
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {/* ── STEP 1: UPLOAD ── */}
              {step === "upload" && (
                <div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="rounded-2xl p-10 text-center cursor-pointer transition-all"
                    style={{ border: "2px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const input = fileRef.current;
                        if (input) {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          input.files = dt.files;
                          handleFile({ target: input } as any);
                        }
                      }
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: "rgba(124,58,237,0.15)" }}>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <p className="text-white font-semibold mb-1">Drop your CSV file here</p>
                    <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>or click to browse</p>
                    <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>
                      Choose CSV File
                    </span>
                  </div>
                  <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />

                  {/* Tips */}
                  <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-xs font-semibold text-white mb-2">💡 Tips</p>
                    <ul className="space-y-1">
                      {[
                        "Apollo.io → Export → CSV — auto column mapping hoga",
                        "LinkedIn Sales Navigator exports bhi work karte hain",
                        "Max 500 leads per import",
                        "Duplicate emails allowed — manually review karo",
                      ].map((t) => (
                        <li key={t} className="text-xs flex gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <span>•</span><span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── STEP 2: MAP COLUMNS ── */}
              {step === "map" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-white font-semibold">
                      {fileName} — <span style={{ color: "#a78bfa" }}>{rows.length} rows</span>
                    </p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Auto-mapped: {Object.keys(mapping).filter(k => k !== "__combine_name__").length}/{headers.length} columns
                    </p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {headers.map((col) => (
                      <div key={col} className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{col}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                            e.g. &quot;{rows[0]?.[headers.indexOf(col)] || "—"}&quot;
                          </p>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "rgba(255,255,255,0.2)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <select
                          value={mapping[col] || ""}
                          onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                          className="rounded-lg px-2.5 py-1.5 text-xs text-white outline-none flex-shrink-0"
                          style={{ ...inputStyle, minWidth: "130px" }}
                        >
                          <option value="">— Skip —</option>
                          {LEAD_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}{f.required ? " *" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Name combine notice */}
                  {mapping["__combine_name__"] && (
                    <div className="mb-4 rounded-xl px-4 py-3 text-xs"
                      style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#c4b5fd" }}>
                      ✨ &quot;First Name&quot; + &quot;Last Name&quot; columns detected — automatically combined into Full Name
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep("upload")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      ← Back
                    </button>
                    <button
                      onClick={() => setStep("preview")}
                      disabled={!Object.values(mapping).includes("name") && !mapping["__combine_name__"]}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                      Preview → ({totalLeads} leads)
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: PREVIEW ── */}
              {step === "preview" && (
                <div>
                  <p className="text-sm text-white font-semibold mb-1">Ready to import <span style={{ color: "#a78bfa" }}>{totalLeads} leads</span></p>
                  <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Preview of first 5 leads:</p>

                  <div className="space-y-2 mb-5">
                    {previewLeads.map((lead, i) => (
                      <div key={i} className="rounded-xl px-4 py-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))", color: "#c4b5fd" }}>
                            {(lead.name || "?")[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{lead.name || "—"}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                              {lead.company && <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{lead.company}</span>}
                              {lead.email   && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lead.email}</span>}
                              {lead.phone   && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{lead.phone}</span>}
                              {lead.country && <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{lead.country}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {totalLeads > 5 && (
                      <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                        + {totalLeads - 5} more leads
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep("map")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      ← Back
                    </button>
                    <button onClick={importLeads} disabled={importing}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                      style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                      {importing ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Importing…
                        </span>
                      ) : `Import ${totalLeads} Leads`}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: DONE ── */}
              {step === "done" && result && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(16,185,129,0.15)" }}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#6ee7b7" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-white mb-1">Import Complete!</p>

                  <div className="flex justify-center gap-6 my-5">
                    <div className="text-center">
                      <p className="text-3xl font-bold" style={{ color: "#6ee7b7" }}>{result.imported}</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Imported</p>
                    </div>
                    {result.skipped > 0 && (
                      <div className="text-center">
                        <p className="text-3xl font-bold" style={{ color: "#fcd34d" }}>{result.skipped}</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Skipped</p>
                      </div>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="rounded-xl p-3 mb-4 text-left"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#fca5a5" }}>Some rows had errors:</p>
                      {result.errors.map((e, i) => (
                        <p key={i} className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{e}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => { reset(); setOpen(false); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                      View Leads
                    </button>
                    <button onClick={reset}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Import Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
