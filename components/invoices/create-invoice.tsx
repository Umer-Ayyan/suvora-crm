"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Client { id: string; name: string; company: string; email: string | null; }
interface LineItem { description: string; quantity: string; unitPrice: string; }
const EMPTY: LineItem = { description: "", quantity: "1", unitPrice: "" };
const inp = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20";
const is = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" };
const fo = (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; };
const fb = (e: React.FocusEvent<any>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; };

export default function CreateInvoice({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [clientId, setClientId]           = useState("");
  const [clientName, setClientName]       = useState("");
  const [clientEmail, setClientEmail]     = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [dueDate, setDueDate]             = useState("");
  const [discountPct, setDiscountPct]     = useState("0");
  const [taxPct, setTaxPct]               = useState("0");
  const [notes, setNotes]                 = useState("");
  const [terms, setTerms]                 = useState("Payment due by the due date specified above.");
  const [items, setItems]                 = useState<LineItem[]>([{ ...EMPTY }]);

  function selectClient(id: string) {
    setClientId(id);
    if (!id) { setClientName(""); setClientEmail(""); setClientCompany(""); return; }
    const c = clients.find((c) => c.id === id);
    if (c) { setClientName(c.name); setClientEmail(c.email || ""); setClientCompany(c.company); }
  }
  function setItem(i: number, f: keyof LineItem, v: string) {
    setItems((p) => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  }
  function addItem() { setItems((p) => [...p, { ...EMPTY }]); }
  function removeItem(i: number) { setItems((p) => p.filter((_, idx) => idx !== i)); }

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const discount = subtotal * (Number(discountPct) / 100);
  const tax = (subtotal - discount) * (Number(taxPct) / 100);
  const total = subtotal - discount + tax;

  function reset() {
    setClientId(""); setClientName(""); setClientEmail(""); setClientCompany("");
    setDueDate(""); setDiscountPct("0"); setTaxPct("0"); setNotes("");
    setTerms("Payment due by the due date specified above.");
    setItems([{ ...EMPTY }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) { toast.error("Client name is required"); return; }
    const validItems = items.filter((i) => i.description.trim() && i.unitPrice);
    if (!validItems.length) { toast.error("Add at least one line item"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null, clientName, clientEmail, clientCompany,
          dueDate: dueDate || null,
          discountPct: Number(discountPct), taxPct: Number(taxPct),
          notes, terms,
          items: validItems.map((i) => ({ description: i.description, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invoice ${data.number} created!`);
        reset(); setOpen(false);
        router.push(`/invoices/${data.id}`);
      } else toast.error(data.error || "Failed to create");
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: "linear-gradient(135deg,#059669,#047857)", boxShadow: "0 4px 16px rgba(5,150,105,0.35)" }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        New Invoice
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[92vh]"
            style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <p className="text-base font-semibold text-white">New Invoice</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Fill in details and line items</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: "rgba(255,255,255,0.4)" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-6">
                {/* Client */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Client</p>
                  <div className="space-y-3">
                    <select value={clientId} onChange={(e) => selectClient(e.target.value)} className={inp + " cursor-pointer"} style={is} onFocus={fo} onBlur={fb}>
                      <option value="">— Select existing client (optional) —</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Contact Name *</label>
                        <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full name" className={inp} style={is} onFocus={fo} onBlur={fb} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Company</label>
                        <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Company name" className={inp} style={is} onFocus={fo} onBlur={fb} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Email</label>
                        <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" className={inp} style={is} onFocus={fo} onBlur={fb} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Due Date</label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inp} style={is} onFocus={fo} onBlur={fb} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Line Items</p>
                    <button type="button" onClick={addItem} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(5,150,105,0.15)", color: "#6ee7b7", border: "1px solid rgba(5,150,105,0.25)" }}>+ Add Item</button>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="grid grid-cols-12 gap-0 px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="col-span-6 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Description</p>
                      <p className="col-span-2 text-xs font-medium text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Qty</p>
                      <p className="col-span-2 text-xs font-medium text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Price</p>
                      <p className="col-span-2 text-xs font-medium text-right" style={{ color: "rgba(255,255,255,0.4)" }}>Amount</p>
                    </div>
                    {items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center group"
                        style={{ borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <input value={item.description} onChange={(e) => setItem(i, "description", e.target.value)} placeholder="Service description"
                          className="col-span-6 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} onFocus={fo} onBlur={fb} />
                        <input value={item.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} type="number" min="0.1" step="0.1" placeholder="1"
                          className="col-span-2 rounded-lg px-2.5 py-1.5 text-xs text-white text-center outline-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} onFocus={fo} onBlur={fb} />
                        <input value={item.unitPrice} onChange={(e) => setItem(i, "unitPrice", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
                          className="col-span-2 rounded-lg px-2.5 py-1.5 text-xs text-white text-center outline-none"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} onFocus={fo} onBlur={fb} />
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <span className="text-xs font-semibold" style={{ color: "#6ee7b7" }}>${((Number(item.quantity)||0)*(Number(item.unitPrice)||0)).toFixed(2)}</span>
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)} className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1" style={{ color: "#f87171" }}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount / Tax / Total */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Discount (%)</label>
                      <input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className={inp} style={is} onFocus={fo} onBlur={fb} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Tax / GST (%)</label>
                      <input type="number" min="0" max="100" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className={inp} style={is} onFocus={fo} onBlur={fb} />
                    </div>
                  </div>
                  <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex justify-between text-sm"><span style={{ color: "rgba(255,255,255,0.5)" }}>Subtotal</span><span className="text-white font-medium">${subtotal.toFixed(2)}</span></div>
                    {Number(discountPct) > 0 && <div className="flex justify-between text-sm"><span style={{ color: "rgba(255,255,255,0.5)" }}>Discount ({discountPct}%)</span><span style={{ color: "#fca5a5" }}>-${discount.toFixed(2)}</span></div>}
                    {Number(taxPct) > 0 && <div className="flex justify-between text-sm"><span style={{ color: "rgba(255,255,255,0.5)" }}>Tax ({taxPct}%)</span><span style={{ color: "#fcd34d" }}>+${tax.toFixed(2)}</span></div>}
                    <div className="flex justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <span className="text-sm font-semibold text-white">Total</span>
                      <span className="text-lg font-bold" style={{ color: "#6ee7b7" }}>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Notes</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." className={inp + " resize-none"} style={is} onFocus={fo} onBlur={fb} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Terms & Conditions</label>
                    <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className={inp + " resize-none"} style={is} onFocus={fo} onBlur={fb} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#059669,#047857)", boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}>
                  {loading ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
