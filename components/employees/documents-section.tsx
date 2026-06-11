"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Doc {
  id: string;
  name: string;
  category: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  notes: string | null;
  uploadedAt: Date;
}

interface Props {
  employeeId: string;
  employeeName: string;
  documents: Doc[];
  docCategories: Record<string, { label: string; color: string; icon: string }>;
  canUpload: boolean;
  canDelete: boolean;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORIES = [
  { value: "offer_letter", label: "Offer Letter", icon: "📄" },
  { value: "nda",          label: "NDA",           icon: "🔒" },
  { value: "contract",     label: "Contract",      icon: "📋" },
  { value: "id_copy",      label: "ID Copy",       icon: "🪪" },
  { value: "other",        label: "Other",          icon: "📁" },
];

export default function DocumentsSection({
  employeeId, employeeName, documents, docCategories, canUpload, canDelete,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "other",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    setSelectedFile(file);
    if (!form.name) setForm((f) => ({ ...f, name: file.name.replace(/\.[^.]+$/, "") }));
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please select a file");
    if (!form.name.trim()) return toast.error("Please enter a document name");

    setUploading(true);
    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (data:application/pdf;base64,)
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const res = await fetch(`/api/employees/${employeeId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
          fileData: base64,
          notes: form.notes || null,
        }),
      });

      if (res.ok) {
        toast.success("Document uploaded successfully");
        router.refresh();
        setShowUpload(false);
        setSelectedFile(null);
        setForm({ name: "", category: "other", notes: "" });
        if (fileRef.current) fileRef.current.value = "";
      } else {
        const err = await res.json();
        toast.error(err.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function download(doc: Doc) {
    setDownloading(doc.id);
    try {
      const res = await fetch(`/api/employees/${employeeId}/documents/${doc.id}`);
      if (!res.ok) { toast.error("Download failed"); return; }
      const data = await res.json();

      // Create blob from base64 and trigger download
      const byteChars = atob(data.fileData);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArr = new Uint8Array(byteNums);
      const blob = new Blob([byteArr], { type: data.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Download failed"); }
    finally { setDownloading(null); }
  }

  async function deleteDoc(docId: string) {
    if (!confirm("Delete this document?")) return;
    setDeleting(docId);
    try {
      const res = await fetch(`/api/employees/${employeeId}/documents/${docId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Document deleted"); router.refresh(); }
      else toast.error("Delete failed");
    } catch { toast.error("Error"); }
    finally { setDeleting(null); }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <p className="text-sm font-semibold text-white">Documents</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {documents.length} file{documents.length !== 1 ? "s" : ""} · Offer letters, NDAs, contracts & more
          </p>
        </div>
        {canUpload && (
          <button onClick={() => setShowUpload((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>
        )}
      </div>

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={upload} className="px-5 py-4 space-y-4"
          style={{ background: "rgba(124,58,237,0.05)", borderBottom: "1px solid rgba(124,58,237,0.15)" }}>
          <p className="text-xs font-semibold text-white">Upload Document for {employeeName}</p>

          {/* File picker */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Select File * (PDF, Word, Image — max 10MB)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-xl p-4 text-center cursor-pointer transition-all"
              style={{
                border: selectedFile ? "1px solid rgba(124,58,237,0.4)" : "2px dashed rgba(255,255,255,0.1)",
                background: selectedFile ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)",
              }}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl">
                    {selectedFile.type.includes("pdf") ? "📄" :
                     selectedFile.type.includes("image") ? "🖼️" :
                     selectedFile.type.includes("word") ? "📝" : "📁"}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{fmtSize(selectedFile.size)}</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="ml-auto text-xs px-2 py-1 rounded-lg"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.3)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Click to choose file</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange} className="hidden" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Document Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                className={inputCls} style={inputStyle} placeholder="e.g. Signed Offer Letter" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputCls} style={inputStyle}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Notes (optional)</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputCls} style={inputStyle} placeholder="e.g. Signed on 1 Jan 2025" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowUpload(false); setSelectedFile(null); }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancel
            </button>
            <button type="submit" disabled={uploading || !selectedFile}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              {uploading ? "Uploading…" : "Upload Document"}
            </button>
          </div>
        </form>
      )}

      {/* Document list */}
      {documents.length === 0 && !showUpload ? (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm font-medium text-white">No documents yet</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {canUpload ? "Upload offer letter, NDA, or other documents." : "No documents have been uploaded."}
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {documents.map((doc) => {
            const cat = docCategories[doc.category] ?? docCategories.other;
            // const isImg = doc.fileType.startsWith("image/");
            // const isPdf = doc.fileType === "application/pdf";
            return (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${cat.color}15` }}>
                  {cat.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${cat.color}15`, color: cat.color }}>
                      {cat.label}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {doc.fileName} · {fmtSize(doc.fileSize)}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(doc.uploadedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {doc.notes && (
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{doc.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => download(doc)}
                    disabled={downloading === doc.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
                    title="Download"
                  >
                    {downloading === doc.id ? (
                      <span className="w-3.5 h-3.5 border border-white/30 border-t-white/80 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">Download</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      disabled={deleting === doc.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      style={{ color: "rgba(248,113,113,0.5)" }}
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
