"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  department?: string | null;
  salary: number;
  designation?: string | null;
  joiningDate?: Date | null;
  cnic?: string | null;
  address?: string | null;
  city?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bloodGroup?: string | null;
  gender?: string | null;
  status?: string | null;
}

export default function EditProfileModal({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"personal" | "job" | "emergency" | "bank">("personal");

  const [form, setForm] = useState({
    name: employee.name,
    email: employee.email || "",
    phone: employee.phone || "",
    role: employee.role,
    department: employee.department || "",
    salary: String(employee.salary || ""),
    designation: employee.designation || "",
    joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split("T")[0] : "",
    cnic: employee.cnic || "",
    address: employee.address || "",
    city: employee.city || "",
    emergencyContactName: employee.emergencyContactName || "",
    emergencyContactPhone: employee.emergencyContactPhone || "",
    bankName: employee.bankName || "",
    bankAccount: employee.bankAccount || "",
    bloodGroup: employee.bloodGroup || "",
    gender: employee.gender || "",
    status: employee.status || "active",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary: parseFloat(form.salary) || 0,
          joiningDate: form.joiningDate || null,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated");
        router.refresh();
        setOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Update failed");
      }
    } catch { toast.error("Error"); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };
  const labelCls = "block text-xs font-semibold mb-1.5";
  const labelStyle = { color: "rgba(255,255,255,0.5)" };

  const TABS = [
    { key: "personal",  label: "Personal" },
    { key: "job",       label: "Job" },
    { key: "emergency", label: "Emergency" },
    { key: "bank",      label: "Bank" },
  ] as const;

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Profile
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <h2 className="text-base font-bold text-white">Edit Profile</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{employee.name}</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: tab === t.key ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                    color: tab === t.key ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                    border: tab === t.key ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={save} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* PERSONAL TAB */}
              {tab === "personal" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>Full Name *</label>
                      <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>Email</label>
                      <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>Phone</label>
                      <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>CNIC</label>
                      <input value={form.cnic} onChange={(e) => set("cnic", e.target.value)} placeholder="XXXXX-XXXXXXX-X" className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>Gender</label>
                      <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls} style={inputStyle}>
                        <option value="">Select…</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>Blood Group</label>
                      <select value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)} className={inputCls} style={inputStyle}>
                        <option value="">Select…</option>
                        {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Address</label>
                    <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>City</label>
                    <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} style={inputStyle} />
                  </div>
                </>
              )}

              {/* JOB TAB */}
              {tab === "job" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>Designation</label>
                      <input value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Sales Executive" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>Role</label>
                      <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputCls} style={inputStyle}>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>Department</label>
                      <input value={form.department} onChange={(e) => set("department", e.target.value)} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>Joining Date</label>
                      <input type="date" value={form.joiningDate} onChange={(e) => set("joiningDate", e.target.value)} className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>Salary (Rs.)</label>
                      <input type="number" value={form.salary} onChange={(e) => set("salary", e.target.value)} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>Status</label>
                      <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls} style={inputStyle}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* EMERGENCY TAB */}
              {tab === "emergency" && (
                <>
                  <div>
                    <label className={labelCls} style={labelStyle}>Emergency Contact Name</label>
                    <input value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Ali Ahmed" />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Emergency Contact Phone</label>
                    <input value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} className={inputCls} style={inputStyle} placeholder="+92 300 0000000" />
                  </div>
                </>
              )}

              {/* BANK TAB */}
              {tab === "bank" && (
                <>
                  <div>
                    <label className={labelCls} style={labelStyle}>Bank Name</label>
                    <input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. HBL, Meezan Bank" />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>Account Number / IBAN</label>
                    <input value={form.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} className={inputCls} style={inputStyle} placeholder="PKXXMEZN00000000000000000" />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
